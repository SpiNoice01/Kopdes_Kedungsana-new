import type { MemberRepository } from "../domain/member-repository";

export class UpdateMemberPhotoUseCase {
  constructor(private readonly memberRepository: MemberRepository) {}

  async execute(
    memberId: string,
    photoUrl: string,
  ): Promise<{ success: boolean; message: string }> {
    await this.memberRepository.updatePhoto(memberId, photoUrl);
    return {
      success: true,
      message: "Foto profil anggota berhasil diperbarui.",
    };
  }
}
