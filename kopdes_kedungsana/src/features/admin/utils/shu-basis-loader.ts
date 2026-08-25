import { memberDependencies } from "@/src/features/member/infrastructure/member-dependencies";
import type { KopdesSettings } from "@/src/features/settings/domain/settings";

export interface MemberShuBasisRow {
  memberId: string;
  memberName: string;
  savingPokok: number;
  savingWajib: number;
  savingSukarela: number;
  investmentAmount: number;
  serviceContribution: number;
}

/**
 * Single source of truth for "which active members count for the active
 * fiscal year, and what are their savings/investment/service-contribution
 * totals up to that year" — shared by Quick SHU's page and the RAT bundle
 * export (including the mandatory backup flow) so the two can never drift
 * on data-gathering rules the way they once did on the SHU formula itself.
 * Row-level SHU math is a separate step — see computeMemberShu in
 * shu-calculator.ts.
 */
export const loadMemberShuBasisRows = async (
  settings: KopdesSettings,
): Promise<MemberShuBasisRow[]> => {
  const members = await memberDependencies.getMembersUseCase.execute();

  const activeMembers = members.filter(
    (member) =>
      member.status === "aktif" &&
      new Date(member.joinDate).getFullYear() <= settings.activeFiscalYear,
  );

  return Promise.all(
    activeMembers.map(async (member) => {
      const [savings, serviceContributions, investments] = await Promise.all([
        memberDependencies.getMemberMonthlySavingsUseCase.execute(member.id),
        memberDependencies.getMemberServiceContributionsUseCase.execute(member.id),
        memberDependencies.getMemberInvestmentsUseCase.execute(member.id),
      ]);

      let savingPokok = 0;
      let savingWajib = 0;
      let savingSukarela = 0;
      for (const s of savings) {
        const sYear = s.period === "POKOK"
          ? new Date(s.inputDate).getFullYear()
          : parseInt(s.period.split("-")[0]);
        if (sYear > settings.activeFiscalYear) continue;
        if (s.period === "POKOK") {
          savingPokok += s.requiredSaving;
        } else {
          savingWajib += s.requiredSaving;
          savingSukarela += s.voluntarySaving;
        }
      }

      let serviceContribution = 0;
      for (const c of serviceContributions) {
        const cYear = parseInt(c.period.split("-")[0]);
        if (cYear <= settings.activeFiscalYear) serviceContribution += c.amount;
      }

      let investmentAmount = 0;
      for (const inv of investments) {
        if (inv.period === settings.activeFiscalYear.toString()) investmentAmount += inv.amount;
      }

      return {
        memberId: member.id,
        memberName: member.name,
        savingPokok,
        savingWajib,
        savingSukarela,
        investmentAmount,
        serviceContribution,
      };
    }),
  );
};
