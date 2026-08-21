const { and, asc, eq, gte } = require('drizzle-orm');
const { db } = require('../db');
const { weights } = require('../db/schema');
const serialize = require('../db/serialize');
const ApiError = require('../utils/ApiError');
const { toPositive } = require('../utils/numbers');
const { dayKey, daysAgo } = require('../utils/dates');

const history = async (userId, { days } = {}) => {
  const filters = [eq(weights.userId, userId)];
  if (days) filters.push(gte(weights.date, dayKey(daysAgo(days))));

  const rows = await db.select().from(weights)
    .where(and(...filters))
    .orderBy(asc(weights.date));
  return rows.map(serialize.weight);
};

/**
 * One entry per day. The unique (user_id, date) constraint makes this a real
 * upsert rather than the read-then-write dance Mongo needed.
 */
const log = async (userId, { kg, date }) => {
  const value = toPositive(kg);
  if (value <= 0) throw ApiError.badRequest('Enter a body weight above 0');
  if (value > 700) throw ApiError.badRequest('That body weight looks out of range');

  const [row] = await db.insert(weights)
    .values({ userId, kg: String(value), date: dayKey(date) })
    .onConflictDoUpdate({
      target: [weights.userId, weights.date],
      set: { kg: String(value) },
    })
    .returning();

  return serialize.weight(row);
};

const remove = async (userId, id) => {
  const [row] = await db.delete(weights)
    .where(and(eq(weights.id, id), eq(weights.userId, userId)))
    .returning();
  if (!row) throw ApiError.notFound('Weight entry not found');
  return serialize.weight(row);
};

module.exports = { history, log, remove };
