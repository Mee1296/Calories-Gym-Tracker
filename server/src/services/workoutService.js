const { and, asc, desc, eq, inArray, sql } = require('drizzle-orm');
const { db } = require('../db');
const { workouts, workoutExercises, workoutSets } = require('../db/schema');
const serialize = require('../db/serialize');
const movementService = require('./movementService');
const ApiError = require('../utils/ApiError');
const { toPositive, toInt } = require('../utils/numbers');
const { startOfDay, dayKey } = require('../utils/dates');

/** Epley estimated 1RM, so sets with different rep schemes are comparable. */
const estimate1RM = (weight, reps) => (reps > 0 ? weight * (1 + reps / 30) : 0);

const bestSetOf = (sets) => sets.reduce(
  (best, set) => (estimate1RM(set.weight, set.reps) > estimate1RM(best.weight, best.reps) ? set : best),
  { weight: 0, reps: 0 },
);

/** SQL expression for estimated 1RM — the ranking used for PR detection. */
const E1RM = sql`${workoutSets.weight} * (1 + ${workoutSets.reps} / 30.0)`;

const buildExercises = async (userId, exercises) => {
  if (!Array.isArray(exercises)) throw ApiError.badRequest('exercises must be an array');

  const byId = await movementService.mapByIds(userId, exercises.map((e) => e.movementId));

  return exercises
    .map((entry) => {
      const movement = byId.get(String(entry.movementId));
      if (!movement) throw ApiError.badRequest(`Unknown movement: ${entry.movementId}`);
      return {
        movementId: movement.id,
        name: movement.name,
        sets: (entry.sets || [])
          .map((s) => ({ weight: toPositive(s.weight), reps: toInt(s.reps) }))
          .filter((s) => s.reps > 0),
      };
    })
    .filter((e) => e.sets.length > 0);
};

/**
 * Best estimated 1RM per movement across prior sessions.
 *
 * The Mongo version of this silently matched nothing, because aggregation
 * pipelines do not cast the JWT's string userId to an ObjectId — so every lift
 * looked like a record. Here the parameter is typed by the driver.
 */
const previousBests = async (userId, movementIds) => {
  if (movementIds.length === 0) return new Map();

  const rows = await db.select({
    movementId: workoutExercises.movementId,
    best: sql`max(${E1RM})`.as('best'),
  })
    .from(workoutSets)
    .innerJoin(workoutExercises, eq(workoutExercises.id, workoutSets.workoutExerciseId))
    .innerJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
    .where(and(eq(workouts.userId, userId), inArray(workoutExercises.movementId, movementIds)))
    .groupBy(workoutExercises.movementId);

  return new Map(rows.map((r) => [r.movementId, Number(r.best)]));
};

/** Workout, its exercises and all their sets are written in one transaction. */
const create = async (userId, payload) => {
  const exercises = await buildExercises(userId, payload.exercises);
  if (exercises.length === 0) throw ApiError.badRequest('Log at least one set before finishing');

  const startedAt = payload.startedAt ? new Date(payload.startedAt) : new Date();
  const endedAt = payload.endedAt ? new Date(payload.endedAt) : new Date();
  const duration = Number.isFinite(payload.duration)
    ? Math.max(0, Math.round(payload.duration))
    : Math.max(0, Math.round((endedAt - startedAt) / 1000));

  const allSets = exercises.flatMap((e) => e.sets);
  const volume = Math.round(allSets.reduce((acc, s) => acc + s.weight * s.reps, 0));

  // Compare against history before this workout is inserted.
  const bests = await previousBests(userId, exercises.map((e) => e.movementId));
  const prs = exercises
    .map((exercise) => {
      const best = bestSetOf(exercise.sets);
      if (best.weight <= 0) return null;
      if (estimate1RM(best.weight, best.reps) <= (bests.get(exercise.movementId) || 0)) return null;
      return { movement: exercise.name, weight: best.weight, reps: best.reps };
    })
    .filter(Boolean);

  const saved = await db.transaction(async (tx) => {
    const [workout] = await tx.insert(workouts).values({
      userId,
      name: payload.name?.trim() || 'Quick Workout',
      routineId: payload.routineId || null,
      startedAt,
      endedAt,
      duration,
      totalSets: allSets.length,
      volume,
    }).returning();

    const exerciseRows = await tx.insert(workoutExercises).values(
      exercises.map((e, position) => ({
        workoutId: workout.id, movementId: e.movementId, name: e.name, position,
      })),
    ).returning();

    const setRows = exercises.flatMap((e, i) => e.sets.map((s, position) => ({
      workoutExerciseId: exerciseRows[i].id,
      weight: String(s.weight),
      reps: s.reps,
      position,
    })));
    if (setRows.length) await tx.insert(workoutSets).values(setRows);

    return serialize.workout(workout, exercises.map((e) => ({ ...e, sets: e.sets })));
  });

  return { workout: saved, prs };
};

