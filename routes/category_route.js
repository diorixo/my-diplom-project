const router = require('express').Router();
const categoryController = require('../controllers/category_controller');

router.get('/get_categories', categoryController.getCategories);

module.exports = router;