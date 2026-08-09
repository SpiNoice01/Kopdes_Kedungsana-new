import type { Member } from "../domain/member";
import type { MemberMonthlySaving } from "../domain/member-monthly-saving";
import type { MemberServiceContribution } from "../domain/member-service-contribution";
import type { MemberInvestment } from "../domain/member-investment";
import type { MemberRepository } from "../domain/member-repository";
import { memberSeed } from "./member-seed";

const members: Member[] = [...memberSeed];
const memberServiceContributions: MemberServiceContribution[] = [];
const memberInvestments: MemberInvestment[] = [];
const memberMonthlySavings: MemberMonthlySaving[] = [
  {
    id: "saving-001",
    memberId: "member-001",
    period: "2026-01",
    requiredSaving: 10000,
    voluntarySaving: 5000,
    totalSaving: 15000,
    inputDate: "2026-01-05",
  },
  {
    id: "saving-002",
    memberId: "member-001",
    period: "2026-02",
    requiredSaving: 10000,
    voluntarySaving: 15000,
    totalSaving: 25000,
    inputDate: "2026-02-05",
  },
  {
    id: "saving-003",
    memberId: "member-001",
    period: "2026-03",
    requiredSaving: 10000,
    voluntarySaving: 0,
    totalSaving: 10000,
    inputDate: "2026-03-05",
  },
  {
    id: "saving-004",
    memberId: "member-001",
    period: "2026-04",
    requiredSaving: 10000,
    voluntarySaving: 20000,
    totalSaving: 30000,
    inputDate: "2026-04-05",
  },
  {
    id: "saving-005",
    memberId: "member-001",
    period: "2026-05",
    requiredSaving: 10000,
    voluntarySaving: 10000,
    totalSaving: 20000,
    inputDate: "2026-05-05",
  },
  {
    id: "saving-006",
    memberId: "member-002",
    period: "2026-01",
    requiredSaving: 10000,
    voluntarySaving: 0,
    totalSaving: 10000,
    inputDate: "2026-01-15",
  },
  {
    id: "saving-007",
    memberId: "member-002",
    period: "2026-02",
    requiredSaving: 10000,
    voluntarySaving: 10000,
    totalSaving: 20000,
    inputDate: "2026-02-15",
  },
  {
    id: "saving-008",
    memberId: "member-002",
    period: "2026-03",
    requiredSaving: 10000,
    voluntarySaving: 5000,
    totalSaving: 15000,
    inputDate: "2026-03-15",
  },
  {
    id: "saving-009",
    memberId: "member-002",
    period: "2026-04",
    requiredSaving: 10000,
    voluntarySaving: 0,
    totalSaving: 10000,
    inputDate: "2026-04-15",
  },
  {
    id: "saving-010",
    memberId: "member-002",
    period: "2026-05",
    requiredSaving: 10000,
    voluntarySaving: 30000,
    totalSaving: 40000,
    inputDate: "2026-05-15",
  },
];

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

  async getServiceContributionsByMemberId(
    memberId: string,
  ): Promise<MemberServiceContribution[]> {
    return memberServiceContributions
      .filter((item) => item.memberId === memberId)
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  async addServiceContribution(contribution: MemberServiceContribution): Promise<void> {
    const existingIndex = memberServiceContributions.findIndex(
      (item) => item.memberId === contribution.memberId && item.period === contribution.period,
    );

    if (existingIndex >= 0) {
      memberServiceContributions.splice(existingIndex, 1, contribution);
      return;
    }

    memberServiceContributions.unshift(contribution);
  }

  async getInvestmentsByMemberId(memberId: string): Promise<MemberInvestment[]> {
    return memberInvestments
      .filter((item) => item.memberId === memberId)
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  async addInvestment(investment: MemberInvestment): Promise<void> {
    const existingIndex = memberInvestments.findIndex(
      (item) => item.memberId === investment.memberId && item.period === investment.period,
    );

    if (existingIndex >= 0) {
      memberInvestments.splice(existingIndex, 1, investment);
      return;
    }

    memberInvestments.unshift(investment);
  }

  async updatePhoto(id: string, photoUrl: string): Promise<void> {
    const idx = members.findIndex((item) => item.id === id);
    if (idx >= 0) {
      members[idx] = { ...members[idx], photoUrl };
    }
  }

  async updateStatus(id: string, status: "aktif" | "nonaktif"): Promise<void> {
    const idx = members.findIndex((item) => item.id === id);
    if (idx >= 0) {
      members[idx] = { ...members[idx], status };
    }
  }

  async updateProfile(id: string, profile: Partial<Member>): Promise<void> {
    const idx = members.findIndex((item) => item.id === id);
    if (idx >= 0) {
      members[idx] = { ...members[idx], ...profile };
    }
  }
}
