import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY, hasSupabaseEnv, getEnvStatus } from "./env";

// Re-export env checks for convenience
export { hasSupabaseEnv, getEnvStatus } from "./env";

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

/**
 * Perform a lightweight connectivity check to Supabase
 * Returns detailed status for diagnostics
 */
export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  authWorking: boolean;
  schemaReady: boolean;
  error?: string;
  details: {
    ping: boolean;
    session: boolean;
    siteSettingsExists: boolean;
    publicViewExists: boolean;
  };
}> {
  const result = {
    connected: false,
    authWorking: false,
    schemaReady: false,
    error: undefined as string | undefined,
    details: {
      ping: false,
      session: false,
      siteSettingsExists: false,
      publicViewExists: false,
    },
  };

  if (!supabaseInstance) {
    result.error = 'Supabase client not initialized - check environment variables';
    return result;
  }

  // Test 1: Auth session check (tests basic connectivity)
  try {
    const { error: sessionError } = await supabaseInstance.auth.getSession();
    if (!sessionError) {
      result.details.session = true;
      result.authWorking = true;
      result.connected = true;
    } else {
      result.error = `Auth error: ${sessionError.message}`;
    }
  } catch (e) {
    result.error = `Connection failed: ${e instanceof Error ? e.message : 'Unknown error'}`;
    return result;
  }

  // Test 2: Check if site_settings table exists
  try {
    const { error: tableError } = await supabaseInstance
      .from('site_settings')
      .select('id')
      .limit(1);
    
    if (!tableError) {
      result.details.siteSettingsExists = true;
      result.schemaReady = true;
    } else if (tableError.message.includes('does not exist') || tableError.code === '42P01') {
      result.error = 'Schema not initialized - run docs/sql/000_all.sql';
    } else {
      // RLS or other error - table exists but access issue
      result.details.siteSettingsExists = true;
    }
  } catch (e) {
    result.error = `Schema check failed: ${e instanceof Error ? e.message : 'Unknown error'}`;
  }

  // Test 3: Check if public_site_settings view exists
  try {
    const { error: viewError } = await supabaseInstance
      .from('public_site_settings')
      .select('id')
      .limit(1);
    
    if (!viewError) {
      result.details.publicViewExists = true;
      result.schemaReady = true;
    }
  } catch {
    // View might not exist, not critical
  }

  result.details.ping = result.connected;
  return result;
}
