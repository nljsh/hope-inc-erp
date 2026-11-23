const env = typeof window !== 'undefined' ? (window.HOPE_ENV || {}) : {};
const supabaseUrl = String(env.SUPABASE_URL || '').trim();
const supabaseAnonKey = String(env.SUPABASE_ANON_KEY || '').trim();

const createClientFn =
  typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function'
    ? window.supabase.createClient
    : null;

export const supabaseClient =
  createClientFn && supabaseUrl && supabaseAnonKey
    ? createClientFn(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;
