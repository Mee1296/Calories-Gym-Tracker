const router = require('express').Router();
const mealController = require('../controllers/mealController');

router.get('/', mealController.day);
router.post('/', mealController.log);
router.get('/dishes', mealController.dishes);
router.delete('/dishes/:id', mealController.removeDish);
router.delete('/:id', mealController.remove);

module.exports = router;
