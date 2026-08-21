const router = require('express').Router();
const statsController = require('../controllers/statsController');

router.get('/overview', statsController.overview);

module.exports = router;
