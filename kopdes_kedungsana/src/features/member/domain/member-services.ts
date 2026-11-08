import type { Member } from "./member";
import type { MemberMonthlySaving } from "./member-monthly-saving";
import type { MemberInvestment } from "./member-investment";
import type { KopdesSettings } from "../../settings/domain/settings";

/** Tahun buku sebuah setoran: POKOK menurut tanggal input, lainnya menurut periode 'YYYY-MM'. */
export const savingYear = (saving: MemberMonthlySaving): number =>
  saving.period === "POKOK"
    ? new Date(saving.inputDate).getFullYear()
    : parseInt(saving.period.split("-")[0]);

export interface SavingsBreakdown {
  pokok: number;
  wajib: number;
  sukarela: number;
}

/**
 * Saldo pokok/wajib/sukarela s.d. akhir tahun buku `year` — aturan yang
 * dipakai SHU dan Spreadsheet Live. Sukarela hanya dihitung dari setoran
 * bulanan (bukan baris POKOK).
 */
export const summarizeSavingsUpToYear = (
  savings: MemberMonthlySaving[],
  year: number,
): SavingsBreakdown => {
  const result: SavingsBreakdown = { pokok: 0, wajib: 0, sukarela: 0 };
  for (const s of savings) {
    if (savingYear(s) > year) continue;
    if (s.period === "POKOK") {
      result.pokok += s.requiredSaving;
    } else {
      result.wajib += s.requiredSaving;
      result.sukarela += s.voluntarySaving;
    }
  }
  return result;
};

export interface AnnualSavingsSummary extends SavingsBreakdown {
  investasi: number;
  total: number;
  savingsUpToYear: MemberMonthlySaving[];
}

/**
 * Baris Laporan Rekap Simpanan Tahunan: saldo akhir s.d. tahun buku `year`.
 * Catatan: berbeda dari summarizeSavingsUpToYear, di sini sukarela ikut
 * menjumlahkan voluntary_saving baris POKOK (perilaku laporan sejak awal;
 * data saat ini tidak punya nilai tersebut), dan investasi dihitung
 * kumulatif s.d. `year` — bukan hanya tahun `year` seperti di SHU.
 */
export const summarizeAnnualSavings = (
  savings: MemberMonthlySaving[],
  investments: MemberInvestment[],
  year: number,
): AnnualSavingsSummary => {
  const savingsUpToYear = savings.filter((s) => savingYear(s) <= year);
  const pokok = savingsUpToYear
    .filter((s) => s.period === "POKOK")
    .reduce((sum, s) => sum + s.requiredSaving, 0);
  const wajib = savingsUpToYear
    .filter((s) => s.period !== "POKOK")
    .reduce((sum, s) => sum + s.requiredSaving, 0);
  const sukarela = savingsUpToYear.reduce((sum, s) => sum + s.voluntarySaving, 0);
  const investasi = investments
    .filter((inv) => parseInt(inv.period) <= year)
    .reduce((sum, inv) => sum + inv.amount, 0);
  return { pokok, wajib, sukarela, investasi, total: pokok + wajib + sukarela + investasi, savingsUpToYear };
};

export interface ArrearsInfo {
  monthsElapsed: number;
  target: number;
  paid: number;
  arrears: number;
  /** Last fully covered month (YYYY-MM), or null if not a single month is covered yet. */
  paidThroughPeriod: string | null;
  /** First month not fully covered (YYYY-MM), or null when there are no arrears. */
  arrearsSincePeriod: string | null;
}

const addMonthsToPeriod = (base: Date, months: number): string => {
  const date = new Date(base.getFullYear(), base.getMonth() + months, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

export const calculateArrears = (
  member: Pick<Member, "joinDate">,
  savings: MemberMonthlySaving[] = [],
  settings: KopdesSettings | null = null
): ArrearsInfo => {
  const monthlyTarget = settings ? settings.monthlyDuesAmount : 10000;
  
  if (!member.joinDate) {
    return { monthsElapsed: 0, target: 0, paid: 0, arrears: 0, paidThroughPeriod: null, arrearsSincePeriod: null };
  }
  
  const joinDate = new Date(member.joinDate);
  const currentDate = new Date();
  
  const yearsDiff = currentDate.getFullYear() - joinDate.getFullYear();
  const monthsDiff = currentDate.getMonth() - joinDate.getMonth();
  const monthsElapsed = Math.max(1, (yearsDiff * 12) + monthsDiff + 1);
  
  const target = (monthsElapsed * monthlyTarget);
  const paid = savings
    .filter(s => s.period !== "POKOK")
    .reduce((sum, s) => sum + s.requiredSaving, 0);
    
  const arrears = Math.max(0, target - paid);

  // Payments are pooled, so they fill months in order starting from the join month.
  const monthsCovered = monthlyTarget > 0 ? Math.floor(paid / monthlyTarget) : monthsElapsed;
  const paidThroughPeriod = monthsCovered > 0 ? addMonthsToPeriod(joinDate, monthsCovered - 1) : null;
  const arrearsSincePeriod = arrears > 0 ? addMonthsToPeriod(joinDate, monthsCovered) : null;

  return {
    monthsElapsed,
    target,
    paid,
    arrears,
    paidThroughPeriod,
    arrearsSincePeriod
  };
};
