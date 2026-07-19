import type { Member } from "../domain/member";
import type { MemberRepository } from "../domain/member-repository";

export class UpdateMemberProfileUseCase {
  constructor(private readonly memberRepository: MemberRepository) {}

  async execute(id: string, updates: Partial<Member>): Promise<{ success: boolean; message: string }> {
    try {
      await this.memberRepository.updateProfile(id, updates);
      return { success: true, message: "Profil anggota berhasil diperbarui." };
    } catch (error: any) {
      return { success: false, message: error.message || "Terjadi kesalahan saat memperbarui profil." };
    }
  }
}
