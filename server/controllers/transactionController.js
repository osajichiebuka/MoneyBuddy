const supabase = require('../config/supabaseClient');

exports.addTransaction = async (req, res) => {
  const { user_id, amount, type, description, date } = req.body;

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
          source_type: 'MANUAL_INPUT'
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
      .select('*')
      .eq('user_id', user_id)
      .order('date', { ascending: false });

    if (error) throw error;

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