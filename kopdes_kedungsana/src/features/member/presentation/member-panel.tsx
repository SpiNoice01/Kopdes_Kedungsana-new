"use client";

import Link from "next/link";
import Image from "next/image";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { addAuditLog } from "../../../utils/audit-logger";
import type { Member } from "../domain/member";
import type { MemberMonthlySaving } from "../domain/member-monthly-saving";
import { memberSeed } from "../infrastructure/member-seed";
import { memberDependencies } from "../infrastructure/member-dependencies";

type FeedbackState = {
  message: string;
  isError: boolean;
};

const initialFeedbackState: FeedbackState = {
  message: "",
  isError: false,
};

type KtpFormState = {
  nik: string;
  name: string;
  photoUrl: string | null;
  birthPlace: string;
  birthDate: string;
  gender: "laki-laki" | "perempuan" | "";
  address: string;
  phone: string;
  principalProofUrl: string | null;
  
  // Data Tambahan KTP
  bloodType: string;
  religion: string;
  maritalStatus: string;
  occupation: string;
};

const initialKtpFormState: KtpFormState = {
  nik: "",
  name: "",
  photoUrl: null,
  birthPlace: "",
  birthDate: "",
  gender: "",
  address: "",
  phone: "",
  principalProofUrl: null,
  
  // Data Tambahan KTP
  bloodType: "-",
  religion: "",
  maritalStatus: "",
  occupation: "",
};

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const calculateArrears = (member: Member, savings: MemberMonthlySaving[] = []) => {
  const monthlyTarget = 10000; // Rp 10.000 per bulan
  
  if (!member.joinDate) return { monthsElapsed: 0, target: 0, paid: 0, arrears: 0 };
  
  const joinDate = new Date(member.joinDate);
  const currentDate = new Date();
  
  const yearsDiff = currentDate.getFullYear() - joinDate.getFullYear();
  const monthsDiff = currentDate.getMonth() - joinDate.getMonth();
  const monthsElapsed = Math.max(1, (yearsDiff * 12) + monthsDiff + 1);
  
  const target = monthsElapsed * monthlyTarget;
  const paid = savings.reduce((sum, s) => sum + s.requiredSaving, 0);
  const arrears = Math.max(0, target - paid);
  
  return {
    monthsElapsed,
    target,
    paid,
    arrears
  };
};

