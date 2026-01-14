const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// Define the endpoints
router.post('/add', transactionController.addTransaction);
router.get('/dashboard', transactionController.getDashboard);

// ... existing routes ...
router.delete('/delete/:id', transactionController.deleteTransaction); // <--- Add this
router.put('/update/:id', transactionController.updateTransaction);
module.exports = router;