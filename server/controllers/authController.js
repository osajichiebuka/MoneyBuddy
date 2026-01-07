const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase specifically for Auth handling
// We need the service key to potentially manage user data if needed, 
// though standard auth.signUp works with anon key too. 
// Using the existing client from index.js would be circular, so we init here or pass it.
// For simplicity in this MVC, we'll re-init with env vars.

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const signup = async (req, res) => {
  const { email, password, full_name } = req.body;

  try {
    // 1. Sign up the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name } // Stores in raw_user_meta_data
      }
    });

    if (authError) throw authError;

    if (!authData.user) {
      throw new Error("User creation failed");
    }

    // 2. Create/Ensure Profile exists
    // Note: If you have a Trigger in Postgres (handle_new_user), this might be redundant,
    // but doing it here ensures the 'currency' and 'username' are set correctly 
    // immediately for the app logic. We use 'upsert' to avoid race conditions with triggers.
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user.id,
        username: full_name,
        currency: 'NGN', // Default currency as per specs
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      console.error("Profile creation error:", profileError);
      // We don't block the response here, as the user is created.
    }

    res.status(201).json({
      message: 'User created successfully',
      user: authData.user,
      session: authData.session
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    res.status(200).json({
      message: 'Login successful',
      session: data.session,
      user: data.user
    });

  } catch (error) {
    res.status(401).json({ error: error.message });
  }
};

module.exports = {
  signup,
  login
};
