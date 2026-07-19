"use client";

import { useEffect, useMemo, useState } from "react";
import { memberDependencies } from "@/src/features/member/infrastructure/member-dependencies";
import { addAuditLog } from "@/src/utils/audit-logger";
import ExcelJS from "exceljs";
import type { Member } from "@/src/features/member/domain/member";
import type { MemberMonthlySaving } from "@/src/features/member/domain/member-monthly-saving";
import { loadSettingsAsync, defaultSettings } from "@/src/actions/settings-actions";
import type { KopdesSettings } from "@/src/features/settings/domain/settings";

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

type MemberAnnualSummary = {
  member: Member;
  pokok: number;
  wajib: number;
  sukarela: number;
  total: number;
  savingsInYear: MemberMonthlySaving[];
};

export default function LaporanPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [summaries, setSummaries] = useState<MemberAnnualSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<KopdesSettings>(defaultSettings);

  // Build the selectable year range (down to 2025)
  const yearOptions = useMemo(() => {
    const minYear = 2025;
    const years = [];
    for (let y = currentYear; y >= minYear; y--) {
      years.push(y);
    }
    return years;
  }, [currentYear]);

  useEffect(() => {
    const loadReport = async () => {
      setIsLoading(true);
      try {
        const [members, fetchedSettings] = await Promise.all([
          memberDependencies.getMembersUseCase.execute(),
          loadSettingsAsync()
        ]);
        setSettings(fetchedSettings);
        const activeMembers = members.filter((m) => m.status === "aktif");

        const results: MemberAnnualSummary[] = [];

        for (const member of activeMembers) {
          const joinYear = new Date(member.joinDate).getFullYear();
          if (joinYear > selectedYear) continue;

          const allSavings = await memberDependencies.getMemberMonthlySavingsUseCase.execute(member.id);
          
          // Akumulasi simpanan hingga akhir tahun buku yang dipilih (saldo akhir)
          const savingsUpToYear = allSavings.filter((s) => {
            if (s.period === "POKOK") {
              return new Date(s.inputDate).getFullYear() <= selectedYear;
            }
            const savingYear = parseInt(s.period.split("-")[0]);
            return savingYear <= selectedYear;
          });

          const wajib = savingsUpToYear.reduce((sum, s) => sum + s.requiredSaving, 0);
          const sukarela = savingsUpToYear.reduce((sum, s) => sum + s.voluntarySaving, 0);
          
          const pokokRecord = savingsUpToYear.find((s) => s.period === "POKOK");
          const pokok = pokokRecord ? pokokRecord.requiredSaving : 0;

          results.push({
            member,
            pokok,
            wajib,
            sukarela,
            total: pokok + wajib + sukarela,
            savingsInYear: savingsUpToYear,
          });
        }

        // Sort by total savings descending
        results.sort((a, b) => b.total - a.total);
        setSummaries(results);
      } finally {
        setIsLoading(false);
      }
    };

    void loadReport();
  }, [selectedYear]);

  const grandTotal = useMemo(() => ({
    pokok: summaries.reduce((s, r) => s + r.pokok, 0),
    wajib: summaries.reduce((s, r) => s + r.wajib, 0),
    sukarela: summaries.reduce((s, r) => s + r.sukarela, 0),
    total: summaries.reduce((s, r) => s + r.total, 0),
  }), [summaries]);

  const handlePrint = () => {
    addAuditLog(
      "LAPORAN_PRINT",
      `Mencetak Laporan Rekap Tahunan Simpanan Anggota Tahun Buku ${selectedYear}`,
      "success"
    );
    window.print();
  };

  const handleExportExcel = async () => {
    addAuditLog(
      "LAPORAN_EXPORT",
      `Mengekspor Laporan Rekap Tahunan Simpanan Tahun Buku ${selectedYear} ke format Excel (.xlsx)`,
      "success"
    );

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Rekap Tahunan");
    const formattedDate = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

    ws.columns = [
      { width: 5 },  // No
      { width: 30 }, // Nama Anggota
      { width: 25 }, // NIK
      { width: 20 }, // Simpanan Pokok
      { width: 20 }, // Simpanan Wajib
      { width: 20 }, // Simpanan Sukarela
      { width: 20 }, // Total Simpanan
    ];

    ws.mergeCells("A1:G1");
    ws.getCell("A1").value = settings.cooperativeName.toUpperCase();
    ws.getCell("A1").font = { bold: true, size: 12 };
    ws.getCell("A1").alignment = { horizontal: "center" };

    ws.mergeCells("A2:G2");
    ws.getCell("A2").value = "LAPORAN REKAP SIMPANAN TAHUNAN";
    ws.getCell("A2").font = { bold: true, size: 12 };
    ws.getCell("A2").alignment = { horizontal: "center" };

    ws.mergeCells("A3:G3");
    ws.getCell("A3").value = `Tahun Buku ${selectedYear}`;
    ws.getCell("A3").font = { bold: true, size: 12 };
    ws.getCell("A3").alignment = { horizontal: "center" };

    const headerRow = ws.getRow(5);
    headerRow.values = ["NO", "NAMA ANGGOTA", "NIK", "SIMPANAN POKOK", "SIMPANAN WAJIB", "SIMPANAN SUKARELA", "TOTAL SIMPANAN"];
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };
    
    for (let i = 1; i <= 7; i++) {
      headerRow.getCell(i).border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    }

    let currentRow = 6;
    summaries.forEach((row, idx) => {
      const dataRow = ws.getRow(currentRow);
      dataRow.values = [
        idx + 1,
        row.member.name,
        row.member.nik,
        row.pokok,
        row.wajib,
        row.sukarela,
        row.total,
      ];
      
      dataRow.getCell(1).alignment = { horizontal: "center" };
      dataRow.getCell(3).numFmt = "@"; 
      
      for (let i = 1; i <= 7; i++) {
        const cell = dataRow.getCell(i);
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
        if (i >= 4) cell.numFmt = '_("Rp"* #,##0_);_("Rp"* (#,##0);_("Rp"* "-"_);_(@_)';
      }
      currentRow++;
    });

    const sumRow = ws.getRow(currentRow);
    ws.mergeCells(`A${currentRow}:C${currentRow}`);
    sumRow.getCell(1).value = "GRAND TOTAL";
    sumRow.getCell(1).font = { bold: true };
    sumRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };

    sumRow.getCell(4).value = grandTotal.pokok;
    sumRow.getCell(5).value = grandTotal.wajib;
    sumRow.getCell(6).value = grandTotal.sukarela;
    sumRow.getCell(7).value = grandTotal.total;

    sumRow.font = { bold: true };

    for (let i = 1; i <= 7; i++) {
      const cell = sumRow.getCell(i);
      cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
      if (i >= 4) cell.numFmt = '_("Rp"* #,##0_);_("Rp"* (#,##0);_("Rp"* "-"_);_(@_)';
    }

    currentRow += 3;
    ws.mergeCells(`A${currentRow}:G${currentRow}`);
    ws.getCell(`A${currentRow}`).value = `${settings.printLocation}, ${formattedDate}`;
    ws.getCell(`A${currentRow}`).font = { bold: true };
    ws.getCell(`A${currentRow}`).alignment = { horizontal: "center" };

    currentRow += 1;
    ws.mergeCells(`A${currentRow}:G${currentRow}`);
    ws.getCell(`A${currentRow}`).value = `Pengurus ${settings.cooperativeName}`;
    ws.getCell(`A${currentRow}`).font = { bold: true };
    ws.getCell(`A${currentRow}`).alignment = { horizontal: "center" };
    
    currentRow += 4;
    ws.getCell(`B${currentRow}`).value = "Ketua";
    ws.getCell(`B${currentRow}`).alignment = { horizontal: "center" };
    
    ws.getCell(`D${currentRow}`).value = "Sekertaris";
    ws.getCell(`D${currentRow}`).alignment = { horizontal: "center" };
    
    ws.getCell(`F${currentRow}`).value = "Bendahara";
    ws.getCell(`F${currentRow}`).alignment = { horizontal: "center" };

    currentRow += 5;
    ws.getCell(`B${currentRow}`).value = settings.chairmanName;
    ws.getCell(`B${currentRow}`).font = { bold: true };
    ws.getCell(`B${currentRow}`).alignment = { horizontal: "center" };
    
    ws.getCell(`D${currentRow}`).value = settings.secretaryName;
    ws.getCell(`D${currentRow}`).font = { bold: true };
    ws.getCell(`D${currentRow}`).alignment = { horizontal: "center" };
    
    ws.getCell(`F${currentRow}`).value = settings.treasurerName;
    ws.getCell(`F${currentRow}`).font = { bold: true };
    ws.getCell(`F${currentRow}`).alignment = { horizontal: "center" };

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `laporan_simpanan_kopdes_kedungsana_${selectedYear}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* ============================================================ */}
      {/* SCREEN VIEW                                                   */}
      {/* ============================================================ */}
      <section className="space-y-6 print:hidden">
        {/* Page Header */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              Laporan Rekap Simpanan Tahunan
            </h2>
            <p className="mt-1 text-xs text-slate-500 max-w-xl">
              Rekapitulasi akumulasi simpanan seluruh anggota aktif per tahun buku. Data ini merupakan dasar laporan pertanggungjawaban keuangan pada Rapat Anggota Tahunan (RAT).
            </p>
          </div>

          {/* Year Selector */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tahun Buku</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="appearance-none rounded-xl border border-slate-200 bg-white pl-3 pr-10 py-2 text-sm font-bold text-slate-700 shadow-sm focus:border-primary focus:outline-none cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
                backgroundPosition: `right 0.75rem center`,
                backgroundRepeat: `no-repeat`,
                backgroundSize: `1.5em 1.5em`
              }}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Grand Total Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Anggota Aktif", value: isLoading ? "-" : `${summaries.length} orang`, color: "blue" },
            { label: "Total Simpanan Pokok", value: isLoading ? "-" : formatCurrency(grandTotal.pokok), color: "indigo" },
            { label: "Total Simpanan Wajib", value: isLoading ? "-" : formatCurrency(grandTotal.wajib), color: "emerald" },
            { label: "Total Simpanan Sukarela", value: isLoading ? "-" : formatCurrency(grandTotal.sukarela), color: "amber" },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{card.label}</p>
              <p className="text-lg font-bold text-slate-800 mt-1 font-mono">{card.value}</p>
            </div>
          ))}
        </div>

        {/* Data Table */}
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Rekap Simpanan Anggota — Tahun Buku {selectedYear}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Diurutkan berdasarkan total simpanan tertinggi.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 px-3 py-1.5 text-xs font-semibold hover:bg-emerald-100 transition cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Ekspor Excel
              </button>
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-3 py-1.5 text-xs font-semibold hover:opacity-90 transition cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Cetak Laporan
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-sm text-slate-400">
              <div className="inline-block w-6 h-6 border-2 border-slate-200 border-t-primary rounded-full animate-spin mb-3"></div>
              <p>Memuat data laporan tahun {selectedYear}...</p>
            </div>
          ) : summaries.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-400">
              Tidak ada data simpanan anggota aktif untuk tahun {selectedYear}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">No</th>
                    <th className="px-4 py-3 text-left font-semibold">Nama Anggota</th>
                    <th className="px-4 py-3 text-left font-semibold">NIK</th>
                    <th className="px-4 py-3 text-right font-semibold">Simpanan Pokok</th>
                    <th className="px-4 py-3 text-right font-semibold">Simpanan Wajib</th>
                    <th className="px-4 py-3 text-right font-semibold">Simpanan Sukarela</th>
                    <th className="px-4 py-3 text-right font-semibold">Total Simpanan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {summaries.map((row, index) => (
                    <tr key={row.member.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-4 py-3 text-slate-400 font-mono text-xs">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary-soft flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                            {row.member.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-slate-800">{row.member.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-xs">{row.member.nik}</td>
                      <td className="px-4 py-3 text-right text-slate-700 font-mono">{formatCurrency(row.pokok)}</td>
                      <td className="px-4 py-3 text-right text-slate-700 font-mono">{formatCurrency(row.wajib)}</td>
                      <td className="px-4 py-3 text-right text-slate-700 font-mono">{formatCurrency(row.sukarela)}</td>
                      <td className="px-4 py-3 text-right font-bold text-primary font-mono">{formatCurrency(row.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 border-t-2 border-slate-200">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-xs font-extrabold text-slate-700 uppercase tracking-wider">Grand Total</td>
                    <td className="px-4 py-3 text-right font-extrabold text-slate-800 font-mono">{formatCurrency(grandTotal.pokok)}</td>
                    <td className="px-4 py-3 text-right font-extrabold text-slate-800 font-mono">{formatCurrency(grandTotal.wajib)}</td>
                    <td className="px-4 py-3 text-right font-extrabold text-slate-800 font-mono">{formatCurrency(grandTotal.sukarela)}</td>
                    <td className="px-4 py-3 text-right font-extrabold text-primary font-mono text-base">{formatCurrency(grandTotal.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/* PRINT-ONLY LAYOUT (@media print — RAT-Ready Document)        */}
      {/* ============================================================ */}
      <div className="hidden print:block p-8 font-serif text-slate-900 text-sm">
        {/* Official Letterhead */}
        <div className="text-center border-b-4 border-double border-slate-600 pb-5 mb-6">
          <h1 className="text-xl font-extrabold uppercase tracking-widest">{settings.cooperativeName.toUpperCase()}</h1>
          <p className="text-xs text-slate-500 mt-1">{settings.address}</p>
          <p className="text-xs text-slate-500">Badan Hukum No: {settings.legalNumber}</p>
          <h2 className="text-base font-bold uppercase mt-5 tracking-wider">
            LAPORAN PERTANGGUNGJAWABAN KEUANGAN SIMPANAN ANGGOTA
          </h2>
          <p className="text-sm font-semibold mt-1">Tahun Buku {selectedYear}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Dicetak di {settings.printLocation}, pada tanggal {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            {" | "}Diajukan pada Rapat Anggota Tahunan (RAT) {settings.cooperativeName}
          </p>
        </div>

        {/* Print Table */}
        <table className="w-full text-xs border-collapse mb-6">
          <thead>
            <tr className="bg-slate-100 border border-slate-400">
              <th className="border border-slate-400 px-2 py-1.5 text-left">No</th>
              <th className="border border-slate-400 px-2 py-1.5 text-left">Nama Anggota</th>
              <th className="border border-slate-400 px-2 py-1.5 text-left">NIK</th>
              <th className="border border-slate-400 px-2 py-1.5 text-right">Simp. Pokok</th>
              <th className="border border-slate-400 px-2 py-1.5 text-right">Simp. Wajib</th>
              <th className="border border-slate-400 px-2 py-1.5 text-right">Simp. Sukarela</th>
              <th className="border border-slate-400 px-2 py-1.5 text-right font-extrabold">Total</th>
            </tr>
          </thead>
          <tbody>
            {summaries.map((row, index) => (
              <tr key={row.member.id} className="border border-slate-300">
                <td className="border border-slate-300 px-2 py-1 text-center">{index + 1}</td>
                <td className="border border-slate-300 px-2 py-1 font-semibold">{row.member.name}</td>
                <td className="border border-slate-300 px-2 py-1 font-mono">{row.member.nik}</td>
                <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(row.pokok)}</td>
                <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(row.wajib)}</td>
                <td className="border border-slate-300 px-2 py-1 text-right">{formatCurrency(row.sukarela)}</td>
                <td className="border border-slate-300 px-2 py-1 text-right font-extrabold">{formatCurrency(row.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-200 border-2 border-slate-600 font-extrabold">
              <td colSpan={3} className="border border-slate-500 px-2 py-2 text-center uppercase">GRAND TOTAL</td>
              <td className="border border-slate-500 px-2 py-2 text-right">{formatCurrency(grandTotal.pokok)}</td>
              <td className="border border-slate-500 px-2 py-2 text-right">{formatCurrency(grandTotal.wajib)}</td>
              <td className="border border-slate-500 px-2 py-2 text-right">{formatCurrency(grandTotal.sukarela)}</td>
              <td className="border border-slate-500 px-2 py-2 text-right text-base">{formatCurrency(grandTotal.total)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Signature Section */}
        <p className="text-[10px] text-slate-500 italic mb-8">
          * Laporan ini disusun berdasarkan data simpanan anggota yang tercatat dalam sistem informasi {settings.cooperativeName}. Simpanan Pokok sebesar Rp 100.000 dihitung flat per anggota aktif.
        </p>

        <div className="flex justify-between text-center text-xs mt-16">
          <div className="w-1/3">
            <p className="text-slate-600">Dibuat oleh,</p>
            <p className="text-slate-600">Sekretaris Koperasi</p>
            <div className="h-16"></div>
            <p className="font-bold text-slate-900 border-t border-slate-400 pt-1 inline-block min-w-[100px]">{settings.secretaryName}</p>
          </div>
          <div className="w-1/3">
            <p className="text-slate-600">Mengetahui,</p>
            <p className="text-slate-600">Bendahara Koperasi</p>
            <div className="h-16"></div>
            <p className="font-bold text-slate-900 border-t border-slate-400 pt-1 inline-block min-w-[100px]">{settings.treasurerName}</p>
          </div>
          <div className="w-1/3">
            <p className="text-slate-600">Menyetujui,</p>
            <p className="text-slate-600">Ketua Koperasi</p>
            <div className="h-16"></div>
            <p className="font-bold text-slate-900 border-t border-slate-400 pt-1 inline-block min-w-[100px]">{settings.chairmanName}</p>
          </div>
        </div>
      </div>
    </>
  );
}
