const router = require('express').Router();
const trainingController = require('../controllers/training_controller')
const authFunctions = require('../services/session');

router.post('/trainer/create_training', authFunctions.authenticateToken, trainingController.addTraining);
router.delete('/trainer/training/:id', authFunctions.authenticateToken, trainingController.deleteTraining);
router.post('/trainer/update_training', authFunctions.authenticateToken, trainingController.updateTraining);
router.post('/trainer/training_set_status_complete', authFunctions.authenticateToken, trainingController.setTrainingStatusComplete);
router.get('/get_active_trainers', trainingController.getActiveTrainers);
router.get('/get_all_trainers', trainingController.getAllTrainers);
router.get('/get_active_trainings', trainingController.getActiveTrainings);
router.get('/trainer/training/:trainingId/participants', authFunctions.authenticateToken, trainingController.getTrainingParticipants);

module.exports = router;