"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/src/utils/supabase-admin";
import { SupabaseMemberRepository } from "@/src/features/member/infrastructure/supabase-member-repository";
import type { Member } from "@/src/features/member/domain/member";
import type { MemberMonthlySaving } from "@/src/features/member/domain/member-monthly-saving";
import type { MemberInvestment } from "@/src/features/member/domain/member-investment";

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

export type NikSearchResult =
  | {
      status: "found";
      member: Member;
      savings: MemberMonthlySaving[];
      investments: MemberInvestment[];
    }
  | { status: "not_found" }
  | { status: "rate_limited" };

/**
 * Public, unauthenticated NIK lookup for the Cek Simpanan portal
 * (app/cek-simpanan) — runs server-side specifically so the client never
 * has to fetch (and can never brute-force via network inspection) more than
 * one member's data per request. Rate-limited per IP via nik_search_attempts
 * (see setup_nik_search_rate_limit.sql) to slow down automated NIK-guessing,
 * since Indonesian NIK has a guessable structure (fixed region code + birth
 * date + a 4-digit sequence) for anyone targeting one specific village's
 * membership. The member's savings and investments come back in the same
 * call because the anon key can no longer read those tables from the browser
 * (see setup_rls_lockdown_anon.sql).
 */
export async function searchMemberByNik(nik: string): Promise<NikSearchResult> {
  const ip = await resolveClientIp();
  const supabase = createAdminClient();

  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();
  const { count, error: countError } = await supabase
    .from("nik_search_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip_address", ip)
    .gte("created_at", windowStart);

  if (countError) {
    // Fail open on the rate-limit check itself (a transient DB hiccup
    // shouldn't lock legitimate members out) — the search below is still a
    // single filtered row, not a bulk fetch, so the worst case here is
    // degraded throttling, not a data exposure.
    console.error("Gagal memeriksa rate limit pencarian NIK", countError);
  } else if ((count ?? 0) >= RATE_LIMIT_MAX_ATTEMPTS) {
    return { status: "rate_limited" };
  }

  await supabase.from("nik_search_attempts").insert({ ip_address: ip });

  const memberRepository = new SupabaseMemberRepository(supabase);
  const member = await memberRepository.findByNik(nik);

  if (!member) {
    return { status: "not_found" };
  }

  const [savings, investments] = await Promise.all([
    memberRepository.getMonthlySavingsByMemberId(member.id),
    memberRepository.getInvestmentsByMemberId(member.id),
  ]);

  return { status: "found", member, savings, investments };
}
