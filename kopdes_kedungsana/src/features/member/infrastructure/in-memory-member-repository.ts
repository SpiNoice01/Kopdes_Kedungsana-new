import type { Member } from "../domain/member";
import type { MemberMonthlySaving } from "../domain/member-monthly-saving";
import type { MemberRepository } from "../domain/member-repository";
import { memberSeed } from "./member-seed";

const members: Member[] = [...memberSeed];
const memberMonthlySavings: MemberMonthlySaving[] = [];

export class InMemoryMemberRepository implements MemberRepository {
  async getAll(): Promise<Member[]> {
    return [...members];
  }

  async findById(id: string): Promise<Member | null> {
    const member = members.find((item) => item.id === id);
    return member ?? null;
  }

  async findByNik(nik: string): Promise<Member | null> {
    const member = members.find((item) => item.nik === nik);
    return member ?? null;
  }

  async add(member: Member): Promise<void> {
    members.unshift(member);
  }

  async getMonthlySavingsByMemberId(
    memberId: string,
  ): Promise<MemberMonthlySaving[]> {
    return memberMonthlySavings
      .filter((item) => item.memberId === memberId)
      .sort((a, b) => b.period.localeCompare(a.period));
  }

  async addMonthlySaving(saving: MemberMonthlySaving): Promise<void> {
    const existingIndex = memberMonthlySavings.findIndex(
      (item) => item.memberId === saving.memberId && item.period === saving.period,
    );

    if (existingIndex >= 0) {
      memberMonthlySavings.splice(existingIndex, 1, saving);
      return;
    }

    memberMonthlySavings.unshift(saving);
  }
}
