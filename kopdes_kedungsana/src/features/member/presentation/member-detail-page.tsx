"use client";

import Link from "next/link";
import Image from "next/image";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
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

  return (
    <section className="space-y-4">
      <SectionCard
        title="Detail Input Anggota & Simpanan Pokok"
        description="Kelola data anggota dan validasi simpanan pokok dalam satu tempat."
        collapsible
        defaultCollapsed
      >
        <div className="grid gap-4 md:grid-cols-[160px_1fr]">
          <div>
            {member.photoUrl ? (
              <Image
                src={member.photoUrl}
                alt={`Foto ${member.name}`}
                width={160}
                height={160}
                className="h-40 w-40 rounded-2xl object-cover"
              />
            ) : (
              <div className="flex h-40 w-40 items-center justify-center rounded-2xl bg-primary-soft text-4xl font-semibold text-primary">
                {member.name.slice(0, 1).toUpperCase()}
              </div>
            )}
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
            Total akumulasi simpanan tercatat: {formatCurrency(totalRecap)}
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
    </section>
  );
}
