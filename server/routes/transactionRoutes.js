const express = require('express');
const router = express.Router();
const multer = require('multer');
const transactionController = require('../controllers/transactionController');

// Setup Multer (Store in memory to pass buffer to parser immediately)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Define the endpoints
router.post('/upload-statement', upload.single('statement'), transactionController.uploadStatement);
router.post('/add', transactionController.addTransaction);
router.get('/dashboard', transactionController.getDashboard);

// ... existing routes ...
router.delete('/delete/:id', transactionController.deleteTransaction); // <--- Add this
router.put('/update/:id', transactionController.updateTransaction);
module.exports = router;