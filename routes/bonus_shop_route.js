const router = require('express').Router();
const bonusShopController = require('../controllers/bonus_shop_controller')
const authFunctions = require('../services/session');

router.get('/balance', authFunctions.authenticateToken, bonusShopController.getUserBalance);
router.get('/products', bonusShopController.getAllProducts);
router.post('/purchase', authFunctions.authenticateToken, bonusShopController.processPurchase);

module.exports = router;