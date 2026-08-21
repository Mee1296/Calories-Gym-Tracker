const router = require('express').Router();
const weightController = require('../controllers/weightController');

router.get('/', weightController.history);
router.post('/', weightController.log);
router.delete('/:id', weightController.remove);

module.exports = router;
