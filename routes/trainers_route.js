const router = require('express').Router();
const trainersController = require('../controllers/trainers_controller')
const authFunctions = require('../services/session');

router.get('/api/trainers', trainersController.getActiveTrainers);

module.exports = router;