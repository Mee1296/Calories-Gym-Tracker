const { and, desc, eq, like, sql } = require('drizzle-orm');
const { db } = require('../db');
const { dishes } = require('../db/schema');
const serialize = require('../db/serialize');
const { toPositive } = require('../utils/numbers');

const slugify = (name) => String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');

const list = async (userId, { limit = 20, query } = {}) => {
  const filters = [eq(dishes.userId, userId)];
  if (query?.trim()) filters.push(like(dishes.slug, `%${slugify(query)}%`));

  const rows = await db.select().from(dishes)
    .where(and(...filters))
    .orderBy(desc(dishes.lastUsed))
    .limit(limit);
  return rows.map(serialize.dish);
};

/**
 * Upserted on every meal log, so quick-add reflects what this user actually eats.
 * `bump: false` corrects a remembered dish without counting another serving —
 * what editing an already-logged meal should do.
 */
const remember = async (userId, meal, tx = db, { bump = true } = {}) => {
  const name = meal.name?.trim();
  if (!name) return null;

  const values = {
    userId,
    name,
    slug: slugify(name),
    calories: Math.round(toPositive(meal.calories, 0)),
    protein: Math.round(toPositive(meal.protein, 0)),
    carbs: Math.round(toPositive(meal.carbs, 0)),
    fat: Math.round(toPositive(meal.fat, 0)),
    ingredients: (meal.ingredients || []).map((i) => i.name || i).filter(Boolean),
    lastUsed: new Date(),
  };

  const [row] = await tx.insert(dishes).values(values)
    .onConflictDoUpdate({
      target: [dishes.userId, dishes.slug],
      set: {
        name: values.name,
        calories: values.calories,
        protein: values.protein,
        carbs: values.carbs,
        fat: values.fat,
        ingredients: values.ingredients,
        lastUsed: values.lastUsed,
        ...(bump ? { useCount: sql`${dishes.useCount} + 1` } : {}),
      },
    })
    .returning();

  return serialize.dish(row);
};

const remove = (userId, id) =>
  db.delete(dishes).where(and(eq(dishes.id, id), eq(dishes.userId, userId))).returning();

module.exports = { list, remember, remove, slugify };
