import type { Member } from "./member";
import type { MemberMonthlySaving } from "./member-monthly-saving";
import type { MemberServiceContribution } from "./member-service-contribution";
import type { MemberInvestment } from "./member-investment";

export interface MemberRepository {
  getAll(): Promise<Member[]>;
  findById(id: string): Promise<Member | null>;
  findByNik(nik: string): Promise<Member | null>;
  add(member: Member): Promise<void>;
  getMonthlySavingsByMemberId(memberId: string): Promise<MemberMonthlySaving[]>;
  addMonthlySaving(saving: MemberMonthlySaving): Promise<void>;
  getServiceContributionsByMemberId(memberId: string): Promise<MemberServiceContribution[]>;
  addServiceContribution(contribution: MemberServiceContribution): Promise<void>;
  getInvestmentsByMemberId(memberId: string): Promise<MemberInvestment[]>;
  /**
   * Bulk reads for cooperative-wide pages (stats, laporan, SHU). One query
   * per table instead of one per member. Unlike the per-member reads these
   * throw on failure, so a database error never looks like zero balances.
   */
  getAllMonthlySavings(): Promise<MemberMonthlySaving[]>;
  getAllServiceContributions(): Promise<MemberServiceContribution[]>;
  getAllInvestments(): Promise<MemberInvestment[]>;
  addInvestment(investment: MemberInvestment): Promise<void>;
  updatePhoto(id: string, photoUrl: string): Promise<void>;
  updateStatus(id: string, status: "aktif" | "nonaktif"): Promise<void>;
  updateProfile(id: string, updates: Partial<Member>): Promise<void>;
}
