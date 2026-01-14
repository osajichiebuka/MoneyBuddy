require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { createClient } = require('@supabase/supabase-js');
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const budgetRoutes = require('./routes/budgetRoutes');

// ==========================================
// 1. CONFIGURATION
// ==========================================
const app = express();
const port = process.env.PORT || 5000;

// Initialize Supabase Client (Backend Context)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service Role Key for Admin tasks

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️  Supabase credentials missing in .env file');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// 2. MIDDLEWARE
// ==========================================
app.use(helmet()); // Secure HTTP headers
app.use(cors()); // Allow cross-origin requests
app.use(morgan('dev')); // Logger
app.use(express.json()); // Parse JSON bodies
// ==========================================
// 3. ROUTES
// ==========================================

// Mount Auth Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/budgets', budgetRoutes);


// Health Check
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'active',
    service: 'Money Buddy API',
    version: '2.1.0',
    timestamp: new Date().toISOString()
  });
});

// Test DB Connection
app.get('/api/test-db', async (req, res) => {
  try {
    const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    if (error) throw error;
    res.json({ message: 'Database connection successful', status: 'connected' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. SERVER START
// ==========================================
app.listen(port, () => {
  console.log(`🚀 Money Buddy Backend running on http://localhost:${port}`);
});