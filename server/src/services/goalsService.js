const { eq } = require('drizzle-orm');
const { db } = require('../db');
const { users } = require('../db/schema');
const serialize = require('../db/serialize');
const ApiError = require('../utils/ApiError');
const { toPositive } = require('../utils/numbers');

const get = async (userId) => {
  const [row] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!row) throw ApiError.notFound('User not found');
  return { goals: serialize.goals(row), profile: serialize.user(row).profile };
};

const update = async (userId, { calories, protein, carbs, fat }) => {
  const goalCalories = Math.round(toPositive(calories, 0));
  if (goalCalories <= 0) throw ApiError.badRequest('Calorie goal must be above 0');

  const [row] = await db.update(users).set({
    goalCalories,
    goalProtein: Math.round(toPositive(protein, 0)),
    goalCarbs: Math.round(toPositive(carbs, 0)),
    goalFat: Math.round(toPositive(fat, 0)),
    updatedAt: new Date(),
  }).where(eq(users.id, userId)).returning();

  if (!row) throw ApiError.notFound('User not found');
  return serialize.goals(row);
};

/** Remembers the metrics behind an AI suggestion so the form prefills next time. */
const saveProfile = async (userId, metrics) => {
  const patch = {};
  if (metrics.heightCm) patch.profileHeightCm = String(toPositive(metrics.heightCm));
  if (metrics.age) patch.profileAge = Math.round(toPositive(metrics.age));
  if (['male', 'female', 'other'].includes(metrics.gender)) patch.profileGender = metrics.gender;
  if (metrics.bodyFat) patch.profileBodyFat = String(toPositive(metrics.bodyFat));
  if (metrics.activityLevel) patch.profileActivityLevel = metrics.activityLevel;
  if (metrics.goal) patch.profileGoal = metrics.goal;

  if (Object.keys(patch).length === 0) return null;

  const [row] = await db.update(users)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();
  return row ? serialize.user(row).profile : null;
};

module.exports = { get, update, saveProfile };
