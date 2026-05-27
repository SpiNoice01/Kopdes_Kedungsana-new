"use client";

import Link from "next/link";
import Image from "next/image";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { addAuditLog } from "../../../utils/audit-logger";
import { SectionCard } from "@/src/shared/widgets/section-card";
import { StatusBadge } from "@/src/shared/widgets/status-badge";
import type { Member } from "../domain/member";
import type { MemberMonthlySaving } from "../domain/member-monthly-saving";
import { memberDependencies } from "../infrastructure/member-dependencies";

type MemberDetailPageProps = {
  memberId: string;
};

type FormState = {
  period: string;
  requiredSaving: string;
  voluntarySaving: string;
};

type FeedbackState = {
  message: string;
  isError: boolean;
};

const principalSavingAmount = 100_000;

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const currentPeriod = (): string => {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
};

const parsePositiveNumber = (value: string): number => {
  if (!value.trim()) {
    return 0;
  }

  return Math.max(0, Number(value));
};

// Indonesian Terbilang Word Generation Helpers (highly valued in Indonesian academic thesis)
const toTerbilang = (n: number): string => {
  const bilangan = [
    "",
    "Satu",
    "Dua",
    "Tiga",
    "Empat",
    "Lima",
    "Enam",
    "Tujuh",
    "Delapan",
    "Sembilan",
    "Sepuluh",
    "Sebelas"
  ];
  
  if (n < 12) {
    return bilangan[n];
  } else if (n < 20) {
    return toTerbilang(n - 10) + " Belas";
  } else if (n < 100) {
    return toTerbilang(Math.floor(n / 10)) + " Puluh " + toTerbilang(n % 10);
  } else if (n < 200) {
    return "Seratus " + toTerbilang(n - 100);
  } else if (n < 1000) {
    return toTerbilang(Math.floor(n / 100)) + " Ratus " + toTerbilang(n % 100);
  } else if (n < 2000) {
    return "Seribu " + toTerbilang(n - 1000);
  } else if (n < 1000000) {
    return toTerbilang(Math.floor(n / 1000)) + " Ribu " + toTerbilang(n % 1000);
  } else if (n < 1000000000) {
    return toTerbilang(Math.floor(n / 1000000)) + " Juta " + toTerbilang(n % 1000000);
  }
  return "";
};

const getTerbilangRupiah = (amount: number): string => {
  if (amount === 0) return "Nol Rupiah";
  const result = toTerbilang(amount).trim();
  return result.charAt(0).toUpperCase() + result.slice(1) + " Rupiah";
};

