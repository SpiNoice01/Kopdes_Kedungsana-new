import type { MemberRepository } from "../domain/member-repository";

export class UpdateMemberStatusUseCase {
  constructor(private readonly memberRepository: MemberRepository) {}

  async execute(
    memberId: string,
    status: "aktif" | "nonaktif",
  ): Promise<{ success: boolean; message: string }> {
    const member = await this.memberRepository.findById(memberId);

    if (!member) {
      return {
        success: false,
        message: "Anggota tidak ditemukan.",
      };
    }

    if (member.status === status) {
      return {
        success: false,
        message: `Status anggota sudah dalam kondisi "${status}".`,
      };
    }

    await this.memberRepository.updateStatus(memberId, status);

    const action = status === "nonaktif" ? "dinonaktifkan" : "diaktifkan kembali";
    return {
      success: true,
      message: `Keanggotaan atas nama ${member.name} berhasil ${action}.`,
    };
  }
}
