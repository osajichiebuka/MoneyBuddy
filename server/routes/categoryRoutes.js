const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

router.get('/list', categoryController.getCategories);
router.post('/create', categoryController.createCategory);
router.post('/predict', categoryController.predictCategory); // <--- NEW

module.exports = router;