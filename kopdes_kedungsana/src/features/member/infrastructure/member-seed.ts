import type { Member } from "../domain/member";

export const memberSeed: Member[] = [
  {
    id: "member-001",
    nik: "3210150101990001",
    name: "Siti Aminah",
    photoUrl: null,
    birthPlace: "Cirebon",
    birthDate: "1999-01-01",
    gender: "perempuan",
    phone: "081234560101",
    address: "Kedungsana RT 01/RW 03",
    joinDate: "2025-01-05",
    status: "aktif",
  },
  {
    id: "member-002",
    nik: "3210150202990002",
    name: "Budi Santoso",
    photoUrl: null,
    birthPlace: "Cirebon",
    birthDate: "1999-02-02",
    gender: "laki-laki",
    phone: "081298761122",
    address: "Kedungsana RT 02/RW 01",
    joinDate: "2025-03-14",
    status: "aktif",
  },
];
