import type { Member } from "./member";
import type { MemberMonthlySaving } from "./member-monthly-saving";

export interface MemberRepository {
  getAll(): Promise<Member[]>;
  findById(id: string): Promise<Member | null>;
  findByNik(nik: string): Promise<Member | null>;
  add(member: Member): Promise<void>;
  getMonthlySavingsByMemberId(memberId: string): Promise<MemberMonthlySaving[]>;
  addMonthlySaving(saving: MemberMonthlySaving): Promise<void>;
}
