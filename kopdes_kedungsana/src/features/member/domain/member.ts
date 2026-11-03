export type Member = {
  id: string;
  nik: string;
  name: string;
  photoUrl: string | null;
  birthPlace: string;
  birthDate: string;
  gender: "laki-laki" | "perempuan";
  phone: string;
  address: string;
  joinDate: string;
  status: "aktif" | "nonaktif";
  
  // Data Tambahan KTP
  bloodType?: string;
  religion?: string;
  maritalStatus?: string;
  occupation?: string;
};

// The only member fields the public Cek Simpanan portal displays. Anything
// else (birth date, phone, religion, ...) is personal data that must not
// leave the server for an unauthenticated visitor.
export type PublicMemberProfile = Pick<
  Member,
  "nik" | "name" | "photoUrl" | "address" | "joinDate" | "status"
>;
