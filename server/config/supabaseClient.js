const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase Client
// We use the SERVICE_ROLE_KEY so that our backend has full admin access
// to write to tables that might have RLS policies restricting anon users.

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase credentials missing in .env file');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
