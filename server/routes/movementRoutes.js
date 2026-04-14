const express = require('express');
const router = express.Router();
const movementController = require('../controllers/movementController');
const { authenticateToken, isAdmin } = require('../middleware/auth');

router.get('/', authenticateToken, movementController.getMovements);
router.post('/', authenticateToken, isAdmin, movementController.createMovement);

module.exports = router;
