import type { MemberRepository } from "../domain/member-repository";
import type { MemberMonthlySaving } from "../domain/member-monthly-saving";
import type { MemberInvestment } from "../domain/member-investment";
import type { MemberServiceContribution } from "../domain/member-service-contribution";

/** Rows of one ledger table grouped by member id; members with no rows are absent. */
export type LedgerByMember<T> = Map<string, T[]>;

const groupByMember = <T extends { memberId: string }>(rows: T[]): LedgerByMember<T> => {
  const grouped: LedgerByMember<T> = new Map();
  for (const row of rows) {
    const list = grouped.get(row.memberId);
    if (list) list.push(row);
    else grouped.set(row.memberId, [row]);
  }
  return grouped;
};

/**
 * Reads a whole ledger table in one go and groups it per member, for pages
 * that need every member's balances (stats, laporan, SHU, member list).
 * Replaces looping over members with one query each (N+1), which took
 * ~16 s for 61 members versus ~0.2 s for a single bulk read.
 *
 * Within each member, rows keep the per-member reads' order (period
 * ascending), so `map.get(id) ?? []` is a drop-in for the per-member use
 * cases.
 */
export class GetMemberLedgersUseCase {
  constructor(private readonly memberRepository: MemberRepository) {}

  async savingsByMember(): Promise<LedgerByMember<MemberMonthlySaving>> {
    return groupByMember(await this.memberRepository.getAllMonthlySavings());
  }

  async investmentsByMember(): Promise<LedgerByMember<MemberInvestment>> {
    return groupByMember(await this.memberRepository.getAllInvestments());
  }

  async serviceContributionsByMember(): Promise<LedgerByMember<MemberServiceContribution>> {
    return groupByMember(await this.memberRepository.getAllServiceContributions());
  }
}
