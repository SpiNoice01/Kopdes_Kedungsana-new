import type { GetMembersUseCase } from "@/src/features/member/application/get-members-use-case";
import type { GetMemberLedgersUseCase } from "@/src/features/member/application/get-member-ledgers-use-case";
import { summarizeSavingsUpToYear } from "@/src/features/member/domain/member-services";
import type { KopdesSettings } from "@/src/features/settings/domain/settings";
import type { ShuBasisAmounts } from "../domain/shu-calculator";

export interface MemberShuBasisRow extends ShuBasisAmounts {
  memberId: string;
  memberName: string;
  joinDate: string;
}

/**
 * Single source of truth for "which active members count for the active
 * fiscal year, and what are their savings/investment/service-contribution
 * totals up to that year" — shared by Quick SHU's page, Spreadsheet Live and
 * the RAT bundle export (including the mandatory backup flow) so they can
 * never drift on data-gathering rules the way they once did on the SHU
 * formula itself. Row-level SHU math is a separate step — see
 * distributeMemberShu in ../domain/shu-calculator.ts.
 */
export class GetShuBasisRowsUseCase {
  constructor(
    private readonly getMembersUseCase: GetMembersUseCase,
    private readonly getMemberLedgersUseCase: GetMemberLedgersUseCase,
  ) {}

  async execute(settings: KopdesSettings): Promise<MemberShuBasisRow[]> {
    const ledgers = this.getMemberLedgersUseCase;
    const [members, savingsByMember, serviceByMember, investmentsByMember] = await Promise.all([
      this.getMembersUseCase.execute(),
      ledgers.savingsByMember(),
      ledgers.serviceContributionsByMember(),
      ledgers.investmentsByMember(),
    ]);

    const activeMembers = members.filter(
      (member) =>
        member.status === "aktif" &&
        new Date(member.joinDate).getFullYear() <= settings.activeFiscalYear,
    );

    return activeMembers.map((member) => {
      const { pokok, wajib, sukarela } = summarizeSavingsUpToYear(
        savingsByMember.get(member.id) ?? [],
        settings.activeFiscalYear,
      );

      let serviceContribution = 0;
      for (const c of serviceByMember.get(member.id) ?? []) {
        const cYear = parseInt(c.period.split("-")[0]);
        if (cYear <= settings.activeFiscalYear) serviceContribution += c.amount;
      }

      // Always sums existing investment records regardless of the
      // enableInvestasi toggle — the toggle only gates new entries.
      let investmentAmount = 0;
      for (const inv of investmentsByMember.get(member.id) ?? []) {
        if (inv.period === settings.activeFiscalYear.toString()) investmentAmount += inv.amount;
      }

      return {
        memberId: member.id,
        memberName: member.name,
        joinDate: member.joinDate,
        savingPokok: pokok,
        savingWajib: wajib,
        savingSukarela: sukarela,
        investmentAmount,
        serviceContribution,
      };
    });
  }
}
