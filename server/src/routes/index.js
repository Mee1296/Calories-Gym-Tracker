const router = require('express').Router();
const withDb = require('../middleware/withDb');
const { getClient } = require('../db');
const { authenticate } = require('../middleware/auth');
const { authLimiter, aiLimiter, apiLimiter } = require('../middleware/rateLimit');

/**
 * Liveness by default — is the process up. `?deep=1` also proves the database
 * is reachable, which the plain check deliberately does not: a container
 * healthcheck that fails on a brief database blip would restart a server that
 * is fine, so depth is opt-in for readiness probes and manual checks.
 */
router.get('/health', async (req, res) => {
  const body = { status: 'ok', uptime: process.uptime() };
  if (!('deep' in req.query)) return res.json(body);

  const started = Date.now();
  try {
    await getClient()`select 1`;
    return res.json({ ...body, database: { ok: true, ms: Date.now() - started } });
  } catch (err) {
    return res.status(503).json({ ...body, status: 'degraded', database: { ok: false, error: err.message } });
  }
});

// Every data route needs a live connection first.
router.use(withDb);

router.use('/auth', authLimiter, require('./authRoutes'));

// Everything below is user-scoped.
router.use(authenticate);
router.use(apiLimiter);
router.use('/movements', require('./movementRoutes'));
router.use('/routines', require('./routineRoutes'));
router.use('/workouts', require('./workoutRoutes'));
router.use('/weights', require('./weightRoutes'));
router.use('/meals', require('./mealRoutes'));
router.use('/goals', require('./goalsRoutes'));
router.use('/nutrition', aiLimiter, require('./nutritionRoutes'));
router.use('/stats', require('./statsRoutes'));

module.exports = router;
