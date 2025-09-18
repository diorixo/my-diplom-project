const router = require('express').Router();
const trainingController = require('../controllers/training_controller')
const authFunctions = require('../services/session');

router.post('/trainer/create_training', authFunctions.authenticateToken, trainingController.addTraining);
router.post('/trainer/delete_training', authFunctions.authenticateToken, trainingController.deleteTraining);
router.post('/trainer/update_training', authFunctions.authenticateToken, trainingController.updateTraining);
router.get('/get_active_trainers', trainingController.getActiveTrainers);
router.get('/get_active_trainings', trainingController.getActiveTrainings);

module.exports = router;