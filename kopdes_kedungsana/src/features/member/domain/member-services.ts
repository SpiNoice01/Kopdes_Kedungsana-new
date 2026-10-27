import type { Member } from "./member";
import type { MemberMonthlySaving } from "./member-monthly-saving";
import type { KopdesSettings } from "../../settings/domain/settings";

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
  member: Member,
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
