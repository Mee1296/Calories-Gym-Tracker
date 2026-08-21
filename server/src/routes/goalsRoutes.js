const router = require('express').Router();
const goalsController = require('../controllers/goalsController');

router.get('/', goalsController.get);
router.put('/', goalsController.update);

module.exports = router;
