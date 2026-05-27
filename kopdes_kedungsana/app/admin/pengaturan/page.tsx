"use client";

import { useEffect, useState } from "react";

const SETTINGS_KEY = "kopdes_settings";

export type KopdesSettings = {
  cooperativeName: string;
  address: string;
  legalNumber: string;
  principalSavingAmount: number;   // Simpanan Pokok (Rp)
  monthlyDuesAmount: number;       // Iuran Wajib per bulan (Rp)
  activeFiscalYear: number;
};

export const defaultSettings: KopdesSettings = {
  cooperativeName: "Koperasi Desa Kedungsana",
  address: "RT 01/RW 03, Kecamatan Plumbon, Kabupaten Cirebon",
  legalNumber: "AHU-0012903.AH.01.26",
  principalSavingAmount: 100_000,
  monthlyDuesAmount: 10_000,
  activeFiscalYear: new Date().getFullYear(),
};

export function loadSettings(): KopdesSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: KopdesSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

export default function PengaturanPage() {
  const [form, setForm] = useState<KopdesSettings>(defaultSettings);
  const [isSaved, setIsSaved] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setForm(loadSettings());
  }, []);

  const handleChange = (field: keyof KopdesSettings, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    setIsSaved(false);
  };

  const handleSave = () => {
    saveSettings(form);
    setIsSaved(true);
    setIsDirty(false);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleReset = () => {
    setForm(defaultSettings);
    saveSettings(defaultSettings);
    setIsDirty(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <section className="space-y-6 max-w-3xl mx-auto">

      {/* Page Header */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-primary-soft text-primary rounded-2xl flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Pengaturan Koperasi</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Konfigurasi identitas, nominal iuran, dan tahun buku aktif koperasi. Perubahan disimpan di perangkat lokal dan berlaku di seluruh modul sistem.
            </p>
          </div>
        </div>
      </div>

      {/* Saved Feedback */}
      {isSaved && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-5 py-3 flex items-center gap-3 text-sm text-emerald-700 font-semibold animate-in fade-in duration-150">
          <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Pengaturan berhasil disimpan ke localStorage!
        </div>
      )}

      {/* Section 1: Identitas Koperasi */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-800">Identitas Koperasi</h3>
          <p className="text-xs text-slate-400 mt-0.5">Digunakan pada kop surat dokumen cetak (Kwitansi, Buku Mutasi, Laporan Tahunan, Berita Acara).</p>
        </div>

        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Nama Koperasi</span>
            <input
              type="text"
              value={form.cooperativeName}
              onChange={(e) => handleChange("cooperativeName", e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition"
              placeholder="Nama lengkap koperasi..."
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Alamat Koperasi</span>
            <input
              type="text"
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition"
              placeholder="Alamat lengkap..."
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Nomor Badan Hukum</span>
            <input
              type="text"
              value={form.legalNumber}
              onChange={(e) => handleChange("legalNumber", e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition"
              placeholder="Nomor SK Badan Hukum..."
            />
          </label>
        </div>
      </div>

      {/* Section 2: Ketentuan Keuangan */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-800">Ketentuan Keuangan</h3>
          <p className="text-xs text-slate-400 mt-0.5">Nominal ini digunakan dalam kalkulasi simpanan, tunggakan, SHU, dan laporan seluruh modul.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Simpanan Pokok (Rp)</span>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-mono">Rp</span>
              <input
                type="number"
                min={0}
                step={1000}
                value={form.principalSavingAmount}
                onChange={(e) => handleChange("principalSavingAmount", Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 pl-10 pr-3 py-2 text-sm text-slate-800 font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition"
              />
            </div>
            <p className="text-[10px] text-slate-400">Saat ini: <span className="font-bold">{formatCurrency(form.principalSavingAmount)}</span> — dibayar sekali saat mendaftar.</p>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Iuran Wajib / Bulan (Rp)</span>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-mono">Rp</span>
              <input
                type="number"
                min={0}
                step={1000}
                value={form.monthlyDuesAmount}
                onChange={(e) => handleChange("monthlyDuesAmount", Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 pl-10 pr-3 py-2 text-sm text-slate-800 font-mono outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition"
              />
            </div>
            <p className="text-[10px] text-slate-400">Saat ini: <span className="font-bold">{formatCurrency(form.monthlyDuesAmount)}</span> — wajib per bulan per anggota.</p>
          </label>
        </div>
      </div>

      {/* Section 3: Tahun Buku Aktif */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-800">Tahun Buku Aktif</h3>
          <p className="text-xs text-slate-400 mt-0.5">Menentukan tahun buku default saat membuka halaman Laporan Tahunan.</p>
        </div>

        <label className="block space-y-1.5 max-w-xs">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Tahun Buku</span>
          <select
            value={form.activeFiscalYear}
            onChange={(e) => handleChange("activeFiscalYear", Number(e.target.value))}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition cursor-pointer"
          >
            {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <p className="text-[10px] text-slate-400">Halaman Laporan Tahunan akan membuka tahun ini secara otomatis.</p>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-3 pb-4">
        <button
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Reset ke Default
        </button>
        <button
          onClick={handleSave}
          disabled={!isDirty}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground px-5 py-2 text-sm font-bold shadow-sm transition cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {isDirty ? "Simpan Perubahan" : "Tersimpan"}
        </button>
      </div>

      {/* Info box about localStorage */}
      <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex gap-3 text-xs text-slate-600">
        <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <span className="font-bold text-amber-700 block">Catatan Teknis:</span>
          Pengaturan ini disimpan di <code className="bg-amber-100 px-1 rounded font-mono text-[10px]">localStorage</code> perangkat saat ini. Setelah integrasi database, pengaturan ini akan disinkronkan ke server dan berlaku untuk semua pengguna.
        </div>
      </div>

    </section>
  );
}
