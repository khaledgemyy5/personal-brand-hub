import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY, hasSupabaseEnv } from "./env";

// Re-export env checks for convenience
export { hasSupabaseEnv } from "./env";

// Track if we have valid credentials
export const supabaseReady = hasSupabaseEnv;
export const isSupabaseConfigured = hasSupabaseEnv;

let supabaseInstance: SupabaseClient | null = null;

if (hasSupabaseEnv) {
  supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  console.warn(
    "[Supabase] Missing env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
  );
}

/**
 * Get the Supabase client. Returns null if env vars are missing.
 * Use hasSupabaseEnv to check availability before calling.
 */
export function getSupabase(): SupabaseClient | null {
  return supabaseInstance;
}

/**
 * Get the Supabase client or throw an error.
 * Use this in admin/protected contexts where Supabase is required.
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseInstance) {
    throw new Error(
      "Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables."
    );
  }
  return supabaseInstance;
}

// For backward compatibility - use getSupabase() for new code
// This may be null if env vars are missing!
export const supabase = supabaseInstance as SupabaseClient;
