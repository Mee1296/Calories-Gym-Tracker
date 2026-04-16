const express = require('express');
const router = express.Router();
const weightController = require('../controllers/weightController');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, weightController.logWeight);
router.get('/', authenticateToken, weightController.getWeightHistory);

module.exports = router;