/** Loads exercises + sets for a set of workouts in two queries, not N+1. */
const attachExercises = async (workoutRows) => {
  if (workoutRows.length === 0) return [];
  const ids = workoutRows.map((w) => w.id);

  const rows = await db.select({
    workoutId: workoutExercises.workoutId,
    exerciseId: workoutExercises.id,
    movementId: workoutExercises.movementId,
    name: workoutExercises.name,
    exercisePosition: workoutExercises.position,
    weight: workoutSets.weight,
    reps: workoutSets.reps,
    setPosition: workoutSets.position,
  })
    .from(workoutExercises)
    .leftJoin(workoutSets, eq(workoutSets.workoutExerciseId, workoutExercises.id))
    .where(inArray(workoutExercises.workoutId, ids))
    .orderBy(asc(workoutExercises.position), asc(workoutSets.position));

  const byWorkout = new Map(ids.map((id) => [id, new Map()]));
  for (const row of rows) {
    const exercises = byWorkout.get(row.workoutId);
    if (!exercises.has(row.exerciseId)) {
      exercises.set(row.exerciseId, { movementId: row.movementId, name: row.name, sets: [] });
    }
    if (row.reps !== null) {
      exercises.get(row.exerciseId).sets.push({ weight: row.weight, reps: row.reps });
    }
  }

  return workoutRows.map((w) => serialize.workout(w, [...byWorkout.get(w.id).values()]));
};

const history = async (userId, limit = 30) => {
  const rows = await db.select().from(workouts)
    .where(eq(workouts.userId, userId))
    .orderBy(desc(workouts.startedAt), desc(workouts.id))
    .limit(limit);
  return attachExercises(rows);
};

/** Sets logged the last time each movement was trained, keyed by movement id. */
const lastSetsForMany = async (userId, movementIds) => {
  const ids = [...new Set((movementIds || []).filter(Boolean).map(String))];
  if (ids.length === 0) return {};

  // One row per movement: the most recent workout that contains it.
  const latest = db.$with('latest').as(
    db.select({
      movementId: workoutExercises.movementId,
      exerciseId: workoutExercises.id,
      startedAt: workouts.startedAt,
      rank: sql`row_number() over (
        partition by ${workoutExercises.movementId}
        order by ${workouts.startedAt} desc, ${workouts.id} desc
      )`.as('rank'),
    })
      .from(workoutExercises)
      .innerJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
      .where(and(eq(workouts.userId, userId), inArray(workoutExercises.movementId, ids))),
  );

  const rows = await db.with(latest).select({
    movementId: latest.movementId,
    startedAt: latest.startedAt,
    weight: workoutSets.weight,
    reps: workoutSets.reps,
    position: workoutSets.position,
  })
    .from(latest)
    .innerJoin(workoutSets, eq(workoutSets.workoutExerciseId, latest.exerciseId))
    .where(eq(latest.rank, 1))
    .orderBy(asc(workoutSets.position));

  const result = {};
  for (const row of rows) {
    if (!result[row.movementId]) result[row.movementId] = { date: row.startedAt, sets: [] };
    result[row.movementId].sets.push({ weight: Number(row.weight), reps: row.reps });
  }
  return result;
};

const lastSetsFor = async (userId, movementId) => {
  const result = await lastSetsForMany(userId, [movementId]);
  return result[movementId] || null;
};

/** Consecutive-week training streak, counting back from this week. */
const weeklyStreak = (workoutDates) => {
  if (!workoutDates.length) return 0;
  const weekOf = (date) => {
    const d = startOfDay(date);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday
    return dayKey(d);
  };
  const weeks = new Set(workoutDates.map(weekOf));
  const cursor = startOfDay(new Date());
  cursor.setDate(cursor.getDate() - ((cursor.getDay() + 6) % 7));

  let streak = 0;
  // An empty current week does not break a run that is otherwise intact.
  if (!weeks.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 7);
  while (weeks.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 7);
  }
  return streak;
};

/**
 * The set that most recently established a record for its movement.
 * Ranks every set by e1RM per movement, then keeps whichever best is newest.
 */
const latestPR = async (userId) => {
  const ranked = db.$with('ranked').as(
    db.select({
      movementId: workoutExercises.movementId,
      name: workoutExercises.name,
      weight: workoutSets.weight,
      reps: workoutSets.reps,
      startedAt: workouts.startedAt,
      rank: sql`row_number() over (
        partition by ${workoutExercises.movementId}
        order by ${E1RM} desc, ${workouts.startedAt} asc
      )`.as('rank'),
    })
      .from(workoutSets)
      .innerJoin(workoutExercises, eq(workoutExercises.id, workoutSets.workoutExerciseId))
      .innerJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
      .where(and(eq(workouts.userId, userId), sql`${workoutSets.weight} > 0`)),
  );

  const [row] = await db.with(ranked).select().from(ranked)
    .where(eq(ranked.rank, 1))
    .orderBy(desc(ranked.startedAt))
    .limit(1);

  if (!row) return null;
  return {
    movement: row.name,
    weight: Number(row.weight),
    reps: row.reps,
    date: row.startedAt,
  };
};

module.exports = {
  create, history, lastSetsFor, lastSetsForMany,
  weeklyStreak, latestPR, estimate1RM, previousBests,
};
