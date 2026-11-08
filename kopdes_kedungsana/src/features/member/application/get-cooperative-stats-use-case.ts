import type { GetMembersUseCase } from "./get-members-use-case";
import type { GetMemberLedgersUseCase } from "./get-member-ledgers-use-case";
import { calculateArrears } from "../domain/member-services";
import type { KopdesSettings } from "@/src/features/settings/domain/settings";

/**
 * Sumber pengaturan koperasi. Diinjeksi (bukan diimpor dari actions) supaya
 * lapisan application tidak bergantung ke lapisan luar.
 */
export type SettingsLoader = () => Promise<KopdesSettings>;

/** Saldo simpanan kumulatif koperasi pada akhir satu bulan. */
export interface MonthlyTrendPoint {
  /** Kunci bulan, format 'YYYY-MM'. */
  month: string;
  /** Label singkat untuk sumbu grafik, mis. 'Nov'. */
  label: string;
  /** Akumulasi pokok + wajib + sukarela s.d. akhir bulan ini. */
  value: number;
}

export interface CooperativeStats {
  totalMembers: number;
  totalSavings: number;
  sumPokok: number;
  sumWajib: number;
  sumSukarela: number;
  sumInvestasi: number;
  arrearsCount: number;
  monthlyTrend: MonthlyTrendPoint[];
}

const TREND_MONTHS = 6;
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const MONTH_KEY = /^\d{4}-\d{2}$/;

/** Bulan berjalan menurut WIB (server Render berjalan di UTC). */
function currentMonthKey(): string {
  const wib = new Date(Date.now() + 7 * 60 * 60 * 1000);
  return `${wib.getUTCFullYear()}-${String(wib.getUTCMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export class GetCooperativeStatsUseCase {
  constructor(
    private readonly getMembersUseCase: GetMembersUseCase,
    private readonly getMemberLedgersUseCase: GetMemberLedgersUseCase,
    private readonly loadSettings: SettingsLoader,
  ) {}

  async execute(): Promise<CooperativeStats> {
    const [loadedSettings, allMembers, savingsByMember, investmentsByMember] = await Promise.all([
      this.loadSettings(),
      this.getMembersUseCase.execute(),
      this.getMemberLedgersUseCase.savingsByMember(),
      this.getMemberLedgersUseCase.investmentsByMember(),
    ]);
    const activeList = allMembers.filter((m) => m.status === "aktif");

    let runningPokok = 0;
    let runningWajib = 0;
    let runningSukarela = 0;
    let runningInvestasi = 0;
    let inArrears = 0;

    // Setoran yang masuk per bulan ('YYYY-MM'), untuk grafik tren.
    const nowMonth = currentMonthKey();
    const depositsByMonth = new Map<string, number>();
    const addDeposit = (month: string | null, amount: number) => {
      // Setoran tanpa bulan yang jelas dianggap sudah ada sejak awal grafik;
      // setoran di muka (periode setelah bulan ini) uangnya sudah diterima,
      // jadi dihitung di bulan berjalan. Dengan begitu titik terakhir grafik
      // selalu sama dengan totalSavings.
      const key = month === null ? "0000-00" : month > nowMonth ? nowMonth : month;
      depositsByMonth.set(key, (depositsByMonth.get(key) ?? 0) + amount);
    };

    for (const member of activeList) {
      const savings = savingsByMember.get(member.id) ?? [];
      const investments = investmentsByMember.get(member.id) ?? [];
      const pokok = savings
        .filter((s) => s.period === "POKOK")
        .reduce((sum, s) => sum + s.requiredSaving, 0);

      const wajib = savings
        .filter((s) => s.period !== "POKOK")
        .reduce((sum, s) => sum + s.requiredSaving, 0);

      const sukarela = savings
        .filter((s) => s.period !== "POKOK")
        .reduce((sum, s) => sum + s.voluntarySaving, 0);

      for (const s of savings) {
        if (s.period === "POKOK") {
          // Simpanan pokok tidak punya periode bulanan; pakai tanggal input.
          const inputMonth = s.inputDate?.slice(0, 7) ?? "";
          addDeposit(MONTH_KEY.test(inputMonth) ? inputMonth : null, s.requiredSaving);
        } else {
          addDeposit(MONTH_KEY.test(s.period) ? s.period : null, s.requiredSaving + s.voluntarySaving);
        }
      }

      const investasi = investments.reduce((sum, inv) => sum + inv.amount, 0);

      runningPokok += pokok;
      runningWajib += wajib;
      runningSukarela += sukarela;
      runningInvestasi += investasi;

      // Aturan tunggakan yang sama dengan daftar & detail anggota (domain).
      if (calculateArrears(member, savings, loadedSettings).arrears > 0) {
        inArrears += 1;
      }
    }

    const totalSavings = runningPokok + runningWajib + runningSukarela;

    const trendMonths = Array.from({ length: TREND_MONTHS }, (_, i) =>
      shiftMonth(nowMonth, i - (TREND_MONTHS - 1)),
    );
    const sortedDeposits = [...depositsByMonth.entries()].sort(([a], [b]) => a.localeCompare(b));
    const monthlyTrend: MonthlyTrendPoint[] = trendMonths.map((month) => ({
      month,
      label: MONTH_LABELS[Number(month.slice(5, 7)) - 1],
      value: sortedDeposits
        .filter(([key]) => key <= month)
        .reduce((sum, [, amount]) => sum + amount, 0),
    }));

    return {
      totalMembers: activeList.length,
      totalSavings,
      sumPokok: runningPokok,
      sumWajib: runningWajib,
      sumSukarela: runningSukarela,
      sumInvestasi: runningInvestasi,
      arrearsCount: inArrears,
      monthlyTrend,
    };
  }
}
