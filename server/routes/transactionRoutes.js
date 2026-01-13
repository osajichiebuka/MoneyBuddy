const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// Define the endpoints
router.post('/add', transactionController.addTransaction);
router.get('/dashboard', transactionController.getDashboard);

module.exports = router;