import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

let clientPromise = null;

async function resolveSupabaseConfig() {
  let supabaseUrl =
    window.__ENV__?.SUPABASE_URL ||
    window.__SUPABASE_URL__ ||
    '';
  let supabaseAnonKey =
    window.__ENV__?.SUPABASE_ANON_KEY ||
    window.__SUPABASE_ANON_KEY__ ||
    '';

  if (!supabaseUrl || !supabaseAnonKey) {
    try {
      const localModule = await import('./env.local.js').catch(() => null);
      const localEnv = localModule?.ENV || localModule?.env || localModule?.default || {};
      supabaseUrl = supabaseUrl || localEnv.SUPABASE_URL || localEnv.supabaseUrl || '';
      supabaseAnonKey =
        supabaseAnonKey || localEnv.SUPABASE_ANON_KEY || localEnv.supabaseAnonKey || '';
    } catch (_) {
      // Optional local file on deployed environments like Render
    }
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    try {
      const response = await fetch('/api/config', { cache: 'no-store' });
      if (response.ok) {
        const apiEnv = await response.json();
        supabaseUrl = supabaseUrl || apiEnv.supabaseUrl || apiEnv.SUPABASE_URL || '';
        supabaseAnonKey =
          supabaseAnonKey || apiEnv.supabaseAnonKey || apiEnv.SUPABASE_ANON_KEY || '';
      }
    } catch (err) {
      console.error('Unable to load Supabase config from /api/config:', err);
    }
  }

  return { supabaseUrl, supabaseAnonKey };
}

export async function getSupabaseClient() {
  if (!clientPromise) {
    clientPromise = (async () => {
      const { supabaseUrl, supabaseAnonKey } = await resolveSupabaseConfig();
      if (!supabaseUrl || !supabaseAnonKey) {
        return null;
      }
      return createClient(supabaseUrl, supabaseAnonKey);
    })();
  }
  return clientPromise;
}

export const supabaseClient = await getSupabaseClient();