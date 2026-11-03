"use server";

import { createAdminClient } from "@/src/utils/supabase-admin";
import { SupabaseMemberRepository } from "@/src/features/member/infrastructure/supabase-member-repository";
import { GetMembersUseCase } from "@/src/features/member/application/get-members-use-case";
import { GetMemberMonthlySavingsUseCase } from "@/src/features/member/application/get-member-monthly-savings-use-case";
import { GetMemberInvestmentsUseCase } from "@/src/features/member/application/get-member-investments-use-case";
import {
  GetCooperativeStatsUseCase,
  type CooperativeStats,
} from "@/src/features/member/application/get-cooperative-stats-use-case";

/**
 * Cooperative-wide totals for the public landing page. Computed server-side
 * so the browser only ever receives the aggregate numbers, never the member
 * rows they are summed from (the anon key can no longer read those tables,
 * see setup_rls_lockdown_anon.sql).
 */
export async function getPublicCooperativeStats(): Promise<CooperativeStats> {
  const memberRepository = new SupabaseMemberRepository(createAdminClient());
  const getMembersUseCase = new GetMembersUseCase(memberRepository);
  const getMemberMonthlySavingsUseCase = new GetMemberMonthlySavingsUseCase(memberRepository);
  const getMemberInvestmentsUseCase = new GetMemberInvestmentsUseCase(memberRepository);

  return new GetCooperativeStatsUseCase(
    getMembersUseCase,
    getMemberMonthlySavingsUseCase,
    getMemberInvestmentsUseCase,
  ).execute();
}
