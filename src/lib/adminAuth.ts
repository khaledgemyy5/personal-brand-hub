import { getSupabase, supabaseReady } from "./supabaseClient";
import type { User, Session } from "@supabase/supabase-js";

export { supabaseReady };

export interface AdminAuthState {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  const supabase = getSupabase();
  if (!supabase) {
    return { data: null, error: { message: 'Supabase not configured' } };
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const supabase = getSupabase();
  if (!supabase) {
    return { error: null };
  }
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Check if the given user ID matches the admin_user_id in site_settings
 * Uses is_admin() RPC for security
 */
export async function checkIsAdmin(_userId?: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  
  try {
    const { data, error } = await supabase.rpc('is_admin');
    if (error) {
      console.warn('[checkIsAdmin] RPC error:', error.message);
      return false;
    }
    return data === true;
  } catch {
    return false;
  }
}

/**
 * Get current session
 */
export async function getSession() {
  const supabase = getSupabase();
  if (!supabase) {
    return { session: null, error: null };
  }
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error };
}
