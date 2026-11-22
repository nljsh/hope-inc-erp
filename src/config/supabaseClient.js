// S1-DEV-01: Hope Enterprise — Supabase Client Initialization
// Replace placeholders with your Hope Enterprise Supabase project credentials

const SUPABASE_CONFIG = {
  url: 'https://your-project-id.supabase.co',
  anonKey: 'your-public-anon-key-here'
};

// Initialize client if Supabase SDK is loaded via CDN
const supabaseClient = (typeof supabase !== 'undefined')
  ? supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey)
  : null;

export { SUPABASE_CONFIG, supabaseClient };
