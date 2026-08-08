import { GetMembersUseCase } from "./get-members-use-case";
import { GetMemberMonthlySavingsUseCase } from "./get-member-monthly-savings-use-case";
import { GetMemberInvestmentsUseCase } from "./get-member-investments-use-case";
import { loadSettingsAsync } from "@/src/actions/settings-actions";

export interface CooperativeStats {
  totalMembers: number;
  totalSavings: number;
  sumPokok: number;
  sumWajib: number;
  sumSukarela: number;
  sumInvestasi: number;
  arrearsCount: number;
}

export class GetCooperativeStatsUseCase {
  constructor(
    private readonly getMembersUseCase: GetMembersUseCase,
    private readonly getMemberMonthlySavingsUseCase: GetMemberMonthlySavingsUseCase,
    private readonly getMemberInvestmentsUseCase: GetMemberInvestmentsUseCase
  ) {}

  async execute(): Promise<CooperativeStats> {
    const loadedSettings = await loadSettingsAsync();
    const allMembers = await this.getMembersUseCase.execute();
    const activeList = allMembers.filter((m) => m.status === "aktif");

    let runningPokok = 0;
    let runningWajib = 0;
    let runningSukarela = 0;
    let runningInvestasi = 0;
    let inArrears = 0;

    for (const member of activeList) {
      const [savings, investments] = await Promise.all([
        this.getMemberMonthlySavingsUseCase.execute(member.id),
        this.getMemberInvestmentsUseCase.execute(member.id),
      ]);
      const pokok = savings
        .filter((s) => s.period === "POKOK")
        .reduce((sum, s) => sum + s.requiredSaving, 0);

      const wajib = savings
        .filter((s) => s.period !== "POKOK")
        .reduce((sum, s) => sum + s.requiredSaving, 0);

      const sukarela = savings
        .filter((s) => s.period !== "POKOK")
        .reduce((sum, s) => sum + s.voluntarySaving, 0);

      const investasi = investments.reduce((sum, inv) => sum + inv.amount, 0);

      runningPokok += pokok;
      runningWajib += wajib;
      runningSukarela += sukarela;
      runningInvestasi += investasi;

      // Arrears Calculation
      const monthlyTarget = loadedSettings.monthlyDuesAmount;
      if (member.joinDate) {
        const joinDate = new Date(member.joinDate);
        const currentDate = new Date();
        const yearsDiff = currentDate.getFullYear() - joinDate.getFullYear();
        const monthsDiff = currentDate.getMonth() - joinDate.getMonth();
        const monthsElapsed = Math.max(1, yearsDiff * 12 + monthsDiff + 1);

        const target = monthsElapsed * monthlyTarget;
        const paid = wajib;
        if (target > paid) {
          inArrears += 1;
        }
      }
    }

    const totalSavings = runningPokok + runningWajib + runningSukarela;

    return {
      totalMembers: activeList.length,
      totalSavings,
      sumPokok: runningPokok,
      sumWajib: runningWajib,
      sumSukarela: runningSukarela,
      sumInvestasi: runningInvestasi,
      arrearsCount: inArrears,
    };
  }
}
