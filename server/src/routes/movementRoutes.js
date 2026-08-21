const router = require('express').Router();
const movementController = require('../controllers/movementController');

router.get('/', movementController.list);
router.post('/', movementController.create);
router.get('/:id/usage', movementController.usage);
router.patch('/:id', movementController.update);
router.delete('/:id', movementController.remove);

module.exports = router;
