import type { MemberServiceContribution } from "../domain/member-service-contribution";
import type { MemberRepository } from "../domain/member-repository";

export type AddMemberServiceContributionPayload = {
  memberId: string;
  period: string;
  amount: number;
};

type AddMemberServiceContributionResult =
  | { success: true; contribution: MemberServiceContribution }
  | { success: false; message: string };

const isValidPeriod = (value: string): boolean => /^\d{4}-\d{2}$/.test(value);

export class AddMemberServiceContributionUseCase {
  constructor(private readonly memberRepository: MemberRepository) {}

  async execute(
    payload: AddMemberServiceContributionPayload,
  ): Promise<AddMemberServiceContributionResult> {
    const amount = Number(payload.amount);

    if (!isValidPeriod(payload.period)) {
      return {
        success: false,
        message: "Periode wajib format YYYY-MM.",
      };
    }

    if (!Number.isFinite(amount) || amount < 0) {
      return {
        success: false,
        message: "Nominal setoran jasa tidak boleh negatif.",
      };
    }

    const member = await this.memberRepository.findById(payload.memberId);

    if (!member) {
      return {
        success: false,
        message: "Anggota tidak ditemukan.",
      };
    }

    const contribution: MemberServiceContribution = {
      id: crypto.randomUUID(),
      memberId: payload.memberId,
      period: payload.period,
      amount,
      inputDate: new Date().toISOString().slice(0, 10),
    };

    await this.memberRepository.addServiceContribution(contribution);

    return {
      success: true,
      contribution,
    };
  }
}
