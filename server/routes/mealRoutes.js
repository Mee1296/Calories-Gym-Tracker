const express = require('express');
const router = express.Router();
const mealController = require('../controllers/mealController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, mealController.getDailyData);
router.get('/dishes', authenticateToken, mealController.getSavedDishes);
router.post('/log', authenticateToken, mealController.logMeal);
router.post('/ai', authenticateToken, mealController.aiParseMeal);
router.post('/suggest-goals', authenticateToken, mealController.aiSuggestGoals);
router.put('/goals', authenticateToken, mealController.updateGoals);

module.exports = router;
