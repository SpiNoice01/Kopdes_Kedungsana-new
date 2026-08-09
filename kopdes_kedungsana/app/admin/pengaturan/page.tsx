"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addAuditLog } from "@/src/utils/audit-logger";
import { settingsDependencies } from "@/src/features/settings/infrastructure/settings-dependencies";
import { formatCurrency } from "@/src/utils/formatters";
import { getLastCommitDate } from "@/src/actions/get-build-info";
import { clearAuthCookie } from "@/src/actions/auth-actions";

import { loadSettingsAsync, saveSettingsAsync, defaultSettings } from "@/src/actions/settings-actions";
import type { KopdesSettings } from "@/src/features/settings/domain/settings";

export default function PengaturanPage() {
  const router = useRouter();
  const [form, setForm] = useState<KopdesSettings>(defaultSettings);
  const [originalForm, setOriginalForm] = useState<KopdesSettings>(defaultSettings);
  const [isSaved, setIsSaved] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState("Loading...");

  const handleLogout = async () => {
    addAuditLog("LOGOUT", "Admin melakukan logout secara manual dari sistem.", "info");
    await clearAuthCookie();
    router.push("/");
  };

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettingsAsync().then((data) => {
      setForm(data);
      setOriginalForm(data);
      setIsLoading(false);
    });
    getLastCommitDate().then(setLastUpdate);
  }, []);

  const handleChange = (field: keyof KopdesSettings, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
    setIsSaved(false);
  };

  const getChanges = () => {
    const changes: string[] = [];
    if (form.cooperativeName !== originalForm.cooperativeName) changes.push(`Nama Koperasi [${originalForm.cooperativeName} ➔ ${form.cooperativeName}]`);
    if (form.address !== originalForm.address) changes.push(`Alamat [${originalForm.address} ➔ ${form.address}]`);
    if (form.legalNumber !== originalForm.legalNumber) changes.push(`Badan Hukum [${originalForm.legalNumber} ➔ ${form.legalNumber}]`);
    if (form.district !== originalForm.district) changes.push(`Kabupaten/Kota [${originalForm.district} ➔ ${form.district}]`);
    if (form.printLocation !== originalForm.printLocation) changes.push(`Lokasi Cetak [${originalForm.printLocation} ➔ ${form.printLocation}]`);
    if (form.chairmanName !== originalForm.chairmanName) changes.push(`Nama Ketua [${originalForm.chairmanName} ➔ ${form.chairmanName}]`);
    if (form.secretaryName !== originalForm.secretaryName) changes.push(`Nama Sekretaris [${originalForm.secretaryName} ➔ ${form.secretaryName}]`);
    if (form.treasurerName !== originalForm.treasurerName) changes.push(`Nama Bendahara [${originalForm.treasurerName} ➔ ${form.treasurerName}]`);
    if (form.principalSavingAmount !== originalForm.principalSavingAmount) changes.push(`Simpanan Pokok [${formatCurrency(originalForm.principalSavingAmount)} ➔ ${formatCurrency(form.principalSavingAmount)}]`);
    if (form.monthlyDuesAmount !== originalForm.monthlyDuesAmount) changes.push(`Iuran Wajib [${formatCurrency(originalForm.monthlyDuesAmount)} ➔ ${formatCurrency(form.monthlyDuesAmount)}]`);
    if (form.activeFiscalYear !== originalForm.activeFiscalYear) changes.push(`Tahun Buku [${originalForm.activeFiscalYear} ➔ ${form.activeFiscalYear}]`);
    if (form.pctCadangan !== originalForm.pctCadangan) changes.push(`Cadangan [${originalForm.pctCadangan}% ➔ ${form.pctCadangan}%]`);
    if (form.pctJasaModal !== originalForm.pctJasaModal) changes.push(`Jasa Modal [${originalForm.pctJasaModal}% ➔ ${form.pctJasaModal}%]`);
    if (form.pctJasaTransaksi !== originalForm.pctJasaTransaksi) changes.push(`Jasa Transaksi [${originalForm.pctJasaTransaksi}% ➔ ${form.pctJasaTransaksi}%]`);
    if (form.pctPengurus !== originalForm.pctPengurus) changes.push(`Pengurus [${originalForm.pctPengurus}% ➔ ${form.pctPengurus}%]`);
    if (form.pctKaryawan !== originalForm.pctKaryawan) changes.push(`Karyawan [${originalForm.pctKaryawan}% ➔ ${form.pctKaryawan}%]`);
    if (form.pctPendidikan !== originalForm.pctPendidikan) changes.push(`Pendidikan [${originalForm.pctPendidikan}% ➔ ${form.pctPendidikan}%]`);
    if (form.pctSosial !== originalForm.pctSosial) changes.push(`Dana Sosial [${originalForm.pctSosial}% ➔ ${form.pctSosial}%]`);
    if (form.enableInvestasi !== originalForm.enableInvestasi) changes.push(`Fitur Investasi [${originalForm.enableInvestasi ? "Aktif" : "Nonaktif"} ➔ ${form.enableInvestasi ? "Aktif" : "Nonaktif"}]`);
    return changes;
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await saveSettingsAsync(form);
      const changes = getChanges();
      const changesMsg = changes.length > 0 ? ` (Rincian: ${changes.join(", ")})` : "";
      
      addAuditLog("UPDATE_SETTINGS", `Admin mengubah konfigurasi pengaturan koperasi ke database.${changesMsg}`, "success");
      
      setOriginalForm(form);
      setIsSaved(true);
      setIsDirty(false);
      setIsConfirmModalOpen(false);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (e) {
      alert("Gagal menyimpan ke database");
    }
    setIsLoading(false);
  };

  const handleReset = async () => {
    setIsLoading(true);
    try {
      const def = { ...defaultSettings, id: form.id };
      await saveSettingsAsync(def as any);
      addAuditLog("RESET_SETTINGS", "Admin mereset seluruh pengaturan koperasi kembali ke bawaan pabrik (default). Semua konfigurasi kembali seperti semula.", "danger");
      setForm(def as any);
      setOriginalForm(def as any);
      setIsDirty(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (e) {
      alert("Gagal reset ke database");
    }
    setIsLoading(false);
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
              Konfigurasi identitas, nominal iuran, dan tahun buku aktif koperasi. Perubahan langsung tersimpan ke database dan berlaku di seluruh modul sistem.
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
          Pengaturan berhasil disimpan ke database!
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

      {/* Section: Identitas Pelaporan & Pengurus */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-800">Identitas Pelaporan & Pengurus</h3>
          <p className="text-xs text-slate-400 mt-0.5">Digunakan pada cetak laporan (Excel SHU, Simpanan, dll) untuk tanda tangan dan lokasi.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Kabupaten/Kota (Kop Surat)</span>
            <input
              type="text"
              value={form.district}
              onChange={(e) => handleChange("district", e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition"
              placeholder="Contoh: KABUPATEN CIREBON"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Lokasi Cetak Tanggal</span>
            <input
              type="text"
              value={form.printLocation}
              onChange={(e) => handleChange("printLocation", e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition"
              placeholder="Contoh: Cirebon"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 pt-2 border-t border-slate-100">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Nama Ketua</span>
            <input
              type="text"
              value={form.chairmanName}
              onChange={(e) => handleChange("chairmanName", e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition"
              placeholder="Nama Ketua..."
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Nama Sekretaris</span>
            <input
              type="text"
              value={form.secretaryName}
              onChange={(e) => handleChange("secretaryName", e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition"
              placeholder="Nama Sekretaris..."
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Nama Bendahara</span>
            <input
              type="text"
              value={form.treasurerName}
              onChange={(e) => handleChange("treasurerName", e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition"
              placeholder="Nama Bendahara..."
            />
          </label>
        </div>
      </div>

      {/* Section 2: Tahun Buku Aktif */}
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

      {/* Section 3: Ketentuan Keuangan */}
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

      {/* Section 4: Persentase Pos Pembagian SHU */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Persentase Pos Pembagian SHU</h3>
            <p className="text-xs text-slate-400 mt-0.5">Persentase ini akan digunakan sebagai default dalam fitur Quick SHU.</p>
          </div>
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${(form.pctCadangan + form.pctJasaModal + form.pctJasaTransaksi + form.pctPengurus + form.pctKaryawan + form.pctPendidikan + form.pctSosial) === 100 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            Total: {(form.pctCadangan + form.pctJasaModal + form.pctJasaTransaksi + form.pctPengurus + form.pctKaryawan + form.pctPendidikan + form.pctSosial).toFixed(2)}%
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Cadangan Koperasi (%)</span>
            <input type="number" step="0.01" value={form.pctCadangan} onChange={(e) => handleChange("pctCadangan", Number(e.target.value))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition" />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Jasa Modal (%)</span>
            <input type="number" step="0.01" value={form.pctJasaModal} onChange={(e) => handleChange("pctJasaModal", Number(e.target.value))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition" />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Jasa Transaksi (%)</span>
            <input type="number" step="0.01" value={form.pctJasaTransaksi} onChange={(e) => handleChange("pctJasaTransaksi", Number(e.target.value))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition" />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Dana Pengurus & Manajemen (%)</span>
            <input type="number" step="0.01" value={form.pctPengurus} onChange={(e) => handleChange("pctPengurus", Number(e.target.value))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition" />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Dana Karyawan / Pegawai (%)</span>
            <input type="number" step="0.01" value={form.pctKaryawan} onChange={(e) => handleChange("pctKaryawan", Number(e.target.value))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition" />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Dana Pendidikan (%)</span>
            <input type="number" step="0.01" value={form.pctPendidikan} onChange={(e) => handleChange("pctPendidikan", Number(e.target.value))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition" />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Dana Sosial & Pembangunan (%)</span>
            <input type="number" step="0.01" value={form.pctSosial} onChange={(e) => handleChange("pctSosial", Number(e.target.value))} className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition" />
          </label>
        </div>
      </div>

      {/* Section 5: Fitur Investasi */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-800">Fitur Investasi (Modal Penyertaan Sederhana)</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Saat aktif, pengurus dapat mencatat investasi anggota di halaman detail anggota, dan nominalnya ikut menjadi basis perhitungan SHU Simpanan bersama Simpanan Pokok + Wajib.
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
          <div>
            <p className="text-sm font-semibold text-slate-700">
              {form.enableInvestasi ? "Fitur Investasi Aktif" : "Fitur Investasi Nonaktif"}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Menonaktifkan fitur ini hanya menutup formulir tambah investasi baru — data investasi yang sudah ada tidak akan dihapus dan tetap dihitung dalam SHU.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={form.enableInvestasi}
            onClick={() => {
              setForm((prev) => ({ ...prev, enableInvestasi: !prev.enableInvestasi }));
              setIsDirty(true);
              setIsSaved(false);
            }}
            className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors cursor-pointer ${
              form.enableInvestasi ? "bg-primary" : "bg-slate-300"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                form.enableInvestasi ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
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
          onClick={() => setIsConfirmModalOpen(true)}
          disabled={!isDirty}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground px-5 py-2 text-sm font-bold shadow-sm transition cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {isDirty ? "Simpan Perubahan" : "Tersimpan"}
        </button>
      </div>

      {/* Info box about Supabase */}
      <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4 flex gap-3 text-xs text-slate-600">
        <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <span className="font-bold text-blue-700 block">Sistem Terintegrasi:</span>
          Pengaturan ini disimpan di dalam Database Supabase dan tersinkronisasi secara real-time ke semua modul sistem dan pengurus.
        </div>
      </div>

      {/* Section 4: Keluar dari Sistem (Logout) */}
      <div className="rounded-3xl border border-red-200 bg-red-50/20 p-6 shadow-sm space-y-4">
        <div className="border-b border-red-200/50 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-red-800">Sesi Administrator</h3>
            <p className="text-xs text-red-600/80 mt-0.5">Keluar dari panel administrasi dan kembali ke halaman login utama.</p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 text-sm font-bold shadow-sm transition cursor-pointer border-none outline-none self-start sm:self-auto"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Keluar (Logout)
          </button>
        </div>
        <div className="text-xs text-slate-500">
          Sesi aktif saat ini: <strong className="text-slate-700">Admin Kopdes Kedungsana</strong> (admin@kopdeskedungsana.id)
        </div>
      </div>

      {/* Watermark Last Updated */}
      <div className="mt-8 pt-6 border-t border-slate-200/50 text-center flex flex-col items-center justify-center gap-1 opacity-70">
        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">
          Versi Sistem v0.1.0-alpha
        </p>
        <p className="text-[10px] text-slate-400">
          Terakhir diperbarui pada {lastUpdate}
        </p>
      </div>

      {/* Confirmation Modal */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Konfirmasi Perubahan</h3>
                <p className="text-sm text-slate-500 mt-1">Anda akan menyimpan perubahan pengaturan berikut secara permanen.</p>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto bg-slate-50/50 flex-1">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Ringkasan Perubahan:</h4>
              <ul className="space-y-2 mb-4">
                {getChanges().map((change, idx) => (
                  <li key={idx} className="text-sm text-slate-700 bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-start gap-2">
                    <svg className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span>{change}</span>
                  </li>
                ))}
              </ul>
              <div className="rounded-xl bg-amber-50 border border-amber-200/60 p-3 flex gap-2.5 text-xs text-amber-800">
                <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p>Sebagai bentuk transparansi, seluruh rincian perubahan di atas akan dicatat secara permanen di dalam <strong>Log Aktivitas (Audit Trail)</strong> dan tidak dapat dihapus.</p>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-white flex justify-end gap-3">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="px-6 py-2.5 rounded-xl font-bold bg-primary text-white hover:bg-primary/90 shadow-md transition flex items-center gap-2"
              >
                {isLoading ? "Menyimpan..." : "Ya, Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
