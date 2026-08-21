const router = require('express').Router();
const nutritionController = require('../controllers/nutritionController');

router.get('/status', nutritionController.status);
router.post('/estimate', nutritionController.estimateMeal);
router.post('/suggest-goals', nutritionController.suggestGoals);

module.exports = router;
