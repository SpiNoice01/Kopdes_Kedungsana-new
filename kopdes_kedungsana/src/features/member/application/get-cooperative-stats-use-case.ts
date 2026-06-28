import { GetMembersUseCase } from "./get-members-use-case";
import { GetMemberMonthlySavingsUseCase } from "./get-member-monthly-savings-use-case";
import { loadSettingsAsync } from "@/app/admin/pengaturan/page";

export interface CooperativeStats {
  totalMembers: number;
  totalSavings: number;
  sumPokok: number;
  sumWajib: number;
  sumSukarela: number;
  arrearsCount: number;
}

export class GetCooperativeStatsUseCase {
  constructor(
    private readonly getMembersUseCase: GetMembersUseCase,
    private readonly getMemberMonthlySavingsUseCase: GetMemberMonthlySavingsUseCase
  ) {}

  async execute(): Promise<CooperativeStats> {
    const loadedSettings = await loadSettingsAsync();
    const allMembers = await this.getMembersUseCase.execute();
    const activeList = allMembers.filter((m) => m.status === "aktif");

    let runningPokok = 0;
    let runningWajib = 0;
    let runningSukarela = 0;
    let inArrears = 0;

    for (const member of activeList) {
      const savings = await this.getMemberMonthlySavingsUseCase.execute(member.id);
      const pokokRecord = savings.find((s) => s.period === "POKOK");
      const pokok = pokokRecord ? pokokRecord.requiredSaving : 0;
      
      const wajib = savings
        .filter((s) => s.period !== "POKOK")
        .reduce((sum, s) => sum + s.requiredSaving, 0);
        
      const sukarela = savings
        .filter((s) => s.period !== "POKOK")
        .reduce((sum, s) => sum + s.voluntarySaving, 0);

      runningPokok += pokok;
      runningWajib += wajib;
      runningSukarela += sukarela;

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
      arrearsCount: inArrears,
    };
  }
}
