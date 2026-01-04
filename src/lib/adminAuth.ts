import { supabase } from "./supabaseClient";
import type { User, Session } from "@supabase/supabase-js";

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
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Check if the given user ID matches the admin_user_id in site_settings
 */
export async function checkIsAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("site_settings")
      .select("admin_user_id")
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return false;
    }

    return data.admin_user_id === userId;
  } catch {
    return false;
  }
}

/**
 * Get current session
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error };
}
