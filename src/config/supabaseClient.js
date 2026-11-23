// S2-DEV-01: Hope Enterprise — Live Supabase Client Binding
const SUPABASE_CONFIG = {
  url: window.HOPE_ENV?.SUPABASE_URL || 'https://your-project-id.supabase.co',
  anonKey: window.HOPE_ENV?.SUPABASE_ANON_KEY || 'your-public-anon-key-here'
};

const isConfigured =
  SUPABASE_CONFIG.url.startsWith('https://') &&
  !SUPABASE_CONFIG.url.includes('your-project-id') &&
  !SUPABASE_CONFIG.anonKey.includes('your-public-anon-key');

const supabaseClient = (typeof window.supabase !== 'undefined' && isConfigured)
  ? window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey)
  : null;

export { SUPABASE_CONFIG, supabaseClient };
