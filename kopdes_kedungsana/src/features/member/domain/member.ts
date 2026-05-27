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
