import type { Member } from "../domain/member";
import type { MemberRepository } from "../domain/member-repository";

export type AddMemberByKtpPayload = {
  nik: string;
  name: string;
  photoUrl: string | null;
  birthPlace: string;
  birthDate: string;
  gender: "laki-laki" | "perempuan";
  address: string;
};

type AddMemberByKtpResult =
  | { success: true; member: Member }
  | { success: false; message: string };

const normalizeNik = (nik: string): string => nik.replace(/\D/g, "");

const buildMemberFromKtp = (payload: AddMemberByKtpPayload): Member => {
  const nik = normalizeNik(payload.nik);

  return {
    id: `member-${Date.now()}`,
    nik,
    name: payload.name.trim(),
    photoUrl: payload.photoUrl,
    birthPlace: payload.birthPlace.trim(),
    birthDate: payload.birthDate,
    gender: payload.gender,
    phone: "-",
    address: payload.address.trim(),
    joinDate: new Date().toISOString().slice(0, 10),
    status: "aktif",
  };
};

export class AddMemberByKtpUseCase {
  constructor(private readonly memberRepository: MemberRepository) {}

  async execute(payload: AddMemberByKtpPayload): Promise<AddMemberByKtpResult> {
    const nik = normalizeNik(payload.nik);
    const name = payload.name.trim();
    const birthPlace = payload.birthPlace.trim();
    const birthDate = payload.birthDate.trim();
    const address = payload.address.trim();
    const photoUrl = payload.photoUrl;

    if (nik.length !== 16) {
      return {
        success: false,
        message: "NIK harus 16 digit.",
      };
    }

    if (!name || !birthPlace || !birthDate || !address) {
      return {
        success: false,
        message: "Semua data KTP wajib diisi.",
      };
    }

    if (!photoUrl) {
      return {
        success: false,
        message: "Foto anggota wajib diunggah.",
      };
    }

    const existingMember = await this.memberRepository.findByNik(nik);

    if (existingMember) {
      return {
        success: false,
        message: "NIK sudah terdaftar sebagai anggota.",
      };
    }

    const member = buildMemberFromKtp({
      ...payload,
      nik,
      name,
      photoUrl,
      birthPlace,
      birthDate,
      address,
    });
    await this.memberRepository.add(member);

    return {
      success: true,
      member,
    };
  }
}
