const router = require('express').Router();
const userController = require('../controllers/user_controller')
const authFunctions = require('../services/session');

router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.get('/get_user', authFunctions.authenticateToken, userController.getUserData);
router.post('/update_user', authFunctions.authenticateToken, userController.updateUser);

module.exports = router;