const { and, eq, gte, sql } = require('drizzle-orm');
const { db } = require('../db');
const { workouts } = require('../db/schema');
const workoutService = require('./workoutService');
const weightService = require('./weightService');
const mealService = require('./mealService');
const goalsService = require('./goalsService');
const { daysAgo, dayKey } = require('../utils/dates');

const round1 = (n) => Math.round(n * 10) / 10;

/** Everything the Progress screen shows, all derived from real history. */
const overview = async (userId, { days = 28 } = {}) => {
  const since = daysAgo(days);

  const [weights, totals, windowed, allDates, { goals }, pr] = await Promise.all([
    weightService.history(userId, { days }),
    mealService.dailyTotals(userId, days),
    // One aggregate instead of pulling every workout row into Node.
    db.select({
      count: sql`count(*)::int`.as('count'),
      volume: sql`coalesce(sum(${workouts.volume}), 0)::int`.as('volume'),
      sets: sql`coalesce(sum(${workouts.totalSets}), 0)::int`.as('sets'),
    }).from(workouts).where(and(eq(workouts.userId, userId), gte(workouts.startedAt, since))),
    db.select({ startedAt: workouts.startedAt }).from(workouts).where(eq(workouts.userId, userId)),
    goalsService.get(userId),
    workoutService.latestPR(userId),
  ]);

  const first = weights[0];
  const last = weights[weights.length - 1];
  const stats = windowed[0] || { count: 0, volume: 0, sets: 0 };

  // A day counts as on-target when calories land within 10% of the goal.
  const loggedDays = totals.filter((d) => d.calories > 0);
  const onTarget = loggedDays.filter((d) => Math.abs(d.calories - goals.calories) <= goals.calories * 0.1);

  return {
    windowDays: days,
    weight: {
      current: last ? round1(last.kg) : null,
      delta: first && last ? round1(last.kg - first.kg) : null,
      entries: weights.length,
    },
    workouts: {
      inWindow: stats.count,
      total: allDates.length,
      volume: stats.volume,
      sets: stats.sets,
      streakWeeks: workoutService.weeklyStreak(allDates.map((w) => w.startedAt)),
    },
    nutrition: {
      daysLogged: loggedDays.length,
      adherence: loggedDays.length ? Math.round((onTarget.length / loggedDays.length) * 100) : null,
      avgCalories: loggedDays.length
        ? Math.round(loggedDays.reduce((a, d) => a + d.calories, 0) / loggedDays.length)
        : null,
    },
    latestPR: pr,
  };
};

module.exports = { overview };
