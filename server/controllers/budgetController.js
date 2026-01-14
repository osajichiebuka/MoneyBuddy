const supabase = require('../config/supabaseClient');

exports.getBudgets = async (req, res) => {
  const { user_id } = req.query;
  
  // Get 1st day of current month (e.g., "2023-10-01")
  const date = new Date();
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();

  try {
    // 1. Get the User's Budget Limits
    const { data: budgets, error: budgetError } = await supabase
      .from('budgets')
      .select(`
        id, 
        limit_amount, 
        category:categories (id, name, icon)
      `)
      .eq('user_id', user_id);

    if (budgetError) throw budgetError;

    // 2. Calculate Actual Spending for THIS month
    const { data: transactions, error: txnError } = await supabase
      .from('transactions')
      .select('amount, category_id')
      .eq('user_id', user_id)
      .eq('direction', 'EXPENSE') // Only count expenses
      .gte('date', firstDay);     // Only from 1st of month

    if (txnError) throw txnError;

    // 3. Merge the Data (The Math Part)
    const budgetData = budgets.map(b => {
      // Filter transactions for this specific category
      const categoryTransactions = transactions.filter(t => t.category_id === b.category.id);
      
      // Sum them up
      const spent = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);

      // Calculate percentage (capped at 100 for safety, but we track overspending too)
      const percentage = (spent / b.limit_amount) * 100;

      return {
        ...b,
        spent_amount: spent,
        percentage: percentage
      };
    });

    res.status(200).json(budgetData);

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Create or Update a Budget
exports.setBudget = async (req, res) => {
  const { user_id, category_id, limit_amount } = req.body;

  try {
    // Check if budget already exists for this category
    const { data: existing } = await supabase
        .from('budgets')
        .select('id')
        .eq('user_id', user_id)
        .eq('category_id', category_id)
        .single();

    if (existing) {
        // Update existing
        const { error } = await supabase
            .from('budgets')
            .update({ limit_amount })
            .eq('id', existing.id);
        if (error) throw error;
    } else {
        // Create new
        const { error } = await supabase
          .from('budgets')
          .insert([{ user_id, category_id, limit_amount, month: new Date() }]);
        if (error) throw error;
    }

    res.status(200).json({ message: 'Budget set!' });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};