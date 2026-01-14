const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budgetController');

// Define the endpoints
router.get('/list', budgetController.getBudgets);
router.post('/set', budgetController.setBudget);

module.exports = router;
