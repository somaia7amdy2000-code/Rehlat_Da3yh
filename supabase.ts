import { createClient } from '@supabase/supabase-js';

const getEnvVar = (key: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta && (import.meta as any).env) {
    if ((import.meta as any).env[key]) return (import.meta as any).env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] || '';
  }
  return '';
};

const rawUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_PUBLISHABLE_KEY') || getEnvVar('VITE_SUPABASE_ANON_KEY');

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  !supabaseUrl.includes('your-project.supabase.co')
);

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);


/**
 * Returns the signed-in teacher from the locally stored session (no network round-trip).
 * Same shape as supabase.auth.getUser(). Use this for "who is logged in" checks:
 * getUser() calls the Auth server every time, and the dashboard makes many of these
 * checks, which can hit Supabase Auth rate limits and make saves silently skip.
 * Row Level Security still verifies the JWT on every database request.
 */
export async function getSessionUser() {
  const { data, error } = await supabase.auth.getSession();
  return { data: { user: data.session?.user ?? null }, error };
}
