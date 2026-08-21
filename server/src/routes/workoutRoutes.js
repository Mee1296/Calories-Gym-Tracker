const router = require('express').Router();
const workoutController = require('../controllers/workoutController');

router.get('/', workoutController.history);
router.post('/', workoutController.create);
router.post('/last', workoutController.lastForMovements);
router.get('/last/:movementId', workoutController.lastForMovement);

module.exports = router;
