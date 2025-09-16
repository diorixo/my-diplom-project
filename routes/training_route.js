const router = require('express').Router();
const trainingController = require('../controllers/training_controller')
const authFunctions = require('../services/session');

router.post('/add_training', authFunctions.authenticateToken, trainingController.addTraining);
router.post('/delete_training', authFunctions.authenticateToken, trainingController.deleteTraining);
router.post('/update_training', authFunctions.authenticateToken, trainingController.updateTraining);

module.exports = router;