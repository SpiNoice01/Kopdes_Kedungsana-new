import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

// Make sure to set these in your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// In the browser the Supabase session is kept in cookies (not localStorage)
// so middleware.ts can verify it with getUser() on every /admin request.
// Server code that imports this module (repositories used inside Server
// Actions) gets a plain anon client without any session.
export const supabase: SupabaseClient =
  typeof window === "undefined"
    ? createClient(supabaseUrl, supabaseKey)
    : createBrowserClient(supabaseUrl, supabaseKey);
