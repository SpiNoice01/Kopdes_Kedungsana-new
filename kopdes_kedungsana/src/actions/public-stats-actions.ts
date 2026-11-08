"use server";

import { createAdminClient } from "@/src/utils/supabase-admin";
import { SupabaseMemberRepository } from "@/src/features/member/infrastructure/supabase-member-repository";
import { GetMembersUseCase } from "@/src/features/member/application/get-members-use-case";
import { GetMemberLedgersUseCase } from "@/src/features/member/application/get-member-ledgers-use-case";
import {
  GetCooperativeStatsUseCase,
  type CooperativeStats,
} from "@/src/features/member/application/get-cooperative-stats-use-case";
import { loadSettingsAsync } from "@/src/actions/settings-actions";

/**
 * Cooperative-wide totals for the public landing page. Computed server-side
 * so the browser only ever receives the aggregate numbers, never the member
 * rows they are summed from (the anon key can no longer read those tables,
 * see database/migrations/0002_security.sql).
 */
export async function getPublicCooperativeStats(): Promise<CooperativeStats> {
  const memberRepository = new SupabaseMemberRepository(createAdminClient());

  return new GetCooperativeStatsUseCase(
    new GetMembersUseCase(memberRepository),
    new GetMemberLedgersUseCase(memberRepository),
    loadSettingsAsync,
  ).execute();
}
