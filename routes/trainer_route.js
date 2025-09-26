const router = require('express').Router();
const trainerController = require('../controllers/trainer_controller')
const authFunctions = require('../services/session');

router.get('/get_trainer', authFunctions.authenticateToken, trainerController.getTrainerData);
router.post('/update_trainer', authFunctions.authenticateToken, trainerController.updateTrainer);
router.get('/trainer/get_trainer_active_trainings', authFunctions.authenticateToken, trainerController.getTrainerActiveTrainings);
router.get('/trainer/get_trainer_trainings', authFunctions.authenticateToken, trainerController.getTrainerTrainings);
router.get('/trainer/get_reviews', authFunctions.authenticateToken, trainerController.getTrainerReviews);

module.exports = router;