"use client";

import Link from "next/link";
import Image from "next/image";
import { ChangeEvent, FormEvent, useState } from "react";
import type { Member } from "../domain/member";
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
  gender: "laki-laki" | "perempuan";
  address: string;
  phone: string;
  principalProofUrl: string | null;
};

const initialKtpFormState: KtpFormState = {
  nik: "",
  name: "",
  photoUrl: null,
  birthPlace: "",
  birthDate: "",
  gender: "laki-laki",
  address: "",
  phone: "",
  principalProofUrl: null,
};
export function MemberPanel() {
  const [members, setMembers] = useState<Member[]>(() => [...memberSeed]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [ktpForm, setKtpForm] = useState<KtpFormState>(initialKtpFormState);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackState, setFeedbackState] =
    useState<FeedbackState>(initialFeedbackState);

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
    setIsAddModalOpen(true);
  };

  const closeAddModal = () => {
    setIsAddModalOpen(false);
    setIsLoading(false);
  };

  const handleSubmitKtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setFeedbackState(initialFeedbackState);

    const result =
      await memberDependencies.addMemberByKtpUseCase.execute(ktpForm);

    if (!result.success) {
      setFeedbackState({
        message: result.message,
        isError: true,
      });
      setIsLoading(false);
      return;
    }

    setMembers((previousMembers) => [result.member, ...previousMembers]);
    setFeedbackState({
      message: `Data anggota KTP ${result.member.name} berhasil ditambahkan.`,
      isError: false,
    });
    setKtpForm(initialKtpFormState);
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
            <p className="mt-3 inline-flex rounded-full bg-primary-soft px-2 py-1 text-xs font-medium text-primary">
              Status: {member.status}
            </p>
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
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary transition"
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
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary transition"
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
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary transition"
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
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary transition"
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
                              gender: event.target.value as "laki-laki" | "perempuan",
                            }))
                          }
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary transition bg-white"
                        >
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
                          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary transition"
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
                        className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-primary transition resize-none"
                      />
                    </label>
                  </div>

                  {/* Kolom Kanan: Dokumen Pendukung */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-slate-100 pb-1.5">
                      Dokumen Pendukung
                    </h4>

                    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
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

                    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
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
