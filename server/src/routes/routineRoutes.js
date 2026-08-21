const router = require('express').Router();
const routineController = require('../controllers/routineController');

router.get('/', routineController.list);
router.post('/', routineController.create);
router.patch('/:id', routineController.update);
router.delete('/:id', routineController.remove);

module.exports = router;
