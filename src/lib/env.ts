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

/**
 * Get detailed environment status for diagnostics
 */
export function getEnvStatus(): {
  ready: boolean;
  url: { present: boolean; value?: string };
  anonKey: { present: boolean; preview?: string };
  missingVars: string[];
} {
  const urlPresent = Boolean(SUPABASE_URL);
  const anonKeyPresent = Boolean(SUPABASE_ANON_KEY);
  const missingVars: string[] = [];
  
  if (!urlPresent) missingVars.push('VITE_SUPABASE_URL');
  if (!anonKeyPresent) missingVars.push('VITE_SUPABASE_ANON_KEY');
  
  return {
    ready: urlPresent && anonKeyPresent,
    url: { 
      present: urlPresent, 
      value: urlPresent ? SUPABASE_URL : undefined 
    },
    anonKey: { 
      present: anonKeyPresent, 
      preview: anonKeyPresent ? `${SUPABASE_ANON_KEY.slice(0, 20)}...` : undefined 
    },
    missingVars,
  };
}
