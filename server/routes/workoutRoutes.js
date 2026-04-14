const express = require('express');
const router = express.Router();
const workoutController = require('../controllers/workoutController');
const { authenticateToken } = require('../middleware/auth');

router.post('/finish', authenticateToken, workoutController.finishWorkout);
router.get('/last/:movementId', authenticateToken, workoutController.getLastWorkoutByMovement);

module.exports = router;
