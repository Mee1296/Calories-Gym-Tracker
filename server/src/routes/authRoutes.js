const router = require('express').Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.get('/config', authController.config);
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticate, authController.me);

module.exports = router;
