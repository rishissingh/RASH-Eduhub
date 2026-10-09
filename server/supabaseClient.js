/**
 * RASH EduHub — Supabase Client
 * Initializes and exports the Supabase JS client instance.
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env'), override: true });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
   console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY in .env');
   process.exit(1);
}

if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
   console.log('🔑 Supabase Client initialized with Service Role Key.');
} else {
   console.warn('⚠️ Supabase Client initialized with Anon Key.');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
   auth: {
      persistSession: false,
      autoRefreshToken: false
   }
});

module.exports = supabase;
