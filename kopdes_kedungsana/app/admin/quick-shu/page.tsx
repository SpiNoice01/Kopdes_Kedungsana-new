"use client";

import { useMemo, useState } from "react";
import ExcelJS from "exceljs";
import { addAuditLog } from "../../../src/utils/audit-logger";
import { buildSimpananSheet, buildShuSheet, downloadExcelBuffer } from "@/src/features/admin/utils/excel-exporter";
import { calculateShuPools, calculateShuRate, distributeMemberShu, totalShuBasis } from "@/src/features/admin/utils/shu-calculator";
import { loadFiscalYearNetShu, loadMemberShuBasisRows, type MemberShuBasisRow } from "@/src/features/admin/utils/shu-basis-loader";
import { shuDependencies } from "@/src/features/shu/infrastructure/shu-dependencies";

type HintProps = {
  text: string;
};

function Hint({ text }: HintProps) {
  return (
    <span className="group relative inline-flex items-center">
      <button
        type="button"
        aria-label="Lihat penjelasan"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-[11px] font-semibold leading-none text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        i
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-64 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 opacity-0 shadow-sm transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}

const formatShuRate = (rate: number) =>
  `${(rate * 100).toLocaleString("id-ID", { maximumFractionDigits: 4 })}%`;

import { useEffect } from "react";
import { supabase } from "@/src/utils/supabase-client";
import { notifySessionExpired } from "@/src/features/admin/presentation/session-expired-modal";
import { loadSettingsAsync, defaultSettings } from "@/src/actions/settings-actions";
import type { KopdesSettings } from "@/src/features/settings/domain/settings";

export default function QuickShuPage() {
  const [activeTab, setActiveTab] = useState<"shu" | "simpanan">("shu");
  const [sortKey, setSortKey] = useState<keyof MemberShuBasisRow | "totalSaving" | "savingShu" | "serviceShu" | "totalShu">("memberName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isSimulasiOpen, setIsSimulasiOpen] = useState(false);
  const [rawMembers, setRawMembers] = useState<MemberShuBasisRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [settings, setSettings] = useState<KopdesSettings>(defaultSettings);
  // null = belum ada SHU bersih yang diinput untuk tahun buku aktif.
  const [netShu, setNetShu] = useState<number | null>(null);
  const [netShuInput, setNetShuInput] = useState("");
  const [netShuLoadError, setNetShuLoadError] = useState<string | null>(null);
  const [isSavingNetShu, setIsSavingNetShu] = useState(false);
  const [netShuMessage, setNetShuMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const loadedSettings = await loadSettingsAsync();
        setSettings(loadedSettings);

        try {
          const loadedNetShu = await loadFiscalYearNetShu(loadedSettings);
          setNetShu(loadedNetShu);
          setNetShuInput(loadedNetShu === null ? "" : String(loadedNetShu));
        } catch (e) {
          console.error("Failed to load fiscal year SHU", e);
          setNetShuLoadError(
            "Data SHU tahun buku tidak dapat dimuat. Pastikan tabel fiscal_year_shu sudah dibuat (jalankan setup_fiscal_year_shu.sql di Supabase).",
          );
        }

        const records = await loadMemberShuBasisRows(loadedSettings);
        setRawMembers(records);
      } catch (e) {
        console.error("Failed to load Quick SHU data", e);
      } finally {
        setIsLoading(false);
      }
    };
    void fetchData();
  }, []);

  // Simpanan basis = Pokok + Wajib + Sukarela + Investasi, as in the
  // reference RAT ("JML SIMPANAN"); Jasa basis = Setoran Jasa.
  const { savingBasis: totalSimpananBasis, serviceBasis: totalJasaBasis } = useMemo(
    () => totalShuBasis(rawMembers),
    [rawMembers]
  );

  // Dana Anggota is sized from the net SHU entered for the fiscal year (from
  // the income statement) and split at one rate across savings and service
  // participation, via the same shared helpers Spreadsheet Live and the RAT
  // bundle use, so every screen agrees on these figures.
  const shuPools = useMemo(
    () => calculateShuPools(netShu ?? 0, settings),
    [netShu, settings]
  );
  const netShuAmount = shuPools.netShu;
  const valDanaAnggota = shuPools.danaAnggota;
  const shuRate = useMemo(
    () => calculateShuRate(valDanaAnggota, { savingBasis: totalSimpananBasis, serviceBasis: totalJasaBasis }),
    [valDanaAnggota, totalSimpananBasis, totalJasaBasis]
  );

  const pctCadangan = settings.pctCadangan;
  const pctDanaAnggota = settings.pctDanaAnggota;
  const pctPengurus = settings.pctPengurus;
  const pctKaryawan = settings.pctKaryawan;
  const pctPendidikan = settings.pctPendidikan;
  const pctPmdk = settings.pctPmdk;
  const pctSosial = settings.pctSosial;

  const totalPercentage = useMemo(() => {
    return pctCadangan + pctDanaAnggota + pctPengurus + pctKaryawan + pctPendidikan + pctPmdk + pctSosial;
  }, [pctCadangan, pctDanaAnggota, pctPengurus, pctKaryawan, pctPendidikan, pctPmdk, pctSosial]);
  // Same tolerance as the Pengaturan save gate, so a total that page accepts
  // never shows up here as invalid due to float rounding (e.g. 0.1+0.2).
  const isPctTotalValid = Math.abs(totalPercentage - 100) < 0.01;

  // Real-time Rupiah calculations
  const valCadangan = useMemo(() => Math.round((netShuAmount * pctCadangan) / 100), [netShuAmount, pctCadangan]);
  const valPengurus = useMemo(() => Math.round((netShuAmount * pctPengurus) / 100), [netShuAmount, pctPengurus]);
  const valKaryawan = useMemo(() => Math.round((netShuAmount * pctKaryawan) / 100), [netShuAmount, pctKaryawan]);
  const valPendidikan = useMemo(() => Math.round((netShuAmount * pctPendidikan) / 100), [netShuAmount, pctPendidikan]);
  const valPmdk = useMemo(() => Math.round((netShuAmount * pctPmdk) / 100), [netShuAmount, pctPmdk]);
  const valSosial = useMemo(() => Math.round((netShuAmount * pctSosial) / 100), [netShuAmount, pctSosial]);

  // Compute calculated metrics for each row in real-time
  const computedRows = useMemo(() => {
    const shuResults = distributeMemberShu(rawMembers, valDanaAnggota);
    return rawMembers.map((row, i) => ({
      ...row,
      ...shuResults[i],
    }));
  }, [rawMembers, valDanaAnggota]);

  // What actually reached members (sum of the rows), not the pos size —
  // equal to Dana Anggota thanks to the largest remainder rounding, except
  // when there is no savings or service basis to distribute over.
  const distributedSavingShu = useMemo(() => computedRows.reduce((sum, r) => sum + r.savingShu, 0), [computedRows]);
  const distributedServiceShu = useMemo(() => computedRows.reduce((sum, r) => sum + r.serviceShu, 0), [computedRows]);
  const distributedTotalShu = distributedSavingShu + distributedServiceShu;
  const undistributedShu = valDanaAnggota - distributedTotalShu;
  const totalIuran = useMemo(() => computedRows.reduce((sum, r) => sum + r.totalSaving, 0), [computedRows]);

  const sortedRows = useMemo(() => {
    return [...computedRows].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (typeof valA === "string" && typeof valB === "string") {
        return sortDirection === "asc"
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }

      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }

      return 0;
    });
  }, [computedRows, sortKey, sortDirection]);

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const year = settings.activeFiscalYear.toString();
  const coopName = settings.cooperativeName.toUpperCase();
  const location = settings.district.toUpperCase();
  const printLocation = settings.printLocation;
  const formattedDate = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

  const handleSaveNetShu = async () => {
    setNetShuMessage(null);
    if (netShuInput.trim() === "") {
      setNetShuMessage({ type: "error", text: "Isi SHU bersih tahun buku terlebih dahulu (isi 0 jika tidak ada SHU)." });
      return;
    }

    setIsSavingNetShu(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        notifySessionExpired();
        return;
      }

      const result = await shuDependencies.saveFiscalYearShuUseCase.execute(
        settings.activeFiscalYear,
        Number(netShuInput),
      );
      if (!result.success) {
        setNetShuMessage({ type: "error", text: result.message });
        return;
      }

      const previous = netShu === null ? "belum diisi" : `Rp ${netShu.toLocaleString("id-ID")}`;
      setNetShu(result.netShu);
      setNetShuLoadError(null);
      setNetShuMessage({ type: "success", text: `SHU bersih tahun buku ${year} tersimpan.` });
      addAuditLog(
        "UPDATE_SHU",
        `Mengubah SHU bersih tahun buku ${year}: ${previous} ➔ Rp ${result.netShu.toLocaleString("id-ID")}.`,
        "success",
      );
    } catch (e) {
      console.error("Failed to save fiscal year SHU", e);
      // 42501 = RLS rejected the write: the session token is no longer valid.
      if ((e as { code?: string } | null)?.code === "42501") {
        notifySessionExpired();
        return;
      }
      setNetShuMessage({
        type: "error",
        text: "Gagal menyimpan SHU bersih. Pastikan tabel fiscal_year_shu sudah dibuat (jalankan setup_fiscal_year_shu.sql di Supabase).",
      });
    } finally {
      setIsSavingNetShu(false);
    }
  };

  const handleExportSHU = async () => {
    addAuditLog("EXPORT_EXCEL", `Mengekspor Laporan Pembagian SHU Koperasi format RAT ${year} ke berkas Excel (.xlsx).`, "info");
    const wb = new ExcelJS.Workbook();
    buildShuSheet(wb, settings, sortedRows);
    const buffer = await wb.xlsx.writeBuffer();
    downloadExcelBuffer(buffer as ExcelJS.Buffer, `LAPORAN_SHU_${year}.xlsx`);
  };

  const handleExportSimpanan = async () => {
    addAuditLog("EXPORT_EXCEL", `Mengekspor Daftar Simpanan Anggota format RAT ${year} ke berkas Excel (.xlsx).`, "info");
    const wb = new ExcelJS.Workbook();
    buildSimpananSheet(wb, settings, sortedRows);
    const buffer = await wb.xlsx.writeBuffer();
    downloadExcelBuffer(buffer as ExcelJS.Buffer, `DAFTAR_SIMPANAN_${year}.xlsx`);
  };

  const handleExportBundleRat = async () => {
    addAuditLog("EXPORT_EXCEL", `Mengekspor Bundel Laporan RAT (Daftar Simpanan & Daftar SHU) ${year} ke dalam satu berkas Excel (.xlsx).`, "info");
    const wb = new ExcelJS.Workbook();
    buildSimpananSheet(wb, settings, sortedRows);
    buildShuSheet(wb, settings, sortedRows);
    const buffer = await wb.xlsx.writeBuffer();
    downloadExcelBuffer(buffer as ExcelJS.Buffer, `BUNDEL_RAT_${year}.xlsx`);
  };

  const SortIndicator = ({ active, direction }: { active: boolean; direction: "asc" | "desc" }) => (
    <span className="flex flex-col ml-2 opacity-30 group-hover:opacity-100 transition-opacity">
      <svg
        className={`w-3 h-3 ${active && direction === "asc" ? "text-primary opacity-100 scale-110" : "text-slate-400"}`}
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 4l-8 8h16z" />
      </svg>
      <svg
        className={`w-3 h-3 -mt-1.5 ${active && direction === "desc" ? "text-primary opacity-100 scale-110" : "text-slate-400"}`}
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M12 20l8-8H4z" />
      </svg>
    </span>
  );

  return (
    <section className="space-y-6">
      {!isLoading && (netShuLoadError || netShu === null) && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800 flex flex-wrap items-center justify-between gap-3">
          <p>
            {netShuLoadError ??
              `SHU bersih tahun buku ${year} belum diisi, sehingga seluruh pembagian SHU masih Rp 0. Isi nilainya sesuai laporan laba-rugi koperasi.`}
          </p>
          {!netShuLoadError && (
            <button
              type="button"
              onClick={() => setIsSimulasiOpen(true)}
              className="rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100"
            >
              Isi SHU Bersih
            </button>
          )}
        </div>
      )}

      {/* TRANSPARANSI ALOKASI AD/ART */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {/* Accordion Header */}
        <button
          onClick={() => setIsSimulasiOpen(!isSimulasiOpen)}
          className="w-full p-6 flex flex-wrap items-center justify-between gap-4 bg-white hover:bg-slate-50 transition-colors cursor-pointer text-left focus:outline-none"
        >
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
              <svg className="h-5.5 w-5.5 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Transparansi Alokasi SHU AD/ART
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Kalkulasi pembagian keuntungan bersih tahunan koperasi secara transparan berdasarkan asas AD/ART & keputusan RAT.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-bold text-slate-400 uppercase">SHU Bersih {year}</p>
              <p className="text-sm font-extrabold text-green-700">Rp {netShuAmount.toLocaleString("id-ID")}</p>
            </div>
            <div className={`p-1.5 rounded-full bg-slate-100 text-slate-500 transition-transform duration-300 ${isSimulasiOpen ? 'rotate-180' : ''}`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </button>

        {/* Accordion Body */}
        <div 
          className={`transition-all duration-300 ease-in-out overflow-hidden ${isSimulasiOpen ? 'max-h-[2000px] opacity-100 border-t border-slate-100' : 'max-h-0 opacity-0'}`}
        >
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-1">
                  <label htmlFor="net-shu" className="text-xs font-bold text-slate-600">SHU Bersih Tahun Buku {year}:</label>
                  <Hint text="SHU bersih tahun buku sesuai laporan laba-rugi koperasi: pendapatan dikurangi biaya, penyusutan, dan kewajiban lain termasuk pajak. Diisi oleh pengurus/bendahara. Nilai ini dialokasikan ke 7 pos sesuai persentase AD/ART di Pengaturan." />
                </div>
                <div className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 focus-within:ring-2 focus-within:ring-primary/30">
                  <span className="text-xs font-bold text-slate-400">Rp</span>
                  <input
                    id="net-shu"
                    type="text"
                    inputMode="numeric"
                    maxLength={19}
                    value={netShuInput === "" ? "" : Number(netShuInput).toLocaleString("id-ID")}
                    onChange={(e) => {
                      // Simpan hanya digit; titik ribuan ditambahkan saat tampil.
                      setNetShuInput(e.target.value.replace(/\D/g, "").replace(/^0+(?=\d)/, ""));
                      setNetShuMessage(null);
                    }}
                    placeholder="0"
                    className="w-36 bg-transparent text-xs font-bold text-slate-700 outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSaveNetShu}
                  disabled={isSavingNetShu || isLoading}
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSavingNetShu ? "Menyimpan..." : "Simpan SHU"}
                </button>
              </div>
              {netShuMessage && (
                <p className={`text-xs ${netShuMessage.type === "success" ? "text-green-700" : "text-red-600"}`}>
                  {netShuMessage.text}
                </p>
              )}
            </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Inputs Column */}
          <div className="lg:col-span-5 bg-slate-50/50 p-5 rounded-2xl border border-slate-200/60 space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center justify-between">
              <span>Persentase Pos Pembagian</span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${isPctTotalValid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                Total: {totalPercentage.toFixed(2)}%
              </span>
            </h4>

            <div className="space-y-3">
              {/* Cadangan Koperasi */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 flex-1">
                  <label className="text-xs font-medium text-slate-600">1. Cadangan Koperasi</label>
                  <Hint text="Bagian SHU yang disisihkan untuk memupuk modal sendiri, membiayai pengembangan usaha, serta menutup potensi kerugian koperasi di masa depan." />
                </div>
                <div className="relative w-24 flex items-center justify-end pr-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-xs font-bold text-slate-800 py-1.5">{pctCadangan}</span>
                  <span className="ml-1 text-xs text-slate-400 font-bold">%</span>
                </div>
              </div>

              {/* Dana Anggota */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 flex-1">
                  <label className="text-xs font-medium text-slate-600">2. Dana Anggota</label>
                  <Hint text="Bagian SHU yang dikembalikan kepada anggota. Dibagi dengan satu tarif yang sama atas simpanan (SHU Simpanan) dan partisipasi jasa (SHU Jasa) masing-masing anggota." />
                </div>
                <div className="relative w-24 flex items-center justify-end pr-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-xs font-bold text-slate-800 py-1.5">{pctDanaAnggota}</span>
                  <span className="ml-1 text-xs text-slate-400 font-bold">%</span>
                </div>
              </div>

              {/* Dana Pengurus */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 flex-1">
                  <label className="text-xs font-medium text-slate-600">3. Dana Pengurus & Manajemen</label>
                  <Hint text="Insentif tahunan bagi jajaran pengurus dan pengawas atas dedikasi mereka memimpin dan mengelola administrasi koperasi." />
                </div>
                <div className="relative w-24 flex items-center justify-end pr-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-xs font-bold text-slate-800 py-1.5">{pctPengurus}</span>
                  <span className="ml-1 text-xs text-slate-400 font-bold">%</span>
                </div>
              </div>

              {/* Dana Karyawan */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 flex-1">
                  <label className="text-xs font-medium text-slate-600">4. Dana Karyawan / Pegawai</label>
                  <Hint text="Bonus penghargaan tahunan bagi staf pengelola teknis operasional harian koperasi agar terus termotivasi." />
                </div>
                <div className="relative w-24 flex items-center justify-end pr-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-xs font-bold text-slate-800 py-1.5">{pctKaryawan}</span>
                  <span className="ml-1 text-xs text-slate-400 font-bold">%</span>
                </div>
              </div>

              {/* Dana Pendidikan */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 flex-1">
                  <label className="text-xs font-medium text-slate-600">5. Dana Pendidikan Koperasi</label>
                  <Hint text="Dana untuk membiayai program diklat perkoperasian dan kewirausahaan bagi seluruh komponen anggota, pengurus, maupun pengawas." />
                </div>
                <div className="relative w-24 flex items-center justify-end pr-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-xs font-bold text-slate-800 py-1.5">{pctPendidikan}</span>
                  <span className="ml-1 text-xs text-slate-400 font-bold">%</span>
                </div>
              </div>

              {/* Dana PMDK */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 flex-1">
                  <label className="text-xs font-medium text-slate-600">6. Dana Pembangunan Daerah Kerja (PMDK)</label>
                  <Hint text="Dialokasikan untuk pembangunan fasilitas umum di wilayah kerja koperasi." />
                </div>
                <div className="relative w-24 flex items-center justify-end pr-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-xs font-bold text-slate-800 py-1.5">{pctPmdk}</span>
                  <span className="ml-1 text-xs text-slate-400 font-bold">%</span>
                </div>
              </div>

              {/* Dana Sosial */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 flex-1">
                  <label className="text-xs font-medium text-slate-600">7. Dana Sosial</label>
                  <Hint text="Dialokasikan untuk dana kemanusiaan dan kegiatan sosial kemasyarakatan." />
                </div>
                <div className="relative w-24 flex items-center justify-end pr-2 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-xs font-bold text-slate-800 py-1.5">{pctSosial}</span>
                  <span className="ml-1 text-xs text-slate-400 font-bold">%</span>
                </div>
              </div>
            </div>

            {!isPctTotalValid && (
              <div className="bg-red-50 text-red-600 px-3 py-2.5 rounded-xl text-[10px] font-semibold flex items-start gap-1.5 border border-red-100 leading-normal animate-pulse">
                <svg className="h-4 w-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Peringatan: Total alokasi persentase saat ini adalah <strong>{totalPercentage.toFixed(2)}%</strong>. Harap setel hingga tepat <strong>100%</strong> untuk pembagian yang valid.</span>
              </div>
            )}
          </div>

          {/* Visual Outputs Column */}
          <div className="lg:col-span-7 space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider border-b border-slate-200 pb-2">
              Rincian Alokasi Dana Riil (Rupiah)
            </h4>

            <div className="grid gap-3.5 sm:grid-cols-2">
              {/* Card 1: Cadangan */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/30 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Cadangan Koperasi</span>
                  <p className="text-base sm:text-lg font-extrabold text-slate-700 mt-1">Rp {valCadangan.toLocaleString("id-ID")}</p>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-green-600 h-full rounded-full transition-all duration-200" style={{ width: `${Math.min(100, Math.max(0, pctCadangan))}%` }}></div>
                </div>
              </div>

              {/* Card 2: Dana Anggota */}
              <div className="border border-blue-200 rounded-2xl p-4 bg-blue-50/20 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wide">Dana Anggota ({pctDanaAnggota}%)</span>
                  <p className="text-base sm:text-lg font-extrabold text-blue-700 mt-1">Rp {valDanaAnggota.toLocaleString("id-ID")}</p>
                </div>
                <div className="text-[10px] text-slate-500 mt-3 space-y-1.5">
                  <div className="flex justify-between">
                    <span>• Tarif SHU per Rp 1:</span>
                    <span className="font-bold text-slate-700">{formatShuRate(shuRate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• SHU Simpanan:</span>
                    <span className="font-bold text-slate-700">Rp {distributedSavingShu.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>• SHU Jasa:</span>
                    <span className="font-bold text-slate-700">Rp {distributedServiceShu.toLocaleString("id-ID")}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Minor Stakeholders Stack */}
            <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs text-slate-600">
              <div className="flex justify-between items-center">
                <span className="font-medium">• Dana Pengurus & Manajemen ({pctPengurus}%):</span>
                <span className="font-bold text-slate-800">Rp {valPengurus.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200/50 pt-2.5">
                <span className="font-medium">• Dana Karyawan / Pegawai ({pctKaryawan}%):</span>
                <span className="font-bold text-slate-800">Rp {valKaryawan.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200/50 pt-2.5">
                <span className="font-medium">• Dana Pendidikan Koperasi ({pctPendidikan}%):</span>
                <span className="font-bold text-slate-800">Rp {valPendidikan.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200/50 pt-2.5">
                <span className="font-medium">• Dana Pembangunan Daerah Kerja / PMDK ({pctPmdk}%):</span>
                <span className="font-bold text-slate-800">Rp {valPmdk.toLocaleString("id-ID")}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-200/50 pt-2.5">
                <span className="font-medium">• Dana Sosial ({pctSosial}%):</span>
                <span className="font-bold text-slate-800">Rp {valSosial.toLocaleString("id-ID")}</span>
              </div>
            </div>
          </div>
        </div>
          </div>
        </div>
      </div>

      {/* DYNAMIC METRIC CARDS / SUMMARIES */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-primary">
            Ringkasan Distribusi SHU
          </h3>
          <Hint text="Ringkasan angka inti SHU agar user cepat melihat total penting sebelum membuka tabel detail." />
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Ringkasan angka utama hasil perhitungan sistem secara langsung.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-primary/20 bg-white p-5">
            <div className="flex items-center gap-2">
              <p className="text-sm text-slate-500">Total Basis Simpanan</p>
              <Hint text="Akumulasi Simpanan Pokok + Wajib + Sukarela + Investasi seluruh anggota aktif yang menjadi basis perhitungan SHU Simpanan (mengikuti kolom JML SIMPANAN pada Laporan RAT)." />
            </div>
            <p className="mt-2 text-xl font-semibold text-primary">
              Rp {totalSimpananBasis.toLocaleString("id-ID")}
            </p>
            <p className="mt-1 text-xs text-slate-500">SHU Simpanan: Rp {distributedSavingShu.toLocaleString("id-ID")}</p>
          </article>

          <article className="rounded-2xl border border-primary/20 bg-white p-5">
            <div className="flex items-center gap-2">
              <p className="text-sm text-slate-500">Total Basis Jasa</p>
              <Hint text="Akumulasi Setoran Jasa (partisipasi usaha) seluruh anggota aktif yang menjadi basis perhitungan SHU Jasa." />
            </div>
            <p className="mt-2 text-xl font-semibold text-primary">
              Rp {totalJasaBasis.toLocaleString("id-ID")}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {totalJasaBasis > 0
                ? `SHU Jasa: Rp ${distributedServiceShu.toLocaleString("id-ID")}`
                : "Belum ada data partisipasi jasa — seluruh Dana Anggota dibagi lewat simpanan"}
            </p>
          </article>

          <article className="rounded-2xl border border-primary/20 bg-white p-5">
            <div className="flex items-center gap-2">
              <p className="text-sm text-slate-500">Total SHU Terdistribusi</p>
              <Hint text="Total SHU yang benar-benar terbagi ke anggota (jumlah SHU simpanan + SHU jasa seluruh anggota). SHU per anggota dibulatkan ke rupiah utuh dengan metode sisa terbesar: sisa rupiah dari pembulatan diberikan satu per satu ke anggota dengan pecahan terbesar, sehingga totalnya tepat sama dengan Dana Anggota." />
            </div>
            <p className="mt-2 text-xl font-semibold text-primary">
              Rp {distributedTotalShu.toLocaleString("id-ID")}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Dana Anggota: Rp {valDanaAnggota.toLocaleString("id-ID")} •{" "}
              {undistributedShu === 0
                ? "Terbagi habis"
                : `Belum terbagi: Rp ${undistributedShu.toLocaleString("id-ID")} (belum ada basis simpanan/jasa)`}
            </p>
          </article>
        </div>
      </div>

      {/* DETAILED PARAMETERS & DATA TABLE */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-primary">
              Parameter & Data Member SHU
            </h3>
            <Hint text="Parameter global tahunan dan tabel data anggota beserta hasil perhitungan SHU." />
          </div>

          <div className="flex items-center gap-2 text-sm border-l border-slate-200/80 pl-4 h-6">
            <span className="font-medium text-slate-600">Tahun Buku:</span>
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">
              {year}
            </span>
            <Hint text="Tahun buku aktif diambil dari halaman Pengaturan. Ubah di sana untuk menghitung SHU tahun lain." />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-primary/20 bg-slate-50/40 p-4 text-sm flex justify-between items-center">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-slate-600">Dana Anggota</span>
                <Hint text="Bagian SHU bersih yang dibagikan kepada anggota sesuai persentase AD/ART di Pengaturan." />
              </div>
              <p className="mt-1.5 text-lg font-bold text-slate-800">
                Rp {valDanaAnggota.toLocaleString("id-ID")}
              </p>
            </div>
            <span className="px-2.5 py-1 bg-green-100 text-green-700 font-bold rounded-lg text-xs">
              {pctDanaAnggota}% AD/ART
            </span>
          </div>

          <div className="rounded-2xl border border-primary/20 bg-slate-50/40 p-4 text-sm flex justify-between items-center">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-slate-600">Tarif SHU</span>
                <Hint text="Tarif = Dana Anggota ÷ (Total Basis Simpanan + Total Basis Jasa). SHU Simpanan anggota = simpanannya × tarif; SHU Jasa anggota = setoran jasanya × tarif." />
              </div>
              <p className="mt-1.5 text-lg font-bold text-slate-800">
                {formatShuRate(shuRate)}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Rp {valDanaAnggota.toLocaleString("id-ID")} ÷ Rp {(totalSimpananBasis + totalJasaBasis).toLocaleString("id-ID")}
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-4">
            <div className="flex gap-3">
              <button
                onClick={() => setActiveTab("shu")}
                className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
                  activeTab === "shu"
                    ? "bg-primary text-white shadow-md scale-102"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                Daftar SHU
              </button>
              <button
                onClick={() => setActiveTab("simpanan")}
                className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
                  activeTab === "simpanan"
                    ? "bg-primary text-white shadow-md scale-102"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                Daftar Simpanan
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={activeTab === "shu" ? handleExportSHU : handleExportSimpanan}
                className="inline-flex items-center gap-2 rounded-xl bg-green-700 hover:bg-green-800 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-300"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Format RAT {year}
              </button>
              <button
                type="button"
                onClick={handleExportBundleRat}
                className="inline-flex items-center gap-2 rounded-xl border border-green-700 text-green-700 hover:bg-green-50 px-4 py-2 text-xs sm:text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-green-300"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-6 4h6m2 5H7a2 2 0 01-2-2V4a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V20a2 2 0 01-2 2z" />
                </svg>
                Ekspor Semua Laporan (Bundel RAT)
              </button>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-2">
              <h4 className="text-base font-semibold text-slate-800">
                {activeTab === "shu" ? "Data Member SHU" : "Data Simpanan Member"}
              </h4>
              <Hint text={activeTab === "shu" ? "Tabel data anggota beserta hasil perhitungan SHU." : "Rincian simpanan pokok, wajib, dan sukarela anggota."} />
            </div>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              {activeTab === "shu" 
                ? "Daftar anggota dan hasil SHU yang diterima masing-masing." 
                : "Daftar simpanan yang menjadi basis perhitungan SHU."}
            </p>
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                {activeTab === "shu" ? (
                  <tr>
                    <th className="px-3 py-2.5 font-bold cursor-pointer group hover:bg-slate-100 transition-colors" onClick={() => handleSort("memberName")}>
                      <div className="inline-flex items-center gap-1">Anggota<SortIndicator active={sortKey === "memberName"} direction={sortDirection} /><Hint text="Nama anggota." /></div>
                    </th>
                    <th className="px-3 py-2.5 font-bold cursor-pointer group hover:bg-slate-100 transition-colors" onClick={() => handleSort("totalSaving")}>
                      <div className="inline-flex items-center gap-1">Total Iuran<SortIndicator active={sortKey === "totalSaving"} direction={sortDirection} /><Hint text="Jumlah Simpanan Pokok + Wajib + Sukarela. Ditambah Investasi, nilai ini menjadi basis SHU Simpanan anggota." /></div>
                    </th>
                    <th className="px-3 py-2.5 font-bold cursor-pointer group hover:bg-slate-100 transition-colors" onClick={() => handleSort("investmentAmount")}>
                      <div className="inline-flex items-center gap-1">Investasi<SortIndicator active={sortKey === "investmentAmount"} direction={sortDirection} /><Hint text="Investasi anggota tahun buku berjalan, ikut menjadi basis SHU Simpanan bersama Pokok + Wajib + Sukarela." /></div>
                    </th>
                    <th className="px-3 py-2.5 font-bold cursor-pointer group hover:bg-slate-100 transition-colors" onClick={() => handleSort("serviceContribution")}>
                      <div className="inline-flex items-center gap-1">Setoran Jasa<SortIndicator active={sortKey === "serviceContribution"} direction={sortDirection} /><Hint text="Partisipasi jasa." /></div>
                    </th>
                    <th className="px-3 py-2.5 font-bold cursor-pointer group hover:bg-slate-100 transition-colors" onClick={() => handleSort("savingShu")}>
                      <div className="inline-flex items-center gap-1">SHU Simpanan<SortIndicator active={sortKey === "savingShu"} direction={sortDirection} /><Hint text="(Total Iuran + Investasi) × Tarif SHU." /></div>
                    </th>
                    <th className="px-3 py-2.5 font-bold cursor-pointer group hover:bg-slate-100 transition-colors" onClick={() => handleSort("serviceShu")}>
                      <div className="inline-flex items-center gap-1">SHU Jasa<SortIndicator active={sortKey === "serviceShu"} direction={sortDirection} /><Hint text="Setoran Jasa × Tarif SHU." /></div>
                    </th>
                    <th className="px-3 py-2.5 font-bold cursor-pointer group hover:bg-slate-100 transition-colors" onClick={() => handleSort("totalShu")}>
                      <div className="inline-flex items-center gap-1">Total SHU<SortIndicator active={sortKey === "totalShu"} direction={sortDirection} /><Hint text="Total SHU dibagikan." /></div>
                    </th>
                  </tr>
                ) : (
                  <tr>
                    <th className="px-3 py-2.5 font-bold">No</th>
                    <th className="px-3 py-2.5 font-bold cursor-pointer group" onClick={() => handleSort("memberName")}>
                      <div className="inline-flex items-center gap-1">Nama Anggota<SortIndicator active={sortKey === "memberName"} direction={sortDirection} /></div>
                    </th>
                    <th className="px-3 py-2.5 font-bold cursor-pointer group text-right" onClick={() => handleSort("savingPokok")}>
                      <div className="inline-flex items-center gap-1 justify-end">Pokok<SortIndicator active={sortKey === "savingPokok"} direction={sortDirection} /></div>
                    </th>
                    <th className="px-3 py-2.5 font-bold cursor-pointer group text-right" onClick={() => handleSort("savingWajib")}>
                      <div className="inline-flex items-center gap-1 justify-end">Wajib<SortIndicator active={sortKey === "savingWajib"} direction={sortDirection} /></div>
                    </th>
                    <th className="px-3 py-2.5 font-bold cursor-pointer group text-right" onClick={() => handleSort("savingSukarela")}>
                      <div className="inline-flex items-center gap-1 justify-end">Sukarela<SortIndicator active={sortKey === "savingSukarela"} direction={sortDirection} /></div>
                    </th>
                    <th className="px-3 py-2.5 font-bold cursor-pointer group text-right bg-primary/5" onClick={() => handleSort("totalSaving")}>
                      <div className="inline-flex items-center gap-1 justify-end">Jumlah<SortIndicator active={sortKey === "totalSaving"} direction={sortDirection} /></div>
                    </th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                {isLoading ? (
                  <tr>
                    <td colSpan={activeTab === "shu" ? 7 : 6} className="px-3 py-10 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 border-2 border-slate-200 border-t-primary rounded-full animate-spin"></div>
                        <p className="text-sm">Menghitung Data SHU dari Database...</p>
                      </div>
                    </td>
                  </tr>
                ) : sortedRows.length === 0 ? (
                  <tr>
                    <td colSpan={activeTab === "shu" ? 7 : 6} className="px-3 py-10 text-center text-slate-500 text-sm">
                      Belum ada data anggota aktif untuk dihitung.
                    </td>
                  </tr>
                ) : (
                  sortedRows.map((row, index) => (
                    <tr key={row.memberId} className="hover:bg-slate-50 transition-colors">
                    {activeTab === "shu" ? (
                      <>
                        <td className="px-3 py-2 font-medium">{row.memberName}</td>
                        <td className="px-3 py-2">Rp {row.totalSaving.toLocaleString("id-ID")}</td>
                        <td className="px-3 py-2">Rp {row.investmentAmount.toLocaleString("id-ID")}</td>
                        <td className="px-3 py-2">Rp {row.serviceContribution.toLocaleString("id-ID")}</td>
                        <td className="px-3 py-2 text-slate-600">Rp {row.savingShu.toLocaleString("id-ID")}</td>
                        <td className="px-3 py-2 text-slate-600">Rp {row.serviceShu.toLocaleString("id-ID")}</td>
                        <td className="px-3 py-2 font-bold text-primary">Rp {row.totalShu.toLocaleString("id-ID")}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-2 text-slate-400">{index + 1}</td>
                        <td className="px-3 py-2 font-medium">{row.memberName}</td>
                        <td className="px-3 py-2 text-right">Rp {row.savingPokok.toLocaleString("id-ID")}</td>
                        <td className="px-3 py-2 text-right">Rp {row.savingWajib.toLocaleString("id-ID")}</td>
                        <td className="px-3 py-2 text-right">Rp {row.savingSukarela.toLocaleString("id-ID")}</td>
                        <td className="px-3 py-2 text-right font-bold bg-primary/5">Rp {row.totalSaving.toLocaleString("id-ID")}</td>
                      </>
                    )}
                  </tr>
                )))}

                {/* SUM FOOTER ROW */}
                <tr className="bg-slate-100 font-bold border-t border-slate-300">
                  <td className="px-3 py-2.5 text-slate-700" colSpan={activeTab === "shu" ? 1 : 2}>
                    JUMLAH (SUM TOTAL)
                  </td>
                  {activeTab === "shu" ? (
                    <>
                      <td className="px-3 py-2.5">Rp {totalIuran.toLocaleString("id-ID")}</td>
                      <td className="px-3 py-2.5">Rp {sortedRows.reduce((a, b) => a + b.investmentAmount, 0).toLocaleString("id-ID")}</td>
                      <td className="px-3 py-2.5">Rp {totalJasaBasis.toLocaleString("id-ID")}</td>
                      <td className="px-3 py-2.5 text-slate-600">Rp {distributedSavingShu.toLocaleString("id-ID")}</td>
                      <td className="px-3 py-2.5 text-slate-600">Rp {distributedServiceShu.toLocaleString("id-ID")}</td>
                      <td className="px-3 py-2.5 text-primary">Rp {distributedTotalShu.toLocaleString("id-ID")}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2.5 text-right">Rp {sortedRows.reduce((a, b) => a + b.savingPokok, 0).toLocaleString("id-ID")}</td>
                      <td className="px-3 py-2.5 text-right">Rp {sortedRows.reduce((a, b) => a + b.savingWajib, 0).toLocaleString("id-ID")}</td>
                      <td className="px-3 py-2.5 text-right">Rp {sortedRows.reduce((a, b) => a + b.savingSukarela, 0).toLocaleString("id-ID")}</td>
                      <td className="px-3 py-2.5 text-right text-primary bg-primary/5">Rp {totalIuran.toLocaleString("id-ID")}</td>
                    </>
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
