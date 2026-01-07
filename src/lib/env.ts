// =============================================================================
// Environment configuration - single source of truth
// =============================================================================

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

/**
 * Check if Supabase environment variables are configured.
 * Both URL and anon key must be non-empty strings.
 */
export const hasSupabaseEnv = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
