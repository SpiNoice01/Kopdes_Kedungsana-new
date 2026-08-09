import type { MemberInvestment } from "../domain/member-investment";
import type { MemberRepository } from "../domain/member-repository";

export type AddMemberInvestmentPayload = {
  memberId: string;
  period: string;
  amount: number;
};

type AddMemberInvestmentResult =
  | { success: true; investment: MemberInvestment }
  | { success: false; message: string };

const isValidPeriod = (value: string): boolean => /^\d{4}$/.test(value);

export class AddMemberInvestmentUseCase {
  constructor(private readonly memberRepository: MemberRepository) {}

  async execute(
    payload: AddMemberInvestmentPayload,
  ): Promise<AddMemberInvestmentResult> {
    const amount = Number(payload.amount);

    if (!isValidPeriod(payload.period)) {
      return {
        success: false,
        message: "Periode wajib berupa tahun buku (YYYY).",
      };
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return {
        success: false,
        message: "Nominal investasi harus lebih besar dari 0.",
      };
    }

    const member = await this.memberRepository.findById(payload.memberId);

    if (!member) {
      return {
        success: false,
        message: "Anggota tidak ditemukan.",
      };
    }

    const investment: MemberInvestment = {
      id: crypto.randomUUID(),
      memberId: payload.memberId,
      period: payload.period,
      amount,
      inputDate: new Date().toISOString().slice(0, 10),
    };

    await this.memberRepository.addInvestment(investment);

    return {
      success: true,
      investment,
    };
  }
}
