const { connectDB } = require('../db');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Ensures the pool has been opened once before any data route runs.
 *
 * This used to `select 1` on every request, which cost a full round trip to
 * Supabase — on a Tokyo pooler that is ~180ms added to each call, often more
 * than the real query. postgres.js reconnects on its own, so verifying once is
 * enough; a connection that dies later surfaces as a normal query error.
 */
let ready = null;

module.exports = asyncHandler(async (req, res, next) => {
  if (!ready) {
    ready = connectDB().catch((err) => {
      ready = null; // let the next request retry rather than caching the failure
      throw err;
    });
  }
  await ready;
  next();
});
