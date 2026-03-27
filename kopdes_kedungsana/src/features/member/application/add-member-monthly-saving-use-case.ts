import type { MemberMonthlySaving } from "../domain/member-monthly-saving";
import type { MemberRepository } from "../domain/member-repository";

export type AddMemberMonthlySavingPayload = {
  memberId: string;
  period: string;
  requiredSaving: number;
  voluntarySaving: number;
};

type AddMemberMonthlySavingResult =
  | { success: true; saving: MemberMonthlySaving }
  | { success: false; message: string };

const isValidPeriod = (value: string): boolean => /^\d{4}-\d{2}$/.test(value);

export class AddMemberMonthlySavingUseCase {
  constructor(private readonly memberRepository: MemberRepository) {}

  async execute(
    payload: AddMemberMonthlySavingPayload,
  ): Promise<AddMemberMonthlySavingResult> {
    const requiredSaving = Number(payload.requiredSaving);
    const voluntarySaving = Number(payload.voluntarySaving);

    if (!isValidPeriod(payload.period)) {
      return {
        success: false,
        message: "Periode wajib format YYYY-MM.",
      };
    }

    if (requiredSaving < 0 || voluntarySaving < 0) {
      return {
        success: false,
        message: "Nominal simpanan tidak boleh negatif.",
      };
    }

    if (requiredSaving === 0 && voluntarySaving === 0) {
      return {
        success: false,
        message: "Isi minimal salah satu nominal simpanan.",
      };
    }

    const member = await this.memberRepository.findById(payload.memberId);

    if (!member) {
      return {
        success: false,
        message: "Anggota tidak ditemukan.",
      };
    }

    const saving: MemberMonthlySaving = {
      id: `saving-${Date.now()}`,
      memberId: payload.memberId,
      period: payload.period,
      requiredSaving,
      voluntarySaving,
      totalSaving: requiredSaving + voluntarySaving,
      inputDate: new Date().toISOString().slice(0, 10),
    };

    await this.memberRepository.addMonthlySaving(saving);

    return {
      success: true,
      saving,
    };
  }
}