export function MemberDetailPage({ memberId }: MemberDetailPageProps) {
  const [member, setMember] = useState<Member | null>(null);
  const [monthlySavings, setMonthlySavings] = useState<MemberMonthlySaving[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formState, setFormState] = useState<FormState>({
    period: currentPeriod(),
    requiredSaving: "",
    voluntarySaving: "",
  });
  const [feedbackState, setFeedbackState] = useState<FeedbackState>({
    message: "",
    isError: false,
  });
  const [principalProofUrl, setPrincipalProofUrl] = useState<string | null>(
    null,
  );
  const [principalProofName, setPrincipalProofName] = useState<string>("");
  
  // State for active document printing pratinjau (modal) and browser print template
  const [activePrintJob, setActivePrintJob] = useState<{
    type: "receipt" | "liquidation";
    data: any;
  } | null>(null);

  // State for status change confirmation dialog
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<FeedbackState>({
    message: "",
    isError: false,
  });

  const totalThisInput = useMemo(() => {
    const requiredSaving = parsePositiveNumber(formState.requiredSaving);
    const voluntarySaving = parsePositiveNumber(formState.voluntarySaving);

    return requiredSaving + voluntarySaving;
  }, [formState.requiredSaving, formState.voluntarySaving]);

  const totalRecap = useMemo(() => {
    return monthlySavings.reduce((total, item) => total + item.totalSaving, 0);
  }, [monthlySavings]);

  const arrearsInfo = useMemo(() => {
    if (!member || !member.joinDate) {
      return { monthsElapsed: 0, target: 0, paid: 0, arrears: 0 };
    }
    const monthlyTarget = 10000; // Rp 10.000 per bulan
    const joinDate = new Date(member.joinDate);
    const currentDate = new Date();
    
    const yearsDiff = currentDate.getFullYear() - joinDate.getFullYear();
    const monthsDiff = currentDate.getMonth() - joinDate.getMonth();
    const monthsElapsed = Math.max(1, (yearsDiff * 12) + monthsDiff + 1);
    
    const target = monthsElapsed * monthlyTarget;
    const paid = monthlySavings.reduce((sum, s) => sum + s.requiredSaving, 0);
    const arrears = Math.max(0, target - paid);
    
    return {
      monthsElapsed,
      target,
      paid,
      arrears
    };
  }, [member, monthlySavings]);

  useEffect(() => {
    return () => {
      if (principalProofUrl) {
        URL.revokeObjectURL(principalProofUrl);
      }
    };
  }, [principalProofUrl]);

  useEffect(() => {
    const loadMemberDetail = async () => {
      const memberResult =
        await memberDependencies.getMemberByIdUseCase.execute(memberId);
      const savingsResult =
        await memberDependencies.getMemberMonthlySavingsUseCase.execute(
          memberId,
        );

      setMember(memberResult);
      setMonthlySavings(savingsResult);
      setIsLoading(false);
    };

    void loadMemberDetail();
  }, [memberId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setFeedbackState({ message: "", isError: false });

    const requiredSaving = parsePositiveNumber(formState.requiredSaving);
    const voluntarySaving = parsePositiveNumber(formState.voluntarySaving);

    const result =
      await memberDependencies.addMemberMonthlySavingUseCase.execute({
        memberId,
        period: formState.period,
        requiredSaving,
        voluntarySaving,
      });

    if (!result.success) {
      setFeedbackState({ message: result.message, isError: true });
      setIsSaving(false);
      return;
    }

    const latestSavings =
      await memberDependencies.getMemberMonthlySavingsUseCase.execute(memberId);

    setMonthlySavings(latestSavings);
    setFormState((previous) => ({
      ...previous,
      requiredSaving: "",
      voluntarySaving: "",
    }));
    setFeedbackState({
      message: `Simpanan periode ${result.saving.period} berhasil disimpan.`,
      isError: false,
    });
    setIsSaving(false);
  };

  const handlePrincipalProofChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (principalProofUrl) {
      URL.revokeObjectURL(principalProofUrl);
    }

    const nextUrl = URL.createObjectURL(file);
    setPrincipalProofUrl(nextUrl);
    setPrincipalProofName(file.name);
  };

  const handleProfilePhotoChange = async (event: ChangeEvent<HTMLInputElement>) => {
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
      setFeedbackState({
        message: "Ukuran foto profil maksimal 2MB.",
        isError: true,
      });
      return;
    }

    const fileReader = new FileReader();
    fileReader.onload = async () => {
      const photoUrl = typeof fileReader.result === "string" ? fileReader.result : null;
      if (!photoUrl) return;

      const result = await memberDependencies.updateMemberPhotoUseCase.execute(memberId, photoUrl);
      if (result.success) {
        setMember((prev) => prev ? { ...prev, photoUrl } : null);
        addAuditLog(
          "MEMBER_EDIT",
          `Berhasil memperbarui foto profil untuk anggota [${member?.name || "Anggota"}] dengan ID ${memberId}.`,
          "success"
        );
        setFeedbackState({
          message: "Foto profil berhasil diperbarui!",
          isError: false,
        });
      } else {
        setFeedbackState({
          message: result.message,
          isError: true,
        });
      }
    };
    fileReader.readAsDataURL(file);
  };

  // Handler: toggle member aktif <-> nonaktif with audit log
  const handleStatusToggle = async () => {
    if (!member) return;
    setIsUpdatingStatus(true);
    const nextStatus = member.status === "aktif" ? "nonaktif" : "aktif";
    const result = await memberDependencies.updateMemberStatusUseCase.execute(
      memberId,
      nextStatus,
    );

    if (result.success) {
      setMember((prev) => prev ? { ...prev, status: nextStatus } : null);
      addAuditLog(
        "MEMBER_EDIT",
        result.message,
        nextStatus === "nonaktif" ? "warning" : "success",
      );
      setStatusFeedback({ message: result.message, isError: false });
    } else {
      setStatusFeedback({ message: result.message, isError: true });
    }

    setShowStatusConfirm(false);
    setIsUpdatingStatus(false);
  };

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-sm text-slate-500">Memuat detail anggota...</p>
      </section>
    );
  }

  if (!member) {
    return (
      <section className="space-y-4">
        <SectionCard
          title="Detail Input Anggota"
          description="Data anggota tidak ditemukan."
        >
          <div />
        </SectionCard>

        <Link
          href="/admin/input-data"
          className="inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Kembali ke Panel Anggota
        </Link>
      </section>
    );
  }

  // Calculated values for liquidation simulations
  const totalWajib = monthlySavings.reduce((sum, s) => sum + s.requiredSaving, 0);
  const totalSukarela = monthlySavings.reduce((sum, s) => sum + s.voluntarySaving, 0);
  const totalRefundable = principalSavingAmount + totalWajib + totalSukarela;
  const netRefundAmount = Math.max(0, totalRefundable - arrearsInfo.arrears);

  return (
    <>
      {/* Standard Interactive Page Layout - hidden when actual browser printing occurs */}
      <div className="space-y-6 print:hidden">
        <SectionCard
          title="Detail Input Anggota & Simpanan Pokok"
          description="Kelola data anggota dan validasi simpanan pokok dalam satu tempat."
          collapsible
          defaultCollapsed
        >
          <div className="grid gap-6 md:grid-cols-[176px_1fr] items-start">
            <div className="flex flex-col items-center gap-3">
              <div className="relative w-40 sm:w-44 aspect-[3/4] bg-slate-100 rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                {member.photoUrl ? (
                  <Image
                    src={member.photoUrl}
                    alt={`Foto ${member.name}`}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-primary-soft text-4xl font-semibold text-primary font-mono uppercase">
                    {member.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              
              <label className="cursor-pointer relative mt-1 select-none">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleProfilePhotoChange}
                  className="hidden"
                />
                <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition cursor-pointer">
                  <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {member.photoUrl ? "Ganti Foto" : "Unggah Foto"}
                </span>
              </label>
            </div>

            <div className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
              <div>
                <p className="text-slate-500">Nama</p>
                <p className="font-medium">{member.name}</p>
              </div>
              <div>
                <p className="text-slate-500">NIK</p>
                <p className="font-medium">{member.nik}</p>
              </div>
              <div>
                <p className="text-slate-500">No. HP</p>
                <p className="font-medium">{member.phone}</p>
              </div>
              <div>
                <p className="text-slate-500">Tanggal Bergabung</p>
                <p className="font-medium">{member.joinDate}</p>
              </div>
              <div>
                <p className="text-slate-500">Golongan Darah</p>
                <p className="font-medium">{member.bloodType || "-"}</p>
              </div>
              <div>
                <p className="text-slate-500">Agama</p>
                <p className="font-medium">{member.religion || "-"}</p>
              </div>
              <div>
                <p className="text-slate-500">Status Perkawinan</p>
                <p className="font-medium">{member.maritalStatus || "-"}</p>
              </div>
              <div>
                <p className="text-slate-500">Pekerjaan</p>
                <p className="font-medium">{member.occupation || "-"}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-slate-500">Alamat</p>
                <p className="font-medium">{member.address}</p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="mb-2 text-base font-semibold text-primary">
              Simpanan Pokok
            </h3>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge
                  label={principalProofUrl ? "SUDAH VALIDASI" : "BELUM VALIDASI"}
                  tone={principalProofUrl ? "success" : "muted"}
                />
                <p className="text-sm text-slate-600">
                  Nominal simpanan pokok ditetapkan:{" "}
                  {formatCurrency(principalSavingAmount)}
                </p>
              </div>

              <label className="block space-y-2 text-sm">
                <span className="font-medium text-slate-700">
                  Bukti Validasi Simpanan Pokok (Gambar)
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handlePrincipalProofChange}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary-foreground"
                />
                <p className="text-xs text-slate-500">
                  Format: JPG/PNG/WEBP, maksimal 2MB.
                </p>
              </label>

              {principalProofUrl ? (
                <div className="rounded-xl border border-slate-200 p-3">
                  <p className="mb-2 text-xs text-slate-500">
                    Preview bukti: {principalProofName}
                  </p>
                  <Image
                    src={principalProofUrl}
                    alt="Bukti validasi simpanan pokok"
                    width={160}
                    height={160}
                    className="h-40 w-40 rounded-xl object-cover"
                    unoptimized
                  />
                </div>
              ) : null}
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Input Simpanan Bulanan"
          description="Isi transaksi simpanan bulanan per anggota."
          collapsible
          defaultCollapsed
        >
          <div className="mb-5">
            {arrearsInfo.arrears > 0 ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-100 text-red-600 rounded-xl mt-0.5">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-red-800">Terdapat Tunggakan Simpanan Wajib</h4>
                    <p className="text-xs text-red-600 mt-0.5 leading-relaxed">
                      Anggota terdaftar sejak <strong>{member.joinDate}</strong> ({arrearsInfo.monthsElapsed} bulan). <br/>
                      Target akumulasi simpanan wajib: <strong>{formatCurrency(arrearsInfo.target)}</strong> | Sudah dibayar: <strong>{formatCurrency(arrearsInfo.paid)}</strong>
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right bg-red-100/50 rounded-xl px-4 py-2 border border-red-100 flex-shrink-0">
                  <span className="text-[10px] font-bold text-red-500 block uppercase">Total Tunggakan</span>
                  <span className="text-lg font-extrabold text-red-700">{formatCurrency(arrearsInfo.arrears)}</span>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl mt-0.5">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-800">Simpanan Wajib Lunas</h4>
                    <p className="text-xs text-emerald-600 mt-0.5 leading-relaxed">
                      Status iuran simpanan wajib anggota ini aman dan lunas. Seluruh kewajiban pembayaran bulanan hingga bulan ini telah diselesaikan.
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right bg-emerald-100/50 rounded-xl px-4 py-2 border border-emerald-100 flex-shrink-0">
                  <span className="text-[10px] font-bold text-emerald-500 block uppercase">Total Tunggakan</span>
                  <span className="text-lg font-extrabold text-emerald-700">Rp 0</span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Periode</span>
              <input
                type="month"
                value={formState.period}
                onChange={(event) =>
                  setFormState((previous) => ({
                    ...previous,
                    period: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-primary"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Simpanan Wajib</span>
              <input
                type="number"
                min={0}
                value={formState.requiredSaving}
                onChange={(event) =>
                  setFormState((previous) => ({
                    ...previous,
                    requiredSaving: event.target.value,
                  }))
                }
                placeholder="Contoh: 50000"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-primary"
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">
                Simpanan Sukarela
              </span>
              <input
                type="number"
                min={0}
                value={formState.voluntarySaving}
                onChange={(event) =>
                  setFormState((previous) => ({
                    ...previous,
                    voluntarySaving: event.target.value,
                  }))
                }
                placeholder="Contoh: 10000"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-primary"
              />
            </label>

            <div className="space-y-2 rounded-xl border border-primary/20 bg-primary-soft p-3 text-sm">
              <p className="font-medium text-primary">Total Bulan Ini</p>
              <p className="text-lg font-semibold text-primary">
                {formatCurrency(totalThisInput)}
              </p>
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {isSaving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>

            {feedbackState.message ? (
              <p
                className={`md:col-span-2 text-sm ${feedbackState.isError ? "text-red-600" : "text-primary"}`}
              >
                {feedbackState.message}
              </p>
            ) : null}
          </form>
        </SectionCard>

        <SectionCard
          title="Riwayat Simpanan Bulanan"
          description="Sumber data untuk kalkulasi di halaman Quick SHU."
        >
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Total akumulasi simpanan bulanan: {formatCurrency(totalRecap)}
            </p>

            {monthlySavings.length ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-slate-600">
                    <tr>
                      <th className="px-3 py-2 font-medium">Periode</th>
                      <th className="px-3 py-2 font-medium">Wajib</th>
                      <th className="px-3 py-2 font-medium">Sukarela</th>
                      <th className="px-3 py-2 font-medium">Total</th>
                      <th className="px-3 py-2 font-medium">Tanggal Input</th>
                      <th className="px-3 py-2 font-medium text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                    {monthlySavings.map((saving) => (
                      <tr key={saving.id}>
                        <td className="px-3 py-2">{saving.period}</td>
                        <td className="px-3 py-2">
                          {formatCurrency(saving.requiredSaving)}
                        </td>
                        <td className="px-3 py-2">
                          {formatCurrency(saving.voluntarySaving)}
                        </td>
                        <td className="px-3 py-2 font-semibold text-primary">
                          {formatCurrency(saving.totalSaving)}
                        </td>
                        <td className="px-3 py-2">{saving.inputDate}</td>
                        <td className="px-3 py-2 text-right">
                          <button
                            onClick={() => setActivePrintJob({ type: "receipt", data: saving })}
                            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:opacity-80 transition bg-primary-soft px-2.5 py-1 rounded-xl cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            <span>Cetak Kwitansi</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Belum ada riwayat simpanan bulanan untuk anggota ini.
              </p>
            )}
          </div>
        </SectionCard>

        {/* Dynamic Exit Liquidation Simulation Calculator Section (Great for Thesis and Real Audits) */}
        <SectionCard
          title="Simulasi Penutupan Keanggotaan (Likuidasi Anggota Keluar)"
          description="Kalkulator audit pengembalian simpanan anggota jika keluar dari kepengurusan koperasi."
          collapsible
          defaultCollapsed
        >
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
              <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <span className="font-bold text-amber-800">Regulasi UU Koperasi:</span> Berdasarkan AD/ART Koperasi Desa Kedungsana, anggota yang mengundurkan diri berhak atas pengembalian penuh atas akumulasi simpanan pokok dan wajib miliknya setelah disesuaikan dengan status tunggakan iuran bulanan.
              </div>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
              <div className="p-4 bg-slate-100 border-b border-slate-200 flex justify-between items-center">
                <h4 className="text-sm font-bold text-slate-800">Kalkulator Pengembalian Hak Dana</h4>
                <span className="text-[10px] uppercase font-mono font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded">Simulasi</span>
              </div>
              
              <div className="p-4 space-y-3 text-sm">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-600">1. Simpanan Pokok (Mutlak Dikembalikan)</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(principalSavingAmount)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-600">2. Akumulasi Simpanan Wajib Terkumpul</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(totalWajib)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-600">3. Akumulasi Simpanan Sukarela Terkumpul</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(totalSukarela)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-800 border-b border-slate-200 pb-2 text-base">
                  <span>Subtotal Hak Simpanan</span>
                  <span>{formatCurrency(totalRefundable)}</span>
                </div>

                <div className="flex justify-between text-red-600 border-b border-slate-100 pb-2 text-xs">
                  <span>4. Potongan / Tunggakan Iuran Wajib</span>
                  <span className="font-semibold">-{formatCurrency(arrearsInfo.arrears)}</span>
                </div>

                <div className="flex justify-between font-extrabold text-primary pt-2 text-lg">
                  <span>TOTAL PENGEMBALIAN BERSIH</span>
                  <span>{formatCurrency(netRefundAmount)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setActivePrintJob({
                  type: "liquidation",
                  data: {
                    totalWajib,
                    totalSukarela,
                    totalPokok: principalSavingAmount,
                    totalRecap,
                    arrears: arrearsInfo.arrears,
                    netRefund: netRefundAmount
                  }
                })}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 text-xs font-semibold shadow-sm transition cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Cetak Berita Acara Keluar</span>
              </button>
            </div>
          </div>
        </SectionCard>

        {/* Status Management Action Card */}
        <div className={`rounded-3xl border p-5 shadow-sm ${
          member.status === "aktif"
            ? "bg-red-50 border-red-200"
            : "bg-emerald-50 border-emerald-200"
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-2xl flex-shrink-0 ${
                member.status === "aktif"
                  ? "bg-red-100 text-red-600"
                  : "bg-emerald-100 text-emerald-600"
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {member.status === "aktif" ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  )}
                </svg>
              </div>
              <div>
                <h4 className={`text-sm font-bold ${
                  member.status === "aktif" ? "text-red-800" : "text-emerald-800"
                }`}>
                  {member.status === "aktif"
                    ? "Nonaktifkan Keanggotaan"
                    : "Aktifkan Kembali Keanggotaan"}
                </h4>
                <p className={`text-xs mt-0.5 leading-relaxed ${
                  member.status === "aktif" ? "text-red-600" : "text-emerald-600"
                }`}>
                  {member.status === "aktif"
                    ? "Menonaktifkan anggota akan mengubah status mereka menjadi Nonaktif. Data simpanan tetap tersimpan dan laporan likuidasi dapat dicetak."
                    : "Mengaktifkan kembali anggota ini akan mengembalikan status mereka menjadi Aktif dan diikutsertakan dalam kalkulasi SHU dan iuran wajib."}
                </p>
                {statusFeedback.message && (
                  <p className={`text-xs mt-1.5 font-semibold ${
                    statusFeedback.isError ? "text-red-700" : member.status === "aktif" ? "text-emerald-700" : "text-red-700"
                  }`}>{statusFeedback.message}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowStatusConfirm(true)}
              className={`flex-shrink-0 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm transition cursor-pointer ${
                member.status === "aktif"
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {member.status === "aktif" ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                )}
              </svg>
              {member.status === "aktif" ? "Nonaktifkan Anggota" : "Aktifkan Kembali"}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/input-data"
            className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Kembali ke Panel Anggota
          </Link>

          <Link
            href="/admin/quick-shu"
            className="inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Lanjut ke Quick SHU
          </Link>
        </div>
      </div>

      {/* ⚠️ STATUS CHANGE CONFIRMATION DIALOG */}
      {showStatusConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className={`p-5 flex items-center gap-3 ${
              member.status === "aktif" ? "bg-red-600" : "bg-emerald-600"
            }`}>
              <svg className="w-5 h-5 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="font-bold text-base text-white">
                {member.status === "aktif" ? "Konfirmasi Penonaktifan Anggota" : "Konfirmasi Pengaktifan Kembali"}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600 leading-relaxed">
                Apakah Anda yakin ingin{" "}
                <strong className={member.status === "aktif" ? "text-red-600" : "text-emerald-600"}>
                  {member.status === "aktif" ? "menonaktifkan" : "mengaktifkan kembali"}
                </strong>{" "}
                keanggotaan atas nama:
              </p>
              <div className="bg-slate-50 rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary-soft flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{member.name}</p>
                  <p className="text-xs text-slate-500">NIK: {member.nik}</p>
                </div>
              </div>
              {member.status === "aktif" && (
                <p className="text-xs text-slate-500 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                  💡 <strong>Catatan:</strong> Setelah dinonaktifkan, anggota tidak akan diikutsertakan dalam kalkulasi total anggota aktif di halaman Overview dan Quick SHU. Data simpanan tetap tersimpan.
                </p>
              )}
            </div>
            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-2 border-t border-slate-100">
              <button
                onClick={() => setShowStatusConfirm(false)}
                disabled={isUpdatingStatus}
                className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-100 text-sm font-semibold text-slate-700 transition cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleStatusToggle}
                disabled={isUpdatingStatus}
                className={`px-4 py-2 rounded-xl text-sm font-bold text-white transition cursor-pointer disabled:opacity-50 ${
                  member.status === "aktif"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {isUpdatingStatus
                  ? "Memproses..."
                  : member.status === "aktif"
                  ? "Ya, Nonaktifkan"
                  : "Ya, Aktifkan Kembali"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🖨️ NATIVE PRINT-ONLY CONTAINER (Zero layout shift, hides all other DOM elements on window.print()) */}
      {activePrintJob && (
        <div className="hidden print:block print:fixed print:inset-0 print:bg-white print:p-12 print:z-[99999] text-slate-800 text-sm font-sans">
          {activePrintJob.type === "receipt" ? (
            /* Kwitansi Print Layout */
            <div className="max-w-2xl mx-auto border-2 border-slate-300 p-8 space-y-6 font-mono text-xs">
              <div className="text-center border-b-2 border-slate-300 pb-4">
                <h2 className="font-bold text-base uppercase text-slate-905">KOPERASI DESA KEDUNGSANA</h2>
                <p className="text-[10px] text-slate-500 mt-0.5">Kopdes Kedungsana RT 01/RW 03, Kec. Plumbon, Cirebon</p>
                <h3 className="text-sm font-bold text-slate-800 mt-4 tracking-wider">BUKTI KWITANSI SETORAN SIMPANAN</h3>
                <p className="text-[10px] text-slate-400 font-mono mt-1">No. KOPDES/REC/{activePrintJob.data.period.replace("-", "")}/{member.id.toUpperCase()}</p>
              </div>
              
              <div className="space-y-3 text-xs">
                <div className="flex"><span className="w-36 text-slate-500">Telah Diterima Dari</span><span className="mr-2">:</span><span className="font-bold text-slate-950">{member.name}</span></div>
                <div className="flex"><span className="w-36 text-slate-500">Nomor NIK</span><span className="mr-2">:</span><span className="font-bold text-slate-950">{member.nik}</span></div>
                <div className="flex"><span className="w-36 text-slate-500">Jumlah Setoran</span><span className="mr-2">:</span><span className="font-bold text-slate-950">{formatCurrency(activePrintJob.data.totalSaving)}</span></div>
                <div className="flex"><span className="w-36 text-slate-500">Terbilang</span><span className="mr-2">:</span><span className="font-bold text-slate-950 italic">"{getTerbilangRupiah(activePrintJob.data.totalSaving)}"</span></div>
                <div className="flex"><span className="w-36 text-slate-500">Untuk Pembayaran</span><span className="mr-2">:</span><span>Simpanan Wajib ({formatCurrency(activePrintJob.data.requiredSaving)}) & Simpanan Sukarela ({formatCurrency(activePrintJob.data.voluntarySaving)}) periode {activePrintJob.data.period}</span></div>
              </div>

              <div className="flex justify-between pt-12 border-t border-slate-300">
                <div className="text-center w-1/2">
                  <p className="text-slate-500">Tanda Tangan Penyetor</p>
                  <div className="h-20"></div>
                  <p className="font-bold text-slate-950 border-t border-slate-400 pt-1 inline-block min-w-[120px]">{member.name}</p>
                </div>
                <div className="text-center w-1/2">
                  <p className="text-slate-500">Penerima Kas Koperasi</p>
                  <div className="h-20"></div>
                  <p className="font-bold text-slate-950 border-t border-slate-400 pt-1 inline-block min-w-[120px]">Admin Kedungsana</p>
                </div>
              </div>
            </div>
          ) : (
            /* Liquidation Print Layout */
            <div className="max-w-2xl mx-auto border-4 border-double border-slate-400 p-10 space-y-6 font-serif text-xs">
              <div className="text-center border-b-4 border-double border-slate-400 pb-4">
                <h2 className="font-bold text-lg uppercase text-slate-900">KOPERASI DESA (KOPDES) KEDUNGSANA</h2>
                <p className="text-[10px] text-slate-500 mt-0.5">Badan Hukum No: AHU-0012903.AH.01.26 | RT 01/RW 03 Cirebon</p>
                <h3 className="text-sm font-bold text-slate-800 mt-6 tracking-widest uppercase">BERITA ACARA PENGUNDURAN DIRI & LIKUIDASI DANA ANGGOTA</h3>
                <p className="text-[10px] text-slate-400 font-mono mt-1">No. BA/KELUAR/{new Date().getFullYear()}/{member.id.toUpperCase()}</p>
              </div>

              <p className="leading-relaxed">
                Pada hari ini, dengan penuh kesadaran dan tanpa paksaan dari pihak manapun, disetujui pengunduran diri dan penonaktifan keanggotaan koperasi atas nama:
              </p>

              <div className="space-y-2 pl-6 text-xs">
                <div className="flex"><span className="w-36 text-slate-500">Nama Lengkap</span><span className="mr-2">:</span><span className="font-bold text-slate-900">{member.name}</span></div>
                <div className="flex"><span className="w-36 text-slate-500">Nomor NIK</span><span className="mr-2">:</span><span className="font-bold text-slate-900">{member.nik}</span></div>
                <div className="flex"><span className="w-36 text-slate-500">Alamat Rumah</span><span className="mr-2">:</span><span className="font-bold text-slate-900">{member.address}</span></div>
                <div className="flex"><span className="w-36 text-slate-500">Tanggal Bergabung</span><span className="mr-2">:</span><span>{member.joinDate}</span></div>
              </div>

              <p className="leading-relaxed">
                Sesuai dengan ketentuan Anggaran Dasar dan Anggaran Rumah Tangga (AD/ART) Koperasi Kedungsana, telah dilakukan audit dan perhitungan atas seluruh hak simpanan anggota dengan hasil rincian sebagai berikut:
              </p>

              <div className="border-2 border-slate-400 p-4 bg-slate-50 font-mono text-[11px] space-y-2">
                <div className="flex justify-between"><span>1. Saldo Pengembalian Simpanan Pokok</span><span>{formatCurrency(principalSavingAmount)}</span></div>
                <div className="flex justify-between"><span>2. Saldo Pengembalian Simpanan Wajib</span><span>{formatCurrency(activePrintJob.data.totalWajib)}</span></div>
                <div className="flex justify-between"><span>3. Saldo Pengembalian Simpanan Sukarela</span><span>{formatCurrency(activePrintJob.data.totalSukarela)}</span></div>
                <div className="flex justify-between font-bold border-t-2 border-slate-400 pt-1 text-slate-900 text-xs"><span>Subtotal Hak Keuangan Simpanan</span><span>{formatCurrency(activePrintJob.data.totalPokok + activePrintJob.data.totalRecap)}</span></div>
                <div className="flex justify-between text-red-705"><span>4. Potongan / Tunggakan Simpanan Wajib</span><span>-{formatCurrency(activePrintJob.data.arrears)}</span></div>
                <div className="flex justify-between font-extrabold border-t-2 border-double border-slate-900 pt-1.5 text-sm text-slate-950"><span>TOTAL BERSIH HAK PENGEMBALIAN</span><span>{formatCurrency(activePrintJob.data.netRefund)}</span></div>
              </div>

              <p className="italic text-xs text-slate-600 leading-relaxed pl-2">
                Terbilang: "{getTerbilangRupiah(activePrintJob.data.netRefund)}"
              </p>

              <p className="leading-relaxed">
                Seluruh hak dana simpanan bersih di atas telah diserah-terimakan secara tunai dan lunas. Dengan ditandatanganinya berita acara ini, maka status keanggotaan yang bersangkutan dinyatakan berakhir dan dibebaskan dari segala hak dan kewajiban koperasi.
              </p>

              <div className="flex justify-between pt-10 text-center text-xs">
                <div className="w-1/3">
                  <p className="text-slate-500">Anggota Yang Keluar</p>
                  <div className="h-16"></div>
                  <p className="font-bold text-slate-900 border-t border-slate-400 pt-1 inline-block min-w-[90px]">{member.name}</p>
                </div>
                <div className="w-1/3">
                  <p className="text-slate-500">Bendahara Koperasi</p>
                  <div className="h-16"></div>
                  <p className="font-bold text-slate-900 border-t border-slate-400 pt-1 inline-block min-w-[90px]">Bendahara</p>
                </div>
                <div className="w-1/3">
                  <p className="text-slate-500">Ketua Koperasi</p>
                  <div className="h-16"></div>
                  <p className="font-bold text-slate-900 border-t border-slate-400 pt-1 inline-block min-w-[90px]">Ketua Koperasi</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 🖥️ DIALOG PREVIEW OVERLAY (Modern glassmorphic modal preview) */}
      {activePrintJob && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="bg-primary text-primary-foreground p-5 flex items-center justify-between">
              <h3 className="font-bold text-base">Pratinjau Dokumen Cetak</h3>
              <button
                onClick={() => setActivePrintJob(null)}
                className="text-white/80 hover:text-white text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {activePrintJob.type === "receipt" ? (
                /* Receipt Preview Panel */
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 bg-slate-50/50 font-mono text-xs text-slate-700 space-y-4">
                  <div className="text-center border-b border-slate-200 pb-3">
                    <h4 className="font-bold text-sm uppercase text-slate-800">KOPERASI DESA KEDUNGSANA</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Kopdes Kedungsana RT 01/RW 03, Cirebon</p>
                    <p className="text-xs font-bold text-primary mt-2">KWITANSI SETORAN SIMPANAN</p>
                    <p className="text-[10px] text-slate-400">No. KOPDES/REC/{activePrintJob.data.period.replace("-", "")}/{member.id.toUpperCase()}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex"><span className="w-28 text-slate-400">Telah Diterima Dari</span><span className="mr-2">:</span><span className="font-bold text-slate-800">{member.name} ({member.nik})</span></div>
                    <div className="flex"><span className="w-28 text-slate-400">Jumlah Uang</span><span className="mr-2">:</span><span className="font-bold text-slate-800">{formatCurrency(activePrintJob.data.totalSaving)}</span></div>
                    <div className="flex"><span className="w-28 text-slate-400">Terbilang</span><span className="mr-2">:</span><span className="font-bold text-slate-800 italic">"{getTerbilangRupiah(activePrintJob.data.totalSaving)}"</span></div>
                    <div className="flex"><span className="w-28 text-slate-400">Untuk Pembayaran</span><span className="mr-2">:</span><span>Setoran Simpanan Wajib ({formatCurrency(activePrintJob.data.requiredSaving)}) & Sukarela ({formatCurrency(activePrintJob.data.voluntarySaving)}) periode {activePrintJob.data.period}</span></div>
                  </div>

                  <div className="flex justify-between pt-6 border-t border-slate-100">
                    <div className="text-center w-1/2">
                      <p className="text-slate-400">Penyetor</p>
                      <div className="h-16"></div>
                      <p className="font-bold text-slate-800 border-t border-slate-200 pt-1 inline-block min-w-[100px]">{member.name}</p>
                    </div>
                    <div className="text-center w-1/2">
                      <p className="text-slate-400">Penerima (Admin)</p>
                      <div className="h-16"></div>
                      <p className="font-bold text-slate-800 border-t border-slate-200 pt-1 inline-block min-w-[100px]">Admin Kedungsana</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Liquidation Preview Panel */
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 bg-slate-50/50 font-serif text-xs text-slate-700 space-y-4">
                  <div className="text-center border-b-2 border-double border-slate-400 pb-3">
                    <h4 className="font-bold text-sm uppercase text-slate-800">KOPERASI DESA (KOPDES) KEDUNGSANA</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Badan Hukum No: AHU-0012903.AH.01.26 | RT 01/RW 03 Cirebon</p>
                    <p className="text-xs font-bold text-slate-800 mt-3 uppercase tracking-wider">BERITA ACARA PENGUNDURAN DIRI & LIKUIDASI DANA ANGGOTA</p>
                    <p className="text-[10px] text-slate-400 font-mono">No. BA/KELUAR/{new Date().getFullYear()}/{member.id.toUpperCase()}</p>
                  </div>
                  
                  <p className="leading-relaxed">
                    Pada hari ini, disetujui pengunduran diri dan penonaktifan keanggotaan koperasi atas nama:
                  </p>

                  <div className="space-y-1.5 pl-4">
                    <div className="flex"><span className="w-28 text-slate-500">Nama Anggota</span><span className="mr-2">:</span><span className="font-bold">{member.name}</span></div>
                    <div className="flex"><span className="w-28 text-slate-500">Nomor NIK</span><span className="mr-2">:</span><span className="font-bold">{member.nik}</span></div>
                    <div className="flex"><span className="w-28 text-slate-500">Tanggal Bergabung</span><span className="mr-2">:</span><span>{member.joinDate}</span></div>
                  </div>

                  <p className="leading-relaxed">
                    Sesuai dengan AD/ART Koperasi Kedungsana, telah dihitung hak pengembalian dana simpanan dengan rincian sebagai berikut:
                  </p>

                  <div className="border border-slate-300 rounded-lg p-3 bg-white font-mono text-[11px] space-y-1.5">
                    <div className="flex justify-between"><span>1. Pengembalian Simpanan Pokok</span><span>{formatCurrency(principalSavingAmount)}</span></div>
                    <div className="flex justify-between"><span>2. Pengembalian Simpanan Wajib</span><span>{formatCurrency(activePrintJob.data.totalWajib)}</span></div>
                    <div className="flex justify-between"><span>3. Pengembalian Simpanan Sukarela</span><span>{formatCurrency(activePrintJob.data.totalSukarela)}</span></div>
                    <div className="flex justify-between font-bold border-t border-slate-200 pt-1 text-slate-800"><span>Subtotal Hak Simpanan</span><span>{formatCurrency(activePrintJob.data.totalPokok + activePrintJob.data.totalRecap)}</span></div>
                    <div className="flex justify-between text-red-600"><span>4. Potongan Tunggakan Iuran</span><span>-{formatCurrency(activePrintJob.data.arrears)}</span></div>
                    <div className="flex justify-between font-extrabold border-t border-slate-300 pt-1 text-sm text-primary"><span>TOTAL DANA BERSIH DITERIMA</span><span>{formatCurrency(activePrintJob.data.netRefund)}</span></div>
                  </div>

                  <p className="text-[11px] italic leading-relaxed text-slate-505">
                    Terbilang: "{getTerbilangRupiah(activePrintJob.data.netRefund)}"
                  </p>

                  <p className="leading-relaxed">
                    Demikian berita acara ini dibuat untuk dipergunakan sebagai bukti serah terima hak keuangan yang sah.
                  </p>

                  <div className="flex justify-between pt-6 border-t border-slate-200 text-center">
                    <div className="w-1/3">
                      <p className="text-slate-400">Anggota Keluar</p>
                      <div className="h-14"></div>
                      <p className="font-bold text-slate-800 border-t border-slate-300 pt-1 inline-block min-w-[80px]">{member.name}</p>
                    </div>
                    <div className="w-1/3">
                      <p className="text-slate-400">Bendahara Kopdes</p>
                      <div className="h-14"></div>
                      <p className="font-bold text-slate-800 border-t border-slate-300 pt-1 inline-block min-w-[80px]">Bendahara</p>
                    </div>
                    <div className="w-1/3">
                      <p className="text-slate-400">Ketua Kopdes</p>
                      <div className="h-14"></div>
                      <p className="font-bold text-slate-800 border-t border-slate-300 pt-1 inline-block min-w-[80px]">Ketua Koperasi</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-2 border-t border-slate-100 flex-shrink-0">
              <button
                onClick={() => setActivePrintJob(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-100 text-xs sm:text-sm font-semibold text-slate-700 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (activePrintJob.type === "receipt") {
                    addAuditLog("RECEIPT_PRINT", `Mencetak Kwitansi Setoran Simpanan: ${member.name} periode ${activePrintJob.data.period}`, "success");
                  } else {
                    addAuditLog("MUTASI_PERSONAL", `Mencetak dokumen Berita Acara Keluar Anggota: ${member.name}`, "success");
                  }
                  window.print();
                }}
                className="px-4 py-2 bg-primary hover:opacity-90 text-primary-foreground rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Cetak Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
