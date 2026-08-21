const router = require('express').Router();
const withDb = require('../middleware/withDb');
const { authenticate } = require('../middleware/auth');

router.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// Every data route needs a live connection first.
router.use(withDb);

router.use('/auth', require('./authRoutes'));

// Everything below is user-scoped.
router.use(authenticate);
router.use('/movements', require('./movementRoutes'));
router.use('/routines', require('./routineRoutes'));
router.use('/workouts', require('./workoutRoutes'));
router.use('/weights', require('./weightRoutes'));
router.use('/meals', require('./mealRoutes'));
router.use('/goals', require('./goalsRoutes'));
router.use('/nutrition', require('./nutritionRoutes'));
router.use('/stats', require('./statsRoutes'));

module.exports = router;
