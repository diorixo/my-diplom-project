const router = require('express').Router();
const trainerController = require('../controllers/trainer_controller')
const authFunctions = require('../services/session');

router.get('/get_trainer', authFunctions.authenticateToken, trainerController.getTrainerData);
router.post('/update_trainer', authFunctions.authenticateToken, trainerController.updateTrainer);

module.exports = router;