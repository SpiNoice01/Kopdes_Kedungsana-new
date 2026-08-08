import type { Member } from "./member";
import type { MemberMonthlySaving } from "./member-monthly-saving";
import type { MemberServiceContribution } from "./member-service-contribution";

export interface MemberRepository {
  getAll(): Promise<Member[]>;
  findById(id: string): Promise<Member | null>;
  findByNik(nik: string): Promise<Member | null>;
  add(member: Member): Promise<void>;
  getMonthlySavingsByMemberId(memberId: string): Promise<MemberMonthlySaving[]>;
  addMonthlySaving(saving: MemberMonthlySaving): Promise<void>;
  getServiceContributionsByMemberId(memberId: string): Promise<MemberServiceContribution[]>;
  addServiceContribution(contribution: MemberServiceContribution): Promise<void>;
  updatePhoto(id: string, photoUrl: string): Promise<void>;
  updateStatus(id: string, status: "aktif" | "nonaktif"): Promise<void>;
  updateProfile(id: string, updates: Partial<Member>): Promise<void>;
}
