import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Track if we have valid credentials
export const supabaseReady = Boolean(supabaseUrl && supabaseAnonKey);

let supabaseInstance: SupabaseClient | null = null;

if (supabaseReady) {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn(
    "[Supabase] Missing env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
  );
}

/**
 * Get the Supabase client. Returns null if env vars are missing.
 * Use supabaseReady to check availability before calling.
 */
export function getSupabase(): SupabaseClient | null {
  return supabaseInstance;
}

// For backward compatibility - use getSupabase() for new code
export const supabase = supabaseInstance as SupabaseClient;
