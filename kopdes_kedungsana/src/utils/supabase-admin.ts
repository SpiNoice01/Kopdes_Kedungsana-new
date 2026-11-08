import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
// Dashboard "Secret key" (sb_secret_...) or the legacy service_role JWT.
const supabaseServiceRoleKey = process.env.SUPABASE_SECRET_KEY || "";

/**
 * Service-role client for the public, unauthenticated Server Actions (NIK
 * search, landing page stats, login/NIK rate limits). These tables are no
 * longer readable with the anon key (see database/migrations/0002_security.sql),
 * so member data can only leave the database through these server-side
 * actions, one filtered result at a time. Never import this from client code:
 * the service role bypasses RLS entirely.
 */
export const createAdminClient = (): SupabaseClient => {
  if (!supabaseServiceRoleKey) {
    throw new Error("SUPABASE_SECRET_KEY belum diatur di environment server.");
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
};
