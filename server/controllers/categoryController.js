const supabase = require('../config/supabaseClient');

// 1. Get All Categories (System Defaults + User's Custom)
exports.getCategories = async (req, res) => {
  const { user_id } = req.query;

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .or(`is_system_default.eq.true,user_id.eq.${user_id}`) // Logic: Give me Defaults OR Mine
      .order('name', { ascending: true });

    if (error) throw error;

    res.status(200).json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// 2. Create a Custom Category
exports.createCategory = async (req, res) => {
  const { name, type, user_id, icon } = req.body;

  try {
    // Check if it already exists for this user to avoid duplicates
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('name', name)
      .eq('user_id', user_id)
      .single();

    if (existing) {
      return res.status(200).json({ message: 'Category already exists', data: existing });
    }

    const { data, error } = await supabase
      .from('categories')
      .insert([
        { 
          name, 
          type, 
          user_id, 
          icon: icon || '✨', // Default sparkle for custom ones
          is_system_default: false 
        }
      ])
      .select();

    if (error) throw error;

    res.status(201).json({ message: 'Custom category created!', data: data[0] });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
// 3. Predict Category based on description
exports.predictCategory = async (req, res) => {
  const { text } = req.body; // e.g. "Rice"

  if (!text) return res.status(200).json({ category_id: null });

  try {
    // 1. Search the Global Index (Case insensitive)
    // We use 'ilike' for pattern matching
    const { data, error } = await supabase
      .from('global_vendor_index')
      .select('default_category_id')
      .ilike('raw_pattern', `%${text}%`) // Matches "Rice", "Jollof Rice", "Rice & Stew"
      .limit(1)
      .single();

    if (data) {
      // Found a match!
      return res.status(200).json({ category_id: data.default_category_id });
    }

    // No match found
    res.status(200).json({ category_id: null });

  } catch (error) {
    // If multiple rows match or other DB error, just return null (don't crash)
    res.status(200).json({ category_id: null });
  }
};