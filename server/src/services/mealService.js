const { and, asc, eq, gte, sql } = require('drizzle-orm');
const { db } = require('../db');
const { meals } = require('../db/schema');
const serialize = require('../db/serialize');
const dishService = require('./dishService');
const ApiError = require('../utils/ApiError');
const { toPositive } = require('../utils/numbers');
const { dayKey, daysAgo } = require('../utils/dates');

const EMPTY_TOTALS = { calories: 0, protein: 0, carbs: 0, fat: 0 };

const totalsOf = (list) => list.reduce((acc, m) => ({
  calories: acc.calories + m.calories,
  protein: acc.protein + m.protein,
  carbs: acc.carbs + m.carbs,
  fat: acc.fat + m.fat,
}), { ...EMPTY_TOTALS });

const listForDay = async (userId, date) => {
  const rows = await db.select().from(meals)
    .where(and(eq(meals.userId, userId), eq(meals.date, dayKey(date))))
    .orderBy(asc(meals.loggedAt));
  const list = rows.map(serialize.meal);
  return { meals: list, totals: list.length ? totalsOf(list) : { ...EMPTY_TOTALS } };
};

/**
 * Ingredients win when they carry macros; otherwise the caller's totals are
 * used, with calories derived from macros (4/4/9) when left blank.
 */
const resolveMacros = (payload) => {
  const ingredients = (payload.ingredients || [])
    .filter((i) => i?.name?.trim())
    .map((i) => ({
      name: i.name.trim(),
      calories: toPositive(i.calories, 0),
      protein: toPositive(i.protein, 0),
      carbs: toPositive(i.carbs, 0),
      fat: toPositive(i.fat, 0),
    }));

  if (ingredients.some((i) => i.calories || i.protein || i.carbs || i.fat)) {
    const t = totalsOf(ingredients);
    return {
      ingredients,
      calories: Math.round(t.calories),
      protein: Math.round(t.protein),
      carbs: Math.round(t.carbs),
      fat: Math.round(t.fat),
    };
  }

  const protein = toPositive(payload.protein, 0);
  const carbs = toPositive(payload.carbs, 0);
  const fat = toPositive(payload.fat, 0);
  const explicit = toPositive(payload.calories, 0);

  return {
    ingredients,
    calories: Math.round(explicit > 0 ? explicit : protein * 4 + carbs * 4 + fat * 9),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
  };
};

/** The meal row and its dish-library entry are written in one transaction. */
const log = async (userId, payload) => {
  const name = payload.name?.trim();
  if (!name) throw ApiError.badRequest('Give the meal a name');

  const macros = resolveMacros(payload);
  if (macros.calories <= 0) throw ApiError.badRequest('A meal needs at least some calories');

  return db.transaction(async (tx) => {
    const [row] = await tx.insert(meals).values({
      userId,
      name,
      calories: macros.calories,
      protein: macros.protein,
      carbs: macros.carbs,
      fat: macros.fat,
      ingredients: macros.ingredients,
      source: ['manual', 'quick', 'ai'].includes(payload.source) ? payload.source : 'manual',
      date: dayKey(payload.date),
      loggedAt: new Date(),
    }).returning();

    await dishService.remember(userId, { name, ...macros }, tx);
    return serialize.meal(row);
  });
};

/**
 * A full replace, not a partial patch: the client edits a resolved draft and
 * sends the whole meal back, exactly as it does when logging one.
 *
 * The dish library is corrected too — fixing a meal's macros should fix the
 * quick-add entry it came from — but without bumping `useCount`, since an edit
 * is not another serving.
 */
const update = async (userId, id, payload) => {
  const [existing] = await db.select().from(meals)
    .where(and(eq(meals.id, id), eq(meals.userId, userId)))
    .limit(1);
  if (!existing) throw ApiError.notFound('Meal not found');

  const name = (payload.name ?? existing.name)?.trim();
  if (!name) throw ApiError.badRequest('Give the meal a name');

  const macros = resolveMacros(payload);
  if (macros.calories <= 0) throw ApiError.badRequest('A meal needs at least some calories');

  return db.transaction(async (tx) => {
    const [row] = await tx.update(meals).set({
      name,
      calories: macros.calories,
      protein: macros.protein,
      carbs: macros.carbs,
      fat: macros.fat,
      ingredients: macros.ingredients,
      ...(payload.date ? { date: dayKey(payload.date) } : {}),
    }).where(eq(meals.id, id)).returning();

    await dishService.remember(userId, { name, ...macros }, tx, { bump: false });
    return serialize.meal(row);
  });
};

const remove = async (userId, id) => {
  const [row] = await db.delete(meals)
    .where(and(eq(meals.id, id), eq(meals.userId, userId)))
    .returning();
  if (!row) throw ApiError.notFound('Meal not found');
  return serialize.meal(row);
};

/**
 * Per-day totals over a window. This was a full table read grouped into a Map
 * in Node; it is now one indexed aggregate.
 */
const dailyTotals = async (userId, days = 28) => {
  const rows = await db.select({
    date: meals.date,
    calories: sql`sum(${meals.calories})::int`.as('calories'),
    protein: sql`sum(${meals.protein})::int`.as('protein'),
    carbs: sql`sum(${meals.carbs})::int`.as('carbs'),
    fat: sql`sum(${meals.fat})::int`.as('fat'),
  }).from(meals)
    .where(and(eq(meals.userId, userId), gte(meals.date, dayKey(daysAgo(days - 1)))))
    .groupBy(meals.date)
    .orderBy(asc(meals.date));

  return rows;
};

module.exports = { listForDay, log, update, remove, dailyTotals, totalsOf };