export function MemberPanel() {
  const [members, setMembers] = useState<Member[]>(() => [...memberSeed]);
  const [savingsMap, setSavingsMap] = useState<Record<string, MemberMonthlySaving[]>>({});
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [ktpForm, setKtpForm] = useState<KtpFormState>(initialKtpFormState);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackState, setFeedbackState] =
    useState<FeedbackState>(initialFeedbackState);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  useEffect(() => {
    const loadMembersAndSavings = async () => {
      const list = await memberDependencies.getMembersUseCase.execute();
      setMembers(list);
      
      const map: Record<string, MemberMonthlySaving[]> = {};
      for (const m of list) {
        const savings = await memberDependencies.getMemberMonthlySavingsUseCase.execute(m.id);
        map[m.id] = savings;
      }
      setSavingsMap(map);
    };
    void loadMembersAndSavings();
  }, []);

  const parseKtpText = (text: string) => {
    const result = {
      nik: "",
      name: "",
      birthPlace: "",
      birthDate: "",
      gender: "laki-laki" as "laki-laki" | "perempuan",
      address: "",
      bloodType: "-",
      religion: "Islam",
      maritalStatus: "Belum Kawin",
      occupation: "",
    };

    // Clean and split lines
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    // 1. EXTRACT NIK (Resilient to common character/number misreadings like l/I/i -> 1 and o/O -> 0)
    let cleanedTextForNik = text.replace(/[\s:\-]/g, "");
    
    // Fuzzy search for 16-character sequence that matches typical NIK numbers
    const fuzzyNikMatches = cleanedTextForNik.match(/[0-9IlioOsSbB]{16}/);
    if (fuzzyNikMatches) {
      let rawNik = fuzzyNikMatches[0];
      let sanitizedNik = rawNik
        .replace(/[IlisS]/g, "1")
        .replace(/[oO]/g, "0")
        .replace(/[bB]/g, "6")
        .replace(/[^0-9]/g, "");
      if (sanitizedNik.length === 16) {
        result.nik = sanitizedNik;
      }
    }

    // Fallback: If no fuzzy sequence matches, look for lines containing NIK labels
    if (!result.nik) {
      const nikLine = lines.find((l) => {
        const lower = l.toLowerCase();
        return lower.includes("nik") || lower.includes("n1k") || lower.includes("n.i.k") || lower.includes("nık");
      });
      if (nikLine) {
        const numbers = nikLine
          .replace(/[IlisS]/g, "1")
          .replace(/[oO]/g, "0")
          .replace(/[bB]/g, "6")
          .replace(/[^0-9]/g, "");
        if (numbers.length >= 15) {
          result.nik = numbers.slice(0, 16);
        }
      }
    }

    // 2. EXTRACT NAMA (Fuzzy search for Nama keyword, fallback to line directly below NIK)
    let nikLineIndex = lines.findIndex((l) => {
      const lower = l.toLowerCase();
      return lower.includes("nik") || lower.includes("n1k") || lower.includes("n.i.k") || (result.nik && l.includes(result.nik));
    });

    const namaLineIndex = lines.findIndex((l) => {
      const lower = l.toLowerCase();
      return (lower.includes("nama") || lower.includes("nara") || lower.includes("nema") || lower.includes("narn") || lower.includes("nania")) && 
             !lower.includes("jenis") && !lower.includes("ibu") && !lower.includes("bapa") && !lower.includes("darah");
    });

    let rawNama = "";
    if (namaLineIndex !== -1) {
      rawNama = lines[namaLineIndex].replace(/^(nama|nara|nema|narn|nania|name)\s*[:\-]?/i, "").trim();
      if (!rawNama && namaLineIndex + 1 < lines.length) {
        rawNama = lines[namaLineIndex + 1];
      }
    } else if (nikLineIndex !== -1 && nikLineIndex + 1 < lines.length) {
      // Direct Layout Fallback: Standard KTP has Nama exactly on the line following NIK
      const candidateLine = lines[nikLineIndex + 1];
      if (!candidateLine.toLowerCase().includes("lahir") && !candidateLine.toLowerCase().includes("tempat") && !candidateLine.toLowerCase().includes("kelamin")) {
        rawNama = candidateLine;
      }
    }

    if (rawNama) {
      result.name = rawNama
        .replace(/[^a-zA-Z\s]/g, "") // Keep only alphabet and spaces
        .replace(/\b(nama|nara|nema|narn|nania|name|nik)\b/gi, "") // Remove accidental header captures
        .replace(/\s+/g, " ") // Clean duplicate spaces
        .trim()
        .toUpperCase();
    }

    // 3. EXTRACT TEMPAT & TANGGAL LAHIR
    const lahirLine = lines.find((l) => {
      const lower = l.toLowerCase();
      return lower.includes("lahir") || lower.includes("tempat/tgl") || lower.includes("tempat/tanggal") || lower.includes("tgl");
    });

    if (lahirLine) {
      const cleanLahir = lahirLine.replace(/^.*(lahir|tgl|tanggal)\s*[:\-]?/i, "").trim();
      
      // Resilient Date extraction: matches DD-MM-YYYY, DD/MM/YYYY or DD MM YYYY
      const dateMatch = cleanLahir.match(/(\d{2})[\s\-\/](\d{2})[\s\-\/](\d{4})/);
      if (dateMatch) {
        const day = dateMatch[1];
        const month = dateMatch[2];
        const year = dateMatch[3];
        result.birthDate = `${year}-${month}-${day}`; // ISO format YYYY-MM-DD
        
        // Extract place by taking everything before the date and any commas
        let placePart = cleanLahir.split(dateMatch[0])[0].replace(/,/g, "").trim();
        result.birthPlace = placePart.replace(/[^a-zA-Z\s]/g, "").trim().toUpperCase();
      } else {
        const commaParts = cleanLahir.split(",");
        if (commaParts.length > 0) {
          result.birthPlace = commaParts[0].replace(/[^a-zA-Z\s]/g, "").trim().toUpperCase();
        }
      }
    }

    // Secondary fallback for Date scan (anywhere in KTP text)
    if (!result.birthDate) {
      const globalDateMatch = text.match(/(\d{2})[\s\-\/](\d{2})[\s\-\/](\d{4})/);
      if (globalDateMatch) {
        const day = globalDateMatch[1];
        const month = globalDateMatch[2];
        const year = globalDateMatch[3];
        result.birthDate = `${year}-${month}-${day}`;
      }
    }

    // 4. EXTRACT JENIS KELAMIN
    const lowerText = text.toLowerCase();
    if (lowerText.includes("perempuan") || lowerText.includes("wanita") || lowerText.includes("puan") || lowerText.includes("prp") || lowerText.includes("remp")) {
      result.gender = "perempuan";
    } else {
      result.gender = "laki-laki";
    }

    // 5. EXTRACT ALAMAT LENGKAP (Resilient component extraction for RT/RW, Kel/Desa, Kecamatan)
    let coreAlamat = "";
    let rtrw = "";
    let keldesa = "";
    let kecamatan = "";

    // Find main Alamat line
    const alamatIndex = lines.findIndex((l) => {
      const lower = l.toLowerCase();
      return (lower.includes("alamat") || lower.includes("alama") || lower.includes("alamt") || lower.includes("alamar")) && 
             !lower.includes("provinsi") && !lower.includes("kabupaten") && !lower.includes("kota");
    });

    if (alamatIndex !== -1) {
      coreAlamat = lines[alamatIndex]
        .replace(/^(alamat|alama|alamt|alamar)\s*[:\-]?/i, "")
        .replace(/rt\/rw.*/i, "") // Avoid capturing RT/RW if it leaked into same line
        .trim()
        .toUpperCase();
    }

    // Find RT/RW line
    const rtrwLine = lines.find((l) => {
      const lower = l.toLowerCase();
      return lower.includes("rt/rw") || lower.includes("rt / rw") || lower.includes("rt/rvv") || (lower.includes("rt") && lower.includes("rw"));
    });
    if (rtrwLine) {
      const rtMatch = rtrwLine.match(/(\d{3}\s*\/\s*\d{3})/);
      if (rtMatch) {
        rtrw = `RT. ${rtMatch[0].replace(/\s/g, "")}`;
      } else {
        const cleanRtRw = rtrwLine.replace(/^(rt\/rw|rt\s*\/rw|rt\/rvv)\s*[:\-]?/i, "").trim().toUpperCase();
        if (cleanRtRw && cleanRtRw.length > 2) rtrw = `RT/RW ${cleanRtRw}`;
      }
    }

    // Find Kel/Desa line
    const keldesaLine = lines.find((l) => {
      const lower = l.toLowerCase();
      return lower.includes("kel/") || lower.includes("kel/desa") || lower.includes("desa") || lower.includes("kelurahan") || lower.includes("keli") || lower.includes("ke/desa");
    });
    if (keldesaLine) {
      const cleanKel = keldesaLine.replace(/^(kel\/desa|kel\/|desa|kelurahan|keli|ke\/desa)\s*[:\-]?/i, "").trim().toUpperCase();
      if (cleanKel && !cleanKel.includes("KECAMATAN")) keldesa = `DESA ${cleanKel}`;
    }

    // Find Kecamatan line
    const kecLine = lines.find((l) => {
      const lower = l.toLowerCase();
      return lower.includes("kecamatan") || lower.includes("kecam") || lower.includes("kec.");
    });
    if (kecLine) {
      const cleanKec = kecLine.replace(/^(kecamatan|kecam|kec\.)\s*[:\-]?/i, "").trim().toUpperCase();
      if (cleanKec) kecamatan = `KEC. ${cleanKec}`;
    }

    // Synthesize structured address
    const addressParts = [];
    if (coreAlamat && coreAlamat.length > 3) addressParts.push(coreAlamat);
    if (rtrw) addressParts.push(rtrw);
    if (keldesa) addressParts.push(keldesa);
    if (kecamatan) addressParts.push(kecamatan);

    result.address = addressParts.join(", ");

    // 6. EXTRACT GOLONGAN DARAH
    const darahLine = lines.find((l) => l.toLowerCase().includes("darah") || l.toLowerCase().includes("gol"));
    if (darahLine) {
      const match = darahLine.match(/gol\s*\.?\s*darah\s*[:\-]?\s*(ab|a|b|o|-)/i);
      if (match) {
        result.bloodType = match[1].toUpperCase();
      }
    }
    if (!result.bloodType || result.bloodType === "-") {
      const contextMatch = text.match(/gol[.\s]*darah[:\s]*(ab|a|b|o|-)/i);
      if (contextMatch) {
        result.bloodType = contextMatch[1].toUpperCase();
      }
    }

    // 7. EXTRACT AGAMA
    const agamaLine = lines.find((l) => l.toLowerCase().includes("agama"));
    if (agamaLine) {
      const cleanAgama = agamaLine.replace(/^.*agama\s*[:\-]?/i, "").trim().toLowerCase();
      if (cleanAgama.includes("islam")) result.religion = "Islam";
      else if (cleanAgama.includes("kristen")) result.religion = "Kristen";
      else if (cleanAgama.includes("katolik")) result.religion = "Katolik";
      else if (cleanAgama.includes("hindu")) result.religion = "Hindu";
      else if (cleanAgama.includes("buda") || cleanAgama.includes("buddha")) result.religion = "Buddha";
      else if (cleanAgama.includes("khong") || cleanAgama.includes("kong")) result.religion = "Khonghucu";
    }

    // 8. EXTRACT STATUS PERKAWINAN
    const statusLine = lines.find((l) => l.toLowerCase().includes("status") && (l.toLowerCase().includes("kawin") || l.toLowerCase().includes("pernikahan") || l.toLowerCase().includes("perkawinan")));
    if (statusLine) {
      const cleanStatus = statusLine.toLowerCase();
      if (cleanStatus.includes("belum kawin") || cleanStatus.includes("belum")) {
        result.maritalStatus = "Belum Kawin";
      } else if (cleanStatus.includes("cerai hidup")) {
        result.maritalStatus = "Cerai Hidup";
      } else if (cleanStatus.includes("cerai mati")) {
        result.maritalStatus = "Cerai Mati";
      } else if (cleanStatus.includes("kawin")) {
        result.maritalStatus = "Kawin";
      }
    }

    // 9. EXTRACT PEKERJAAN
    const pekerjaanLine = lines.find((l) => l.toLowerCase().includes("pekerjaan") || l.toLowerCase().includes("pekerja"));
    if (pekerjaanLine) {
      const cleanPekerjaan = pekerjaanLine.replace(/^.*pekerjaan\s*[:\-]?/i, "").trim().toUpperCase();
      result.occupation = cleanPekerjaan.replace(/[^a-zA-Z\s]/g, "").replace(/\s+/g, " ").trim();
    }

    return result;
  };

  const handleKtpScanChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFeedbackState({
        message: "File harus berupa gambar KTP (jpg/png/webp).",
        isError: true,
      });
      return;
    }

    const maxBytes = 4 * 1024 * 1024;
    if (file.size > maxBytes) {
      setFeedbackState({
        message: "Ukuran gambar KTP maksimal 4MB.",
        isError: true,
      });
      return;
    }

    setIsOcrLoading(true);
    setOcrProgress(0);
    setFeedbackState({
      message: "Menginisialisasi pemindaian OCR...",
      isError: false,
    });

    try {
      const Tesseract = (await import("tesseract.js")).default;
      const result = await Tesseract.recognize(
        file,
        "ind+eng",
        {
          logger: (m) => {
            if (m.status === "recognizing text") {
              setOcrProgress(Math.round(m.progress * 100));
              setFeedbackState({
                message: `Memindai teks KTP... (${Math.round(m.progress * 100)}%)`,
                isError: false,
              });
            }
          },
        }
      );

      const text = result.data.text;
      const parsedData = parseKtpText(text);

      setKtpForm((prev) => ({
        ...prev,
        nik: parsedData.nik || prev.nik,
        name: parsedData.name || prev.name,
        birthPlace: parsedData.birthPlace || prev.birthPlace,
        birthDate: parsedData.birthDate || prev.birthDate,
        gender: parsedData.gender || prev.gender,
        address: parsedData.address || prev.address,
        bloodType: parsedData.bloodType || prev.bloodType,
        religion: parsedData.religion || prev.religion,
        maritalStatus: parsedData.maritalStatus || prev.maritalStatus,
        occupation: parsedData.occupation || prev.occupation,
      }));

      addAuditLog(
        "OCR_SCAN",
        `Berhasil mengekstrak data identitas KTP secara otomatis untuk calon anggota [${parsedData.name || "NAMA TIDAK TERBACA"}] via OCR Scanner.`,
        "success"
      );

      setFeedbackState({
        message: "Pemindaian KTP sukses! Data berhasil diisi otomatis. Silakan verifikasi kembali.",
        isError: false,
      });
    } catch (error) {
      console.error("OCR Scan Error:", error);
      setFeedbackState({
        message: "Gagal memindai KTP. Silakan isi form manual di bawah.",
        isError: true,
      });
    } finally {
      setIsOcrLoading(false);
      setOcrProgress(0);
    }
  };

  const handlePrincipalProofChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFeedbackState({
        message: "File harus berupa gambar (jpg/png/webp).",
        isError: true,
      });
      return;
    }
    const maxBytes = 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      setFeedbackState({ message: "Ukuran bukti maksimal 2MB.", isError: true });
      return;
    }
    const fileReader = new FileReader();
    fileReader.onload = () => {
      const url =
        typeof fileReader.result === "string" ? fileReader.result : null;
      setKtpForm((prev) => ({ ...prev, principalProofUrl: url }));
      setFeedbackState(initialFeedbackState);
    };
    fileReader.readAsDataURL(file);
  };

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setFeedbackState({
        message: "File harus berupa gambar (jpg/png/webp).",
        isError: true,
      });
      return;
    }

    const maxBytes = 2 * 1024 * 1024;

    if (file.size > maxBytes) {
      setFeedbackState({
        message: "Ukuran foto maksimal 2MB.",
        isError: true,
      });
      return;
    }

    const fileReader = new FileReader();

    fileReader.onload = () => {
      const photoUrl =
        typeof fileReader.result === "string" ? fileReader.result : null;

      setKtpForm((previous) => ({
        ...previous,
        photoUrl,
      }));

      setFeedbackState(initialFeedbackState);
    };

    fileReader.readAsDataURL(file);
  };

  const openAddModal = () => {
    setFeedbackState(initialFeedbackState);
    setKtpForm(initialKtpFormState);
    setShowValidationErrors(false);
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setIsLoading(false);
    setShowValidationErrors(false);
  };

  const handleSubmitKtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedbackState(initialFeedbackState);

    // Validate fields
    const normalizedNik = ktpForm.nik.replace(/\D/g, "");
    const isNikInvalid = normalizedNik.length !== 16;
    const isNameInvalid = !ktpForm.name.trim();
    const isBirthPlaceInvalid = !ktpForm.birthPlace.trim();
    const isBirthDateInvalid = !ktpForm.birthDate.trim();
    const isGenderInvalid = !ktpForm.gender;
    const isPhoneInvalid = !ktpForm.phone.trim();
    const isAddressInvalid = !ktpForm.address.trim();
    const isReligionInvalid = !ktpForm.religion;
    const isMaritalStatusInvalid = !ktpForm.maritalStatus;
    const isOccupationInvalid = !ktpForm.occupation.trim();
    const isPhotoInvalid = !ktpForm.photoUrl;
    const isProofInvalid = !ktpForm.principalProofUrl;

    if (
      isNikInvalid ||
      isNameInvalid ||
      isBirthPlaceInvalid ||
      isBirthDateInvalid ||
      isGenderInvalid ||
      isPhoneInvalid ||
      isAddressInvalid ||
      isReligionInvalid ||
      isMaritalStatusInvalid ||
      isOccupationInvalid ||
      isPhotoInvalid ||
      isProofInvalid
    ) {
      setShowValidationErrors(true);
      setFeedbackState({
        message: "Harap isi semua kolom wajib dan unggah dokumen pendukung yang ditandai merah.",
        isError: true,
      });
      return;
    }

    setIsLoading(true);

    const result =
      await memberDependencies.addMemberByKtpUseCase.execute({
        ...ktpForm,
        // Safe type cast since gender is verified not to be ""
        gender: ktpForm.gender as "laki-laki" | "perempuan",
      });

    if (!result.success) {
      setFeedbackState({
        message: result.message,
        isError: true,
      });
      setIsLoading(false);
      return;
    }

    setMembers((previousMembers) => [result.member, ...previousMembers]);
    setSavingsMap((prev) => ({
      ...prev,
      [result.member.id]: [],
    }));
    addAuditLog(
      "ADD_MEMBER",
      `Berhasil mendaftarkan anggota baru [${result.member.name}] dengan NIK ${result.member.nik} ke dalam database koperasi.`,
      "success"
    );
    setFeedbackState({
      message: `Data anggota KTP ${result.member.name} berhasil ditambahkan.`,
      isError: false,
    });
    setKtpForm(initialKtpFormState);
    setShowValidationErrors(false);
    setIsLoading(false);
    setIsAddModalOpen(false);
  };

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-primary">
              Panel Anggota
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Kelola data anggota. Tambah anggota baru berdasarkan data KTP.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95"
          >
            Tambah Anggota (Data KTP)
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {members.map((member) => (
          <Link
            key={member.id}
            href={`/admin/input-data/${member.id}`}
            className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-primary/30"
          >
            <div className="mb-3">
              {member.photoUrl ? (
                <Image
                  src={member.photoUrl}
                  alt={`Foto ${member.name}`}
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary-soft text-lg font-semibold text-primary">
                  {member.name.slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
            <p className="text-base font-semibold text-slate-800">
              {member.name}
            </p>
            <p className="mt-1 text-sm text-slate-500">NIK: {member.nik}</p>
            <p className="mt-1 text-sm text-slate-500">
              TTL: {member.birthPlace}, {member.birthDate}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Jenis Kelamin: {member.gender}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span className="inline-flex rounded-full bg-primary-soft px-2.5 py-1 text-xs font-bold text-primary">
                Status: {member.status}
              </span>
              <span className="text-[10px] text-slate-400 font-semibold font-mono">Join: {member.joinDate}</span>
            </div>

            {/* Arrears status */}
            <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status Tunggakan Wajib:</span>
              {(() => {
                const sList = savingsMap[member.id] || [];
                const info = calculateArrears(member, sList);
                if (info.arrears > 0) {
                  return (
                    <div className="bg-red-50 border border-red-100 rounded-xl p-2 flex flex-col">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-red-600 uppercase">Menunggak {info.monthsElapsed} Bulan</span>
                        <span className="text-xs font-extrabold text-red-600">{formatCurrency(info.arrears)}</span>
                      </div>
                      <span className="text-[9px] text-red-500 mt-0.5 font-medium">Target: {formatCurrency(info.target)} | Dibayar: {formatCurrency(info.paid)}</span>
                    </div>
                  );
                } else {
                  return (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-600 uppercase">LUNAS / AMAN</span>
                      <span className="text-xs font-extrabold text-emerald-600">Rp 0</span>
                    </div>
                  );
                }
              })()}
            </div>
          </Link>
        ))}
      </div>

      {isAddModalOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100">
            {/* Header Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  Tambah Anggota Berdasarkan KTP
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lengkapi data identitas dan dokumen pendukung sesuai dengan KTP.
                </p>
              </div>
              <button
                type="button"
                onClick={closeAddModal}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Tutup
              </button>
            </div>

            {/* Form & Modal Content */}
            <form onSubmit={handleSubmitKtp} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-5">
                
                {/* Pindai KTP Banner / Dropzone */}
                <div className="mb-6 p-4 rounded-xl border border-dashed border-primary/50 bg-primary-soft/40 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-primary text-white rounded-lg">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Pindai KTP Otomatis (OCR)</h4>
                      <p className="text-[11px] text-slate-500">Unggah foto KTP Anda untuk mengisi formulir secara otomatis.</p>
                    </div>
                  </div>

                  <div className="relative w-full sm:w-auto">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleKtpScanChange}
                      disabled={isOcrLoading}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                    />
                    <button
                      type="button"
                      disabled={isOcrLoading}
                      className="w-full sm:w-auto px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:opacity-90 transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isOcrLoading ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          <span>Memindai ({ocrProgress}%)</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          <span>Pindai Gambar KTP</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Kolom Kiri: Identitas Diri */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-slate-100 pb-1.5">
                      Identitas Diri
                    </h4>

                    <label className="block space-y-1.5 text-sm">
                      <span className="font-medium text-slate-700">NIK</span>
                      <input
                        type="text"
                        value={ktpForm.nik}
                        onChange={(event) =>
                          setKtpForm((previous) => ({
                            ...previous,
                            nik: event.target.value,
                          }))
                        }
                        placeholder="Masukkan 16 digit NIK"
                        className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition ${
                          showValidationErrors && ktpForm.nik.replace(/\D/g, "").length !== 16
                            ? "border-red-500 focus:border-red-500 bg-red-50/20"
                            : "border-slate-300 focus:border-primary bg-white"
                        }`}
                      />
                    </label>

                    <label className="block space-y-1.5 text-sm">
                      <span className="font-medium text-slate-700">Nama (Sesuai KTP)</span>
                      <input
                        type="text"
                        value={ktpForm.name}
                        onChange={(event) =>
                          setKtpForm((previous) => ({
                            ...previous,
                            name: event.target.value,
                          }))
                        }
                        placeholder="Masukkan nama lengkap"
                        className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition ${
                          showValidationErrors && !ktpForm.name.trim()
                            ? "border-red-500 focus:border-red-500 bg-red-50/20"
                            : "border-slate-300 focus:border-primary bg-white"
                        }`}
                      />
                    </label>

                    <div className="grid gap-3 grid-cols-2">
                      <label className="block space-y-1.5 text-sm">
                        <span className="font-medium text-slate-700">Tempat Lahir</span>
                        <input
                          type="text"
                          value={ktpForm.birthPlace}
                          onChange={(event) =>
                            setKtpForm((previous) => ({
                              ...previous,
                              birthPlace: event.target.value,
                            }))
                          }
                          placeholder="Contoh: Cirebon"
                          className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition ${
                            showValidationErrors && !ktpForm.birthPlace.trim()
                              ? "border-red-500 focus:border-red-500 bg-red-50/20"
                              : "border-slate-300 focus:border-primary bg-white"
                          }`}
                        />
                      </label>

                      <label className="block space-y-1.5 text-sm">
                        <span className="font-medium text-slate-700">Tanggal Lahir</span>
                        <input
                          type="date"
                          value={ktpForm.birthDate}
                          onChange={(event) =>
                            setKtpForm((previous) => ({
                              ...previous,
                              birthDate: event.target.value,
                            }))
                          }
                          className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition ${
                            showValidationErrors && !ktpForm.birthDate.trim()
                              ? "border-red-500 focus:border-red-500 bg-red-50/20"
                              : "border-slate-300 focus:border-primary bg-white"
                          }`}
                        />
                      </label>
                    </div>

                    <div className="grid gap-3 grid-cols-2">
                      <label className="block space-y-1.5 text-sm">
                        <span className="font-medium text-slate-700">Jenis Kelamin</span>
                        <select
                          value={ktpForm.gender}
                          onChange={(event) =>
                            setKtpForm((previous) => ({
                              ...previous,
                              gender: event.target.value as "laki-laki" | "perempuan" | "",
                            }))
                          }
                          className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition bg-white ${
                            showValidationErrors && !ktpForm.gender
                              ? "border-red-500 focus:border-red-500 bg-red-50/20"
                              : "border-slate-300 focus:border-primary"
                          }`}
                        >
                          <option value="">-- Pilih Jenis Kelamin --</option>
                          <option value="laki-laki">Laki-laki</option>
                          <option value="perempuan">Perempuan</option>
                        </select>
                      </label>

                      <label className="block space-y-1.5 text-sm">
                        <span className="font-medium text-slate-700">Nomor HP</span>
                        <input
                          type="tel"
                          value={ktpForm.phone}
                          onChange={(event) =>
                            setKtpForm((previous) => ({
                              ...previous,
                              phone: event.target.value,
                            }))
                          }
                          placeholder="Contoh: 081234567890"
                          className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition ${
                            showValidationErrors && !ktpForm.phone.trim()
                              ? "border-red-500 focus:border-red-500 bg-red-50/20"
                              : "border-slate-300 focus:border-primary bg-white"
                          }`}
                        />
                      </label>
                    </div>

                    <label className="block space-y-1.5 text-sm">
                      <span className="font-medium text-slate-700">Alamat (Sesuai KTP)</span>
                      <textarea
                        value={ktpForm.address}
                        onChange={(event) =>
                          setKtpForm((previous) => ({
                            ...previous,
                            address: event.target.value,
                          }))
                        }
                        rows={2}
                        placeholder="Masukkan alamat lengkap sesuai KTP"
                        className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition resize-none ${
                          showValidationErrors && !ktpForm.address.trim()
                            ? "border-red-500 focus:border-red-500 bg-red-50/20"
                            : "border-slate-300 focus:border-primary bg-white"
                        }`}
                      />
                    </label>
                  </div>
                  {/* Kolom Kanan: Data KTP Tambahan & Dokumen Pendukung */}
                  <div className="space-y-5">
                    
                    {/* Bagian: Data Tambahan KTP */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-slate-100 pb-1.5">
                        Data Tambahan KTP
                      </h4>

                      <div className="grid gap-3 grid-cols-2">
                        <label className="block space-y-1.5 text-sm">
                          <span className="font-medium text-slate-700">Gol. Darah</span>
                          <select
                            value={ktpForm.bloodType}
                            onChange={(event) =>
                              setKtpForm((previous) => ({
                                ...previous,
                                bloodType: event.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary transition bg-white"
                          >
                            <option value="-">-</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="AB">AB</option>
                            <option value="O">O</option>
                          </select>
                        </label>

                        <label className="block space-y-1.5 text-sm">
                          <span className="font-medium text-slate-700">Agama</span>
                          <select
                            value={ktpForm.religion}
                            onChange={(event) =>
                              setKtpForm((previous) => ({
                                ...previous,
                                religion: event.target.value,
                              }))
                            }
                            className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition bg-white ${
                              showValidationErrors && !ktpForm.religion
                                ? "border-red-500 focus:border-red-500 bg-red-50/20"
                                : "border-slate-300 focus:border-primary"
                            }`}
                          >
                            <option value="">-- Pilih Agama --</option>
                            <option value="Islam">Islam</option>
                            <option value="Kristen">Kristen</option>
                            <option value="Katolik">Katolik</option>
                            <option value="Hindu">Hindu</option>
                            <option value="Buddha">Buddha</option>
                            <option value="Khonghucu">Khonghucu</option>
                            <option value="Lainnya">Lainnya</option>
                          </select>
                        </label>
                      </div>

                      <div className="grid gap-3 grid-cols-2">
                        <label className="block space-y-1.5 text-sm">
                          <span className="font-medium text-slate-700">Status Pernikahan</span>
                          <select
                            value={ktpForm.maritalStatus}
                            onChange={(event) =>
                              setKtpForm((previous) => ({
                                ...previous,
                                maritalStatus: event.target.value,
                              }))
                            }
                            className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition bg-white ${
                              showValidationErrors && !ktpForm.maritalStatus
                                ? "border-red-500 focus:border-red-500 bg-red-50/20"
                                : "border-slate-300 focus:border-primary"
                            }`}
                          >
                            <option value="">-- Pilih Status --</option>
                            <option value="Belum Kawin">Belum Kawin</option>
                            <option value="Kawin">Kawin</option>
                            <option value="Cerai Hidup">Cerai Hidup</option>
                            <option value="Cerai Mati">Cerai Mati</option>
                          </select>
                        </label>

                        <label className="block space-y-1.5 text-sm">
                          <span className="font-medium text-slate-700">Pekerjaan</span>
                          <input
                            type="text"
                            value={ktpForm.occupation}
                            onChange={(event) =>
                              setKtpForm((previous) => ({
                                ...previous,
                                occupation: event.target.value,
                              }))
                            }
                            placeholder="Contoh: PNS, Wiraswasta"
                            className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition ${
                              showValidationErrors && !ktpForm.occupation.trim()
                                ? "border-red-500 focus:border-red-500 bg-red-50/20"
                                : "border-slate-300 focus:border-primary bg-white"
                            }`}
                          />
                        </label>
                      </div>
                    </div>

                    {/* Bagian: Dokumen Pendukung */}
                    <div className="space-y-4 pt-1">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-slate-100 pb-1.5">
                        Dokumen Pendukung
                      </h4>

                      <div className={`rounded-xl border p-4 space-y-3 transition ${
                        showValidationErrors && !ktpForm.photoUrl
                          ? "border-red-500 bg-red-50/20"
                          : "border-slate-200 bg-slate-50/50"
                      }`}>
                        <label className="block space-y-1.5 text-sm">
                          <span className="font-semibold text-slate-700">Foto Anggota</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={handlePhotoChange}
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1 file:text-xs file:font-semibold file:text-primary-foreground cursor-pointer"
                          />
                          <p className="text-[11px] text-slate-500">
                            Format: JPG/PNG/WEBP, maksimal 2MB.
                          </p>
                        </label>
                        
                        {ktpForm.photoUrl ? (
                          <div className="relative inline-block mt-1">
                            <Image
                              src={ktpForm.photoUrl}
                              alt="Preview foto anggota"
                              width={112}
                              height={112}
                              className="h-24 w-24 rounded-xl object-cover border border-slate-200 shadow-sm"
                            />
                            <button
                              type="button"
                              onClick={() => setKtpForm((prev) => ({ ...prev, photoUrl: null }))}
                              className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 text-[10px] hover:bg-red-600 shadow-sm leading-none w-5 h-5 flex items-center justify-center cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex h-24 w-24 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-[11px] text-slate-400">
                            Belum ada foto
                          </div>
                        )}
                      </div>

                      <div className={`rounded-xl border p-4 space-y-3 transition ${
                        showValidationErrors && !ktpForm.principalProofUrl
                          ? "border-red-500 bg-red-50/20"
                          : "border-slate-200 bg-slate-50/50"
                      }`}>
                        <label className="block space-y-1.5 text-sm">
                          <span className="font-semibold text-slate-700">
                            Bukti Simpanan Pokok 100000 ribu
                          </span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={handlePrincipalProofChange}
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1 file:text-xs file:font-semibold file:text-primary-foreground cursor-pointer"
                          />
                          <p className="text-[11px] text-slate-500">
                            Format: JPG/PNG/WEBP, maksimal 2MB.
                          </p>
                        </label>

                        {ktpForm.principalProofUrl ? (
                          <div className="relative inline-block mt-1">
                            <Image
                              src={ktpForm.principalProofUrl}
                              alt="Preview bukti simpanan pokok"
                              width={112}
                              height={112}
                              className="h-24 w-24 rounded-xl object-cover border border-slate-200 shadow-sm"
                            />
                            <button
                              type="button"
                              onClick={() => setKtpForm((prev) => ({ ...prev, principalProofUrl: null }))}
                              className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 text-[10px] hover:bg-red-600 shadow-sm leading-none w-5 h-5 flex items-center justify-center cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex h-24 w-24 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-[11px] text-slate-400">
                            Belum ada bukti
                          </div>
                        )}
                      </div>
                    </div>

                  </div>

                </div>
              </div>

              {/* Footer Modal */}
              <div className="border-t border-slate-100 px-6 py-4 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1">
                  {feedbackState.message ? (
                    <p
                      className={`text-sm font-semibold ${feedbackState.isError ? "text-red-600" : "text-emerald-600"}`}
                    >
                      {feedbackState.message}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={closeAddModal}
                    className="w-full sm:w-auto rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full sm:w-auto rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60 transition cursor-pointer"
                  >
                    {isLoading ? "Menyimpan..." : "Simpan Data KTP"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
