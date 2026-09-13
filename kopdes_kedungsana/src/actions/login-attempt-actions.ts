"use server";

import { headers } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_MINUTES = 5;

const resolveClientIp = async (): Promise<string> => {
  const headersList = await headers();
  const forwardedFor = headersList.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return headersList.get("x-real-ip") || "Unknown IP";
};

export type LoginRateLimitResult = { allowed: true } | { allowed: false };

/**
 * Rate-limit gate for the admin login form, checked before the actual
 * Supabase sign-in call (see supabase-auth-repository.ts) so repeated
 * password guesses are throttled per IP — same pattern as the public NIK
 * search portal (see nik-search-actions.ts / setup_nik_search_rate_limit.sql).
 * Sign-in itself stays a direct client-side supabase.auth call so the
 * browser session/cookies it establishes are unaffected.
 */
export async function checkLoginRateLimit(): Promise<LoginRateLimitResult> {
  const ip = await resolveClientIp();
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();
  const { count, error: countError } = await supabase
    .from("login_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip_address", ip)
    .gte("created_at", windowStart);

  if (countError) {
    // Fail open, same rationale as the NIK search rate limit: a transient
    // DB hiccup (or the migration not having been run yet) shouldn't lock
    // legitimate admins out of the app entirely.
    console.error("Gagal memeriksa rate limit login", countError);
    return { allowed: true };
  }

  if ((count ?? 0) >= RATE_LIMIT_MAX_ATTEMPTS) {
    return { allowed: false };
  }

  await supabase.from("login_attempts").insert({ ip_address: ip });
  return { allowed: true };
}
