const supabase = require('../config/supabaseClient');
const { parseBankStatement } = require('../services/pdfParserService');

exports.uploadStatement = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user?.id || req.body.user_id; // Handle both auth middleware and manual ID

    // 1. Parse PDF
    console.log('Parsing PDF...');
    const rawTransactions = await parseBankStatement(req.file.buffer);

    if (rawTransactions.length === 0) {
      return res.status(400).json({ message: 'No transactions found. Check PDF format.' });
    }

    // 2. Auto-Categorize & Prepare for DB
    // We fetch the global index once to avoid loop querying
    const { data: globalIndex } = await supabase.from('global_vendor_index').select('*');

    const preparedTransactions = rawTransactions.map(tx => {
      // Simple keyword matching logic
      const matchedVendor = globalIndex?.find(vendor =>
        tx.description.toLowerCase().includes(vendor.keyword.toLowerCase())
      );

      return {
        user_id: userId,
        amount: tx.amount,
        direction: tx.type === 'income' ? 'INCOME' : 'EXPENSE', // Normalize to DB schema
        vendor_name: tx.description, // Map description to vendor_name
        status: 'CONFIRMED',
        date: new Date(tx.date).toISOString(), // Ensure Postgres format
        category_id: matchedVendor ? matchedVendor.category_id : null, // Auto-assign or null
        source_type: 'STATEMENT_IMPORT' // Helpful to track where data came from
      };
    });

    // 3. Bulk Insert into Supabase
    const { data, error } = await supabase
      .from('transactions')
      .insert(preparedTransactions)
      .select();

    if (error) throw error;

    res.status(200).json({
      message: 'Statement processed successfully',
      imported_count: data.length,
      transactions: data
    });

  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.addTransaction = async (req, res) => {
  console.log("--> addTransaction Body:", req.body); // DEBUG LOG
  const { user_id, amount, type, description, date, category_id } = req.body;

  // MAP SIMPLE INPUTS TO YOUR ADVANCED SCHEMA
  // 1. Map 'type' to your DB 'direction' 

  const direction = type === 'income' ? 'INCOME' : 'EXPENSE';

  // 2. Default Status
  const status = 'CONFIRMED';

  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert([
        {
          user_id,
          amount,
          direction,         // Matches your schema
          vendor_name: description, // We use 'description' as 'vendor_name' for now
          status,            // 'CONFIRMED'
          date: date || new Date().toISOString(),
          source_type: 'MANUAL_INPUT',
          category_id: category_id || null // <--- Save it!
        }
      ]);

    if (error) throw error;

    res.status(201).json({ message: 'Transaction saved!', data });
  } catch (error) {
    console.error("Transaction Error:", error);
    res.status(400).json({ error: error.message });
  }
};

exports.getDashboard = async (req, res) => {
  const { user_id } = req.query;

  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, category:categories(*)') // <--- JOIN Categories
      .eq('user_id', user_id)
      .order('date', { ascending: false });

    if (error) throw error;
    if (data && data.length > 0) console.log("Dashboard Fetch Sample:", data[0]); // DEBUG LOG

    let totalIncome = 0;
    let totalExpense = 0;

    data.forEach(txn => {
      // Check your ENUM here too!
      if (txn.direction === 'INCOME') totalIncome += parseFloat(txn.amount);
      if (txn.direction === 'EXPENSE') totalExpense += parseFloat(txn.amount);
    });

    const balance = totalIncome - totalExpense;

    res.status(200).json({
      balance,
      income: totalIncome,
      expense: totalExpense,
      recentTransactions: data.slice(0, 5)
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
// Delete a transaction
exports.deleteTransaction = async (req, res) => {
  const { id } = req.params;
  const { user_id } = req.query; // Security check

  try {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id); // ensuring you can only delete YOUR own data

    if (error) throw error;

    res.status(200).json({ message: 'Transaction deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
// Update a transaction (e.g., change category)
exports.updateTransaction = async (req, res) => {
  const { id } = req.params;
  const { category_id, user_id } = req.body;

  try {
    const { data, error } = await supabase
      .from('transactions')
      .update({ category_id }) // Update the category
      .eq('id', id)
      .eq('user_id', user_id) // Security check
      .select();

    if (error) throw error;
    res.status(200).json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};