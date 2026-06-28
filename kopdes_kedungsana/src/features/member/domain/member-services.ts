import type { Member } from "./member";
import type { MemberMonthlySaving } from "./member-monthly-saving";
import type { KopdesSettings } from "../../settings/domain/settings";

export interface ArrearsInfo {
  monthsElapsed: number;
  target: number;
  paid: number;
  arrears: number;
}

export const calculateArrears = (
  member: Member,
  savings: MemberMonthlySaving[] = [],
  settings: KopdesSettings | null = null
): ArrearsInfo => {
  const monthlyTarget = settings ? settings.monthlyDuesAmount : 10000;
  
  if (!member.joinDate) return { monthsElapsed: 0, target: 0, paid: 0, arrears: 0 };
  
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
  
  return {
    monthsElapsed,
    target,
    paid,
    arrears
  };
};
