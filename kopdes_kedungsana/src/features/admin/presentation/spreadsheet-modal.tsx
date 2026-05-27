"use client";

import { useMemo, useState } from "react";
import { addAuditLog } from "../../../utils/audit-logger";

type MemberRow = {
  memberId: string;
  memberName: string;
  savingPokok: number;
  savingWajib: number;
  savingSukarela: number;
  serviceContribution: number;
};

const initialRows: MemberRow[] = [
  { memberId: "m1", memberName: "OMAN NUROHMAN", savingPokok: 100000, savingWajib: 560000, savingSukarela: 169000, serviceContribution: 0 },
  { memberId: "m2", memberName: "NENI MULYANI", savingPokok: 100000, savingWajib: 830000, savingSukarela: 690000, serviceContribution: 340000 },
  { memberId: "m3", memberName: "HJ. DJEDJEH ZAKIAH", savingPokok: 100000, savingWajib: 830000, savingSukarela: 1323000, serviceContribution: 120000 },
  { memberId: "m4", memberName: "YUYU WAHYUDIN", savingPokok: 0, savingWajib: 0, savingSukarela: 0, serviceContribution: 0 },
  { memberId: "m5", memberName: "H. KARTAM", savingPokok: 0, savingWajib: 0, savingSukarela: 0, serviceContribution: 0 },
  { memberId: "m6", memberName: "ERUS RUSMIATI", savingPokok: 100000, savingWajib: 780000, savingSukarela: 1130000, serviceContribution: 640000 },
  { memberId: "m7", memberName: "SUSI ROSILAWATI", savingPokok: 100000, savingWajib: 800000, savingSukarela: 350000, serviceContribution: 0 },
  { memberId: "m8", memberName: "ASWETI", savingPokok: 100000, savingWajib: 330000, savingSukarela: 129000, serviceContribution: 0 },
  { memberId: "m9", memberName: "IKIT MASTIKA", savingPokok: 100000, savingWajib: 830000, savingSukarela: 110000, serviceContribution: 710000 },
  { memberId: "m10", memberName: "SUKMI", savingPokok: 100000, savingWajib: 800000, savingSukarela: 130000, serviceContribution: 270000 },
  { memberId: "m11", memberName: "LINDA ERLIA", savingPokok: 100000, savingWajib: 800000, savingSukarela: 320000, serviceContribution: 440000 },
  { memberId: "m12", memberName: "TITI SUGIARTI", savingPokok: 100000, savingWajib: 850000, savingSukarela: 600000, serviceContribution: 0 },
  { memberId: "m13", memberName: "KATRIN HALFALIA", savingPokok: 100000, savingWajib: 850000, savingSukarela: 1659000, serviceContribution: 628000 },
  { memberId: "m14", memberName: "TATI HARYATI", savingPokok: 100000, savingWajib: 900000, savingSukarela: 3320000, serviceContribution: 200000 },
  { memberId: "m15", memberName: "YATI KASYARTI", savingPokok: 0, savingWajib: 0, savingSukarela: 0, serviceContribution: 0 },
  { memberId: "m16", memberName: "TRIANI WIDIA NINGRUM", savingPokok: 100000, savingWajib: 500000, savingSukarela: 485000, serviceContribution: 660000 },
  { memberId: "m17", memberName: "SULASTRI", savingPokok: 0, savingWajib: 0, savingSukarela: 0, serviceContribution: 0 },
  { memberId: "m18", memberName: "SITI ROHMAH", savingPokok: 100000, savingWajib: 600000, savingSukarela: 496000, serviceContribution: 560000 },
  { memberId: "m19", memberName: "SUNARTI", savingPokok: 100000, savingWajib: 700000, savingSukarela: 638000, serviceContribution: 670000 },
  { memberId: "m20", memberName: "NENENG HERLINA", savingPokok: 100000, savingWajib: 600000, savingSukarela: 513000, serviceContribution: 440000 },
];

export default function SpreadsheetModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [rows, setRows] = useState<MemberRow[]>(initialRows);
  const [activeTab, setActiveTab] = useState<"shu" | "simpanan">("simpanan");
  const [searchQuery, setSearchQuery] = useState("");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  
  // Spreadsheet coordinate states
  const [selectedCell, setSelectedCell] = useState<{ rowIdx: number; colName: string } | null>({ rowIdx: 0, colName: "B" });
  const [editingCell, setEditingCell] = useState<{ rowIdx: number; colName: string } | null>(null);
  const [editValue, setEditValue] = useState("");

  const DANA_SHU_SIMPANAN = 3942359;
  const DANA_SHU_JASA = 790641;

  // Real-time globally computed bases
  const totalSimpananBasis = useMemo(() => {
    return rows.reduce((sum, r) => sum + r.savingPokok + r.savingWajib + r.savingSukarela, 0);
  }, [rows]);

  const totalJasaBasis = useMemo(() => {
    return rows.reduce((sum, r) => sum + r.serviceContribution, 0);
  }, [rows]);

  // Compute calculated metrics for each row in real-time
  const computedRows = useMemo(() => {
    return rows.map((row) => {
      const totalSaving = row.savingPokok + row.savingWajib + row.savingSukarela;
      
      const savingShu = totalSimpananBasis > 0 
        ? Math.round((totalSaving / totalSimpananBasis) * DANA_SHU_SIMPANAN) 
        : 0;
        
      const serviceShu = totalJasaBasis > 0 
        ? Math.round((row.serviceContribution / totalJasaBasis) * DANA_SHU_JASA) 
        : 0;
        
      const totalShu = savingShu + serviceShu;

      return {
        ...row,
        totalSaving,
        savingShu,
        serviceShu,
        totalShu,
      };
    });
  }, [rows, totalSimpananBasis, totalJasaBasis]);

  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return computedRows;
    return computedRows.filter((r) =>
      r.memberName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [computedRows, searchQuery]);

  // Get active cell value for the formula bar
  const activeCellValue = useMemo(() => {
    if (!selectedCell) return "";
    const row = computedRows[selectedCell.rowIdx];
    if (!row) return "";
    
    switch (selectedCell.colName) {
      case "B": return row.memberName;
      case "C": return activeTab === "shu" ? row.totalSaving.toString() : row.savingPokok.toString();
      case "D": return activeTab === "shu" ? row.serviceContribution.toString() : row.savingWajib.toString();
      case "E": return activeTab === "shu" ? row.savingShu.toString() : row.savingSukarela.toString();
      case "F": return activeTab === "shu" ? row.serviceShu.toString() : row.totalSaving.toString();
      case "G": return row.totalShu.toString();
      default: return "";
    }
  }, [selectedCell, computedRows, activeTab]);

  // Check if cell is write-protected (formulas are calculated automatically)
  const isCellCalculated = (colName: string) => {
    if (activeTab === "shu") {
      return ["C", "E", "F", "G"].includes(colName);
    } else {
      return ["F"].includes(colName);
    }
  };

  const handleCellClick = (rowIdx: number, colName: string) => {
    setSelectedCell({ rowIdx, colName });
    setEditingCell(null);
  };

  const handleCellDoubleClick = (rowIdx: number, colName: string) => {
    if (isCellCalculated(colName)) return; 
    setSelectedCell({ rowIdx, colName });
    setEditingCell({ rowIdx, colName });
    const row = rows[rowIdx];
    let val = "";
    switch (colName) {
      case "B": val = row.memberName; break;
      case "C": val = activeTab === "shu" ? "" : row.savingPokok.toString(); break;
      case "D": val = activeTab === "shu" ? row.serviceContribution.toString() : row.savingWajib.toString(); break;
      case "E": val = activeTab === "shu" ? "" : row.savingSukarela.toString(); break;
      default: val = "";
    }
    setEditValue(val);
  };

  const handleSaveCell = (rowIdx: number, colName: string, value: string) => {
    setEditingCell(null);
    const row = rows[rowIdx];
    let columnNameText = "";
    let oldValueText = "";
    let newValueText = value;

    if (colName === "B") {
      columnNameText = "Nama Anggota";
      oldValueText = row.memberName;
      newValueText = value.toUpperCase();
    } else {
      const num = Math.max(0, parseInt(value.replace(/\D/g, "")) || 0);
      if (activeTab === "shu") {
        if (colName === "D") {
          columnNameText = "Setoran Jasa";
          oldValueText = `Rp ${row.serviceContribution.toLocaleString("id-ID")}`;
          newValueText = `Rp ${num.toLocaleString("id-ID")}`;
        }
      } else {
        if (colName === "C") {
          columnNameText = "Simpanan Pokok";
          oldValueText = `Rp ${row.savingPokok.toLocaleString("id-ID")}`;
          newValueText = `Rp ${num.toLocaleString("id-ID")}`;
        }
        if (colName === "D") {
          columnNameText = "Simpanan Wajib";
          oldValueText = `Rp ${row.savingWajib.toLocaleString("id-ID")}`;
          newValueText = `Rp ${num.toLocaleString("id-ID")}`;
        }
        if (colName === "E") {
          columnNameText = "Simpanan Sukarela";
          oldValueText = `Rp ${row.savingSukarela.toLocaleString("id-ID")}`;
          newValueText = `Rp ${num.toLocaleString("id-ID")}`;
        }
      }
    }

    if (columnNameText && oldValueText !== newValueText) {
      addAuditLog(
        "SPREADSHEET_EDIT",
        `Mengubah sel baris ke-${rowIdx + 1} (${row.memberName}) kolom [${columnNameText}] dari [${oldValueText}] menjadi [${newValueText}] via Spreadsheet Live Editor.`,
        "info"
      );
    }

    setRows((prev) => {
      const updated = [...prev];
      const target = { ...updated[rowIdx] };
      
      if (colName === "B") {
        target.memberName = value.toUpperCase();
      } else {
        const num = Math.max(0, parseInt(value.replace(/\D/g, "")) || 0);
        if (activeTab === "shu") {
          if (colName === "D") target.serviceContribution = num;
        } else {
          if (colName === "C") target.savingPokok = num;
          if (colName === "D") target.savingWajib = num;
          if (colName === "E") target.savingSukarela = num;
        }
      }
      
      updated[rowIdx] = target;
      return updated;
    });
  };

  const handleFormulaBarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedCell || isCellCalculated(selectedCell.colName)) return;
    const { rowIdx, colName } = selectedCell;
    handleSaveCell(rowIdx, colName, e.target.value);
  };

  const handleAddRow = () => {
    const newId = `m${rows.length + 1}`;
    const newName = "NEW MEMBER " + (rows.length + 1);
    addAuditLog(
      "SPREADSHEET_EDIT",
      `Menambahkan baris anggota baru [${newName}] dengan ID ${newId} di Spreadsheet Live.`,
      "success"
    );
    setRows((prev) => [
      ...prev,
      {
        memberId: newId,
        memberName: newName,
        savingPokok: 100000,
        savingWajib: 0,
        savingSukarela: 0,
        serviceContribution: 0,
      },
    ]);
  };

  const handleResetData = () => {
    if (confirm("Apakah Anda yakin ingin menyetel ulang data ke data awal?")) {
      addAuditLog(
        "RESET_DATA",
        "Mereset seluruh modifikasi data spreadsheet kembali ke data awal bawaan pabrik!",
        "danger"
      );
      setRows(initialRows);
      setSelectedCell({ rowIdx: 0, colName: "B" });
      setEditingCell(null);
    }
  };

  const downloadExcel = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getShuHtml = () => {
    const year = "2024";
    const coopName = "KOPERASI DESA MERAH PUTIH KEDUNGSANA";
    return `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          .title { font-size: 14pt; font-weight: bold; text-align: center; }
          .subtitle { font-size: 12pt; font-weight: bold; text-align: center; }
          table { border-collapse: collapse; width: 100%; }
          th { border: 1px solid black; background-color: #f2f2f2; font-weight: bold; padding: 5px; text-align: center; }
          td { border: 1px solid black; padding: 4px; }
          .num { text-align: right; }
          .center { text-align: center; }
        </style>
      </head>
      <body>
        <div class="title">DAFTAR PEMBAGIAN SHU (SPREADSHEET LIVE)</div>
        <div class="subtitle">${coopName}</div>
        <br/>
        <table>
          <thead>
            <tr>
              <th>NO</th>
              <th>NAMA ANGGOTA</th>
              <th>JML SIMPANAN</th>
              <th>SETORAN JASA</th>
              <th>SHU SIMPANAN</th>
              <th>SHU JASA</th>
              <th>JUMLAH SHU</th>
            </tr>
          </thead>
          <tbody>
            ${computedRows.map((row, index) => `
              <tr>
                <td class="center">${index + 1}</td>
                <td>${row.memberName}</td>
                <td class="num">Rp ${row.totalSaving.toLocaleString("id-ID")}</td>
                <td class="num">Rp ${row.serviceContribution.toLocaleString("id-ID")}</td>
                <td class="num">Rp ${row.savingShu.toLocaleString("id-ID")}</td>
                <td class="num">Rp ${row.serviceShu.toLocaleString("id-ID")}</td>
                <td class="num" style="font-weight: bold;">Rp ${row.totalShu.toLocaleString("id-ID")}</td>
              </tr>
            `).join("")}
            <tr style="font-weight: bold; background-color: #e2e8f0;">
              <td colspan="2" class="center">JUMLAH</td>
              <td class="num">Rp ${computedRows.reduce((a, b) => a + b.totalSaving, 0).toLocaleString("id-ID")}</td>
              <td class="num">Rp ${computedRows.reduce((a, b) => a + b.serviceContribution, 0).toLocaleString("id-ID")}</td>
              <td class="num">Rp ${computedRows.reduce((a, b) => a + b.savingShu, 0).toLocaleString("id-ID")}</td>
              <td class="num">Rp ${computedRows.reduce((a, b) => a + b.serviceShu, 0).toLocaleString("id-ID")}</td>
              <td class="num">Rp ${computedRows.reduce((a, b) => a + b.totalShu, 0).toLocaleString("id-ID")}</td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;
  };

  const getSimpananHtml = () => {
    const year = "2024";
    return `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          .title { font-size: 14pt; font-weight: bold; text-align: center; }
          table { border-collapse: collapse; width: 100%; }
          th { border: 1px solid black; background-color: #f2f2f2; padding: 5px; }
          td { border: 1px solid black; padding: 4px; }
          .num { text-align: right; }
          .center { text-align: center; }
        </style>
      </head>
      <body>
        <div class="title">DAFTAR SIMPANAN ANGGOTA (SPREADSHEET LIVE)</div>
        <br/>
        <table>
          <thead>
            <tr>
              <th rowspan="2">NO</th>
              <th rowspan="2">NAMA ANGGOTA</th>
              <th colspan="3">SIMPANAN</th>
              <th rowspan="2">JUMLAH</th>
            </tr>
            <tr>
              <th>POKOK</th>
              <th>WAJIB</th>
              <th>SUKARELA</th>
            </tr>
          </thead>
          <tbody>
            ${computedRows.map((row, index) => `
              <tr>
                <td class="center">${index + 1}</td>
                <td>${row.memberName}</td>
                <td class="num">Rp ${row.savingPokok.toLocaleString("id-ID")}</td>
                <td class="num">Rp ${row.savingWajib.toLocaleString("id-ID")}</td>
                <td class="num">Rp ${row.savingSukarela.toLocaleString("id-ID")}</td>
                <td class="num" style="font-weight: bold;">Rp ${row.totalSaving.toLocaleString("id-ID")}</td>
              </tr>
            `).join("")}
            <tr style="font-weight: bold; background-color: #e2e8f0;">
              <td colspan="2" class="center">JUMLAH</td>
              <td class="num">Rp ${computedRows.reduce((a, b) => a + b.savingPokok, 0).toLocaleString("id-ID")}</td>
              <td class="num">Rp ${computedRows.reduce((a, b) => a + b.savingWajib, 0).toLocaleString("id-ID")}</td>
              <td class="num">Rp ${computedRows.reduce((a, b) => a + b.savingSukarela, 0).toLocaleString("id-ID")}</td>
              <td class="num">Rp ${computedRows.reduce((a, b) => a + b.totalSaving, 0).toLocaleString("id-ID")}</td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;
  };

  const handleExportSimpananOnly = () => {
    addAuditLog("EXPORT_EXCEL", "Mengekspor data Spreadsheet Simpanan Live ke berkas Excel (.xls).", "info");
    downloadExcel(getSimpananHtml(), "SPREADSHEET_SIMPANAN_2024.xls");
    setIsExportModalOpen(false);
  };

  const handleExportShuOnly = () => {
    addAuditLog("EXPORT_EXCEL", "Mengekspor data Spreadsheet SHU Live ke berkas Excel (.xls).", "info");
    downloadExcel(getShuHtml(), "SPREADSHEET_SHU_2024.xls");
    setIsExportModalOpen(false);
  };

  const handleExportAll = () => {
    addAuditLog("EXPORT_EXCEL", "Mengekspor seluruh lembar kerja Spreadsheet Live (Simpanan & SHU) ke berkas Excel (.xls).", "info");
    downloadExcel(getSimpananHtml(), "SPREADSHEET_SIMPANAN_2024.xls");
    setTimeout(() => {
      downloadExcel(getShuHtml(), "SPREADSHEET_SHU_2024.xls");
    }, 400);
    setIsExportModalOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 transition-all animate-in fade-in duration-150">
      <div className="bg-white w-[98vw] h-[96vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* EXCEL TOP RIBBON / TOOLBAR */}
        <div className="bg-[#107c41] text-white p-4 flex flex-wrap items-center justify-between gap-3 shadow-md relative z-10">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-1.5 rounded-lg">
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2M9 17H7v-2h2v2m0-4H7v-2h2v2m0-4H7V7h2v2m4 8h-2v-2h2v2m0-4h-2v-2h2v2m0-4h-2V7h2v2m4 8h-2v-2h2v2m0-4h-2v-2h2v2m0-4h-2V7h2v2" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide">Kopdes Excel Live</h2>
              <p className="text-[10px] text-white/80">Interactive RAT Spreadsheet Popup Dialog</p>
            </div>
          </div>

          {/* Toolbar Tabs & Actions */}
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-1 rounded-xl flex gap-1">
              <button
                onClick={() => {
                  setActiveTab("simpanan");
                  setSelectedCell({ rowIdx: 0, colName: "B" });
                  setEditingCell(null);
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === "simpanan" ? "bg-white text-[#107c41] shadow-sm" : "hover:bg-white/15"
                }`}
              >
                Sheet 1: Simpanan
              </button>
              <button
                onClick={() => {
                  setActiveTab("shu");
                  setSelectedCell({ rowIdx: 0, colName: "B" });
                  setEditingCell(null);
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === "shu" ? "bg-white text-[#107c41] shadow-sm" : "hover:bg-white/15"
                }`}
              >
                Sheet 2: Daftar SHU
              </button>
            </div>

            <button
              onClick={handleAddRow}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-semibold transition"
            >
              + Tambah Baris
            </button>

            <button
              onClick={handleResetData}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-semibold transition"
            >
              Reset
            </button>

            <button
              onClick={() => setIsExportModalOpen(true)}
              className="px-3.5 py-1.5 bg-[#1f9a55] hover:bg-[#25b565] border border-white/20 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Sheet (.xls)
            </button>

            <div className="border-l border-white/20 h-6 mx-1"></div>

            <button
              onClick={onClose}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs transition flex items-center gap-1"
            >
              Tutup [x]
            </button>
          </div>
        </div>

        {/* FORMULA BAR & SEARCH BAR */}
        <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded border border-slate-200 text-xs font-mono font-bold text-slate-500 w-16 justify-center">
            {selectedCell ? `${selectedCell.colName}${selectedCell.rowIdx + 1}` : "--"}
          </div>
          <div className="text-slate-400 font-mono text-sm italic font-semibold select-none w-5">fx</div>
          <input
            type="text"
            value={activeCellValue}
            disabled={!selectedCell || isCellCalculated(selectedCell.colName)}
            onChange={handleFormulaBarChange}
            placeholder={
              selectedCell 
                ? isCellCalculated(selectedCell.colName)
                  ? `Formula Terkunci: ${selectedCell.colName}${selectedCell.rowIdx + 1} dihitung otomatis`
                  : "Tulis teks atau masukkan angka..."
                : "Pilih sel untuk mengedit..."
            }
            className="flex-1 bg-slate-50 border border-slate-200 px-3 py-1 rounded text-xs outline-none focus:bg-white focus:border-green-600 transition font-mono disabled:opacity-75 disabled:cursor-not-allowed"
          />
          <div className="relative w-48 sm:w-64">
            <input
              type="text"
              placeholder="Cari anggota..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 pl-8 pr-3 py-1 rounded text-xs outline-none focus:bg-white focus:border-green-600 transition"
            />
            <svg className="absolute left-2.5 top-1.5 h-3.5 w-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* SPREADSHEET INTERACTIVE GRID */}
        <div className="flex-1 overflow-auto bg-slate-200/50">
          <table className="border-collapse table-fixed w-full min-w-[800px] text-xs font-mono select-none">
            
            {/* HEADER ROW A, B, C, D... */}
            <thead className="sticky top-0 bg-slate-100 shadow-sm z-10">
              <tr>
                <th className="w-10 border border-slate-300 bg-slate-100 text-center font-bold text-slate-500 py-1 border-t-0 border-l-0"></th>
                <th className="w-12 border border-slate-300 bg-slate-100 text-center font-bold text-slate-500 py-1">A</th>
                <th className="w-64 border border-slate-300 bg-slate-100 text-center font-bold text-slate-500 py-1">B</th>
                <th className="w-40 border border-slate-300 bg-slate-100 text-center font-bold text-slate-500 py-1">C</th>
                <th className="w-40 border border-slate-300 bg-slate-100 text-center font-bold text-slate-500 py-1">D</th>
                <th className="w-40 border border-slate-300 bg-slate-100 text-center font-bold text-slate-500 py-1">E</th>
                <th className="w-40 border border-slate-300 bg-slate-100 text-center font-bold text-slate-500 py-1">F</th>
                {activeTab === "shu" && (
                  <th className="w-40 border border-slate-300 bg-slate-100 text-center font-bold text-slate-500 py-1">G</th>
                )}
              </tr>
              <tr>
                <th className="border border-slate-300 bg-slate-50 text-center text-slate-400 py-0.5 border-l-0"></th>
                <th className="border border-slate-300 bg-slate-50 text-slate-400 text-center py-0.5 font-normal">NO</th>
                <th className="border border-slate-300 bg-slate-50 text-slate-400 text-left px-2 py-0.5 font-normal">NAMA ANGGOTA</th>
                {activeTab === "shu" ? (
                  <>
                    <th className="border border-slate-300 bg-slate-50 text-slate-400 text-right px-2 py-0.5 font-normal">TOTAL SIMPANAN</th>
                    <th className="border border-slate-300 bg-slate-50 text-slate-400 text-right px-2 py-0.5 font-normal">STORAN JASA</th>
                    <th className="border border-slate-300 bg-slate-50 text-slate-400 text-right px-2 py-0.5 font-normal">SHU SIMPANAN</th>
                    <th className="border border-slate-300 bg-slate-50 text-slate-400 text-right px-2 py-0.5 font-normal">SHU JASA</th>
                    <th className="border border-slate-300 bg-slate-50 text-slate-400 text-right px-2 py-0.5 font-normal">TOTAL SHU</th>
                  </>
                ) : (
                  <>
                    <th className="border border-slate-300 bg-slate-50 text-slate-400 text-right px-2 py-0.5 font-normal">POKOK</th>
                    <th className="border border-slate-300 bg-slate-50 text-slate-400 text-right px-2 py-0.5 font-normal">WAJIB</th>
                    <th className="border border-slate-300 bg-slate-50 text-slate-400 text-right px-2 py-0.5 font-normal">SUKARELA</th>
                    <th className="border border-slate-300 bg-slate-50 text-slate-400 text-right px-2 py-0.5 font-normal">JUMLAH</th>
                  </>
                )}
              </tr>
            </thead>

            {/* GRID CELLS */}
            <tbody className="bg-white">
              {filteredRows.map((row, index) => {
                const actualRowIdx = rows.findIndex((r) => r.memberId === row.memberId);
                
                return (
                  <tr key={row.memberId} className="hover:bg-slate-50/40">
                    {/* Row Index Indicator */}
                    <td className="border border-slate-200 bg-slate-100 text-center font-bold text-slate-500 py-1 select-none sticky left-0 z-[2]">
                      {actualRowIdx + 1}
                    </td>
                    
                    {/* Column A: NO (Formula) */}
                    <td className="border border-slate-200 text-center text-slate-400 bg-slate-50/50 py-1">
                      {actualRowIdx + 1}
                    </td>

                    {/* Column B: Member Name */}
                    <td
                      onClick={() => handleCellClick(actualRowIdx, "B")}
                      onDoubleClick={() => handleCellDoubleClick(actualRowIdx, "B")}
                      className={`border px-2 py-1 truncate relative ${
                        selectedCell?.rowIdx === actualRowIdx && selectedCell?.colName === "B"
                          ? "ring-2 ring-green-600 z-[1]"
                          : "border-slate-200"
                      }`}
                    >
                      {editingCell?.rowIdx === actualRowIdx && editingCell?.colName === "B" ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleSaveCell(actualRowIdx, "B", editValue)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveCell(actualRowIdx, "B", editValue);
                            if (e.key === "Escape") setEditingCell(null);
                          }}
                          autoFocus
                          className="absolute inset-0 w-full h-full px-2 py-1 text-xs outline-none bg-white text-slate-900 border-none"
                        />
                      ) : (
                        row.memberName
                      )}
                    </td>

                    {activeTab === "shu" ? (
                      <>
                        {/* Column C: Total Savings (Formula) */}
                        <td
                          onClick={() => handleCellClick(actualRowIdx, "C")}
                          className={`border px-2 py-1 text-right bg-slate-50/50 font-semibold text-slate-600 relative ${
                            selectedCell?.rowIdx === actualRowIdx && selectedCell?.colName === "C"
                              ? "ring-2 ring-green-600 z-[1]"
                              : "border-slate-200"
                          }`}
                        >
                          Rp {row.totalSaving.toLocaleString("id-ID")}
                        </td>

                        {/* Column D: Service Contribution */}
                        <td
                          onClick={() => handleCellClick(actualRowIdx, "D")}
                          onDoubleClick={() => handleCellDoubleClick(actualRowIdx, "D")}
                          className={`border px-2 py-1 text-right relative ${
                            selectedCell?.rowIdx === actualRowIdx && selectedCell?.colName === "D"
                              ? "ring-2 ring-green-600 z-[1]"
                              : "border-slate-200"
                          }`}
                        >
                          {editingCell?.rowIdx === actualRowIdx && editingCell?.colName === "D" ? (
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => handleSaveCell(actualRowIdx, "D", editValue)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveCell(actualRowIdx, "D", editValue);
                                if (e.key === "Escape") setEditingCell(null);
                              }}
                              autoFocus
                              className="absolute inset-0 w-full h-full px-2 py-1 text-right text-xs outline-none bg-white text-slate-900 border-none"
                            />
                          ) : (
                            `Rp ${row.serviceContribution.toLocaleString("id-ID")}`
                          )}
                        </td>

                        {/* Column E: SHU Simpanan (Formula) */}
                        <td
                          onClick={() => handleCellClick(actualRowIdx, "E")}
                          className={`border px-2 py-1 text-right bg-slate-50/50 text-slate-700 relative ${
                            selectedCell?.rowIdx === actualRowIdx && selectedCell?.colName === "E"
                              ? "ring-2 ring-green-600 z-[1]"
                              : "border-slate-200"
                          }`}
                        >
                          Rp {row.savingShu.toLocaleString("id-ID")}
                        </td>

                        {/* Column F: SHU Jasa (Formula) */}
                        <td
                          onClick={() => handleCellClick(actualRowIdx, "F")}
                          className={`border px-2 py-1 text-right bg-slate-50/50 text-slate-700 relative ${
                            selectedCell?.rowIdx === actualRowIdx && selectedCell?.colName === "F"
                              ? "ring-2 ring-green-600 z-[1]"
                              : "border-slate-200"
                          }`}
                        >
                          Rp {row.serviceShu.toLocaleString("id-ID")}
                        </td>

                        {/* Column G: Total SHU (Formula) */}
                        <td
                          onClick={() => handleCellClick(actualRowIdx, "G")}
                          className={`border px-2 py-1 text-right bg-green-50/30 text-green-700 font-bold relative ${
                            selectedCell?.rowIdx === actualRowIdx && selectedCell?.colName === "G"
                              ? "ring-2 ring-green-600 z-[1]"
                              : "border-slate-200"
                          }`}
                        >
                          Rp {row.totalShu.toLocaleString("id-ID")}
                        </td>
                      </>
                    ) : (
                      <>
                        {/* Column C: Pokok */}
                        <td
                          onClick={() => handleCellClick(actualRowIdx, "C")}
                          onDoubleClick={() => handleCellDoubleClick(actualRowIdx, "C")}
                          className={`border px-2 py-1 text-right relative ${
                            selectedCell?.rowIdx === actualRowIdx && selectedCell?.colName === "C"
                              ? "ring-2 ring-green-600 z-[1]"
                              : "border-slate-200"
                          }`}
                        >
                          {editingCell?.rowIdx === actualRowIdx && editingCell?.colName === "C" ? (
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => handleSaveCell(actualRowIdx, "C", editValue)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveCell(actualRowIdx, "C", editValue);
                                if (e.key === "Escape") setEditingCell(null);
                              }}
                              autoFocus
                              className="absolute inset-0 w-full h-full px-2 py-1 text-right text-xs outline-none bg-white text-slate-900 border-none"
                            />
                          ) : (
                            `Rp ${row.savingPokok.toLocaleString("id-ID")}`
                          )}
                        </td>

                        {/* Column D: Wajib */}
                        <td
                          onClick={() => handleCellClick(actualRowIdx, "D")}
                          onDoubleClick={() => handleCellDoubleClick(actualRowIdx, "D")}
                          className={`border px-2 py-1 text-right relative ${
                            selectedCell?.rowIdx === actualRowIdx && selectedCell?.colName === "D"
                              ? "ring-2 ring-green-600 z-[1]"
                              : "border-slate-200"
                          }`}
                        >
                          {editingCell?.rowIdx === actualRowIdx && editingCell?.colName === "D" ? (
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => handleSaveCell(actualRowIdx, "D", editValue)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveCell(actualRowIdx, "D", editValue);
                                if (e.key === "Escape") setEditingCell(null);
                              }}
                              autoFocus
                              className="absolute inset-0 w-full h-full px-2 py-1 text-right text-xs outline-none bg-white text-slate-900 border-none"
                            />
                          ) : (
                            `Rp ${row.savingWajib.toLocaleString("id-ID")}`
                          )}
                        </td>

                        {/* Column E: Sukarela */}
                        <td
                          onClick={() => handleCellClick(actualRowIdx, "E")}
                          onDoubleClick={() => handleCellDoubleClick(actualRowIdx, "E")}
                          className={`border px-2 py-1 text-right relative ${
                            selectedCell?.rowIdx === actualRowIdx && selectedCell?.colName === "E"
                              ? "ring-2 ring-green-600 z-[1]"
                              : "border-slate-200"
                          }`}
                        >
                          {editingCell?.rowIdx === actualRowIdx && editingCell?.colName === "E" ? (
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={() => handleSaveCell(actualRowIdx, "E", editValue)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveCell(actualRowIdx, "E", editValue);
                                if (e.key === "Escape") setEditingCell(null);
                              }}
                              autoFocus
                              className="absolute inset-0 w-full h-full px-2 py-1 text-right text-xs outline-none bg-white text-slate-900 border-none"
                            />
                          ) : (
                            `Rp ${row.savingSukarela.toLocaleString("id-ID")}`
                          )}
                        </td>

                        {/* Column F: Total Saving (Formula) */}
                        <td
                          onClick={() => handleCellClick(actualRowIdx, "F")}
                          className={`border px-2 py-1 text-right bg-green-50/20 text-green-700 font-bold relative ${
                            selectedCell?.rowIdx === actualRowIdx && selectedCell?.colName === "F"
                              ? "ring-2 ring-green-600 z-[1]"
                              : "border-slate-200"
                          }`}
                        >
                          Rp {row.totalSaving.toLocaleString("id-ID")}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}

              {/* LIVE EXCEL TOTALS SUM / FORMULA ROW */}
              <tr className="bg-slate-100 font-bold border-t-2 border-slate-300">
                <td className="border border-slate-300 bg-slate-200 text-center text-slate-600 py-1 select-none">
                  ∑
                </td>
                <td className="border border-slate-300 text-center text-slate-400 py-1">
                  -
                </td>
                <td className="border border-slate-300 text-left px-2 py-1 text-slate-700">
                  JUMLAH (SUM TOTAL)
                </td>
                {activeTab === "shu" ? (
                  <>
                    <td className="border border-slate-300 text-right px-2 py-1 text-slate-800">
                      Rp {computedRows.reduce((a, b) => a + b.totalSaving, 0).toLocaleString("id-ID")}
                    </td>
                    <td className="border border-slate-300 text-right px-2 py-1 text-slate-800">
                      Rp {computedRows.reduce((a, b) => a + b.serviceContribution, 0).toLocaleString("id-ID")}
                    </td>
                    <td className="border border-slate-300 text-right px-2 py-1 text-slate-800">
                      Rp {computedRows.reduce((a, b) => a + b.savingShu, 0).toLocaleString("id-ID")}
                    </td>
                    <td className="border border-slate-300 text-right px-2 py-1 text-slate-800">
                      Rp {computedRows.reduce((a, b) => a + b.serviceShu, 0).toLocaleString("id-ID")}
                    </td>
                    <td className="border border-slate-300 text-right px-2 py-1 text-green-700 bg-green-100/50">
                      Rp {computedRows.reduce((a, b) => a + b.totalShu, 0).toLocaleString("id-ID")}
                    </td>
                  </>
                ) : (
                  <>
                    <td className="border border-slate-300 text-right px-2 py-1 text-slate-800">
                      Rp {computedRows.reduce((a, b) => a + b.savingPokok, 0).toLocaleString("id-ID")}
                    </td>
                    <td className="border border-slate-300 text-right px-2 py-1 text-slate-800">
                      Rp {computedRows.reduce((a, b) => a + b.savingWajib, 0).toLocaleString("id-ID")}
                    </td>
                    <td className="border border-slate-300 text-right px-2 py-1 text-slate-800">
                      Rp {computedRows.reduce((a, b) => a + b.savingSukarela, 0).toLocaleString("id-ID")}
                    </td>
                    <td className="border border-slate-300 text-right px-2 py-1 text-green-700 bg-green-100/50">
                      Rp {computedRows.reduce((a, b) => a + b.totalSaving, 0).toLocaleString("id-ID")}
                    </td>
                  </>
                )}
              </tr>
            </tbody>
          </table>
        </div>

        {/* SPREADSHEET BOTTOM STATUS BAR */}
        <div className="bg-[#107c41] text-white px-4 py-1.5 flex items-center justify-between text-[11px] shadow-inner select-none">
          <div className="flex items-center gap-3">
            <span className="font-semibold uppercase tracking-wider bg-white/15 px-2 py-0.5 rounded">READY</span>
            <span>Status: Recalculations Online</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="opacity-75">Baris Terdaftar:</span>
              <span className="font-bold">{rows.length}</span>
            </div>
            <div className="border-l border-white/20 h-3"></div>
            <div className="flex items-center gap-3 font-mono">
              <div>
                <span className="opacity-75">SUM: </span>
                <span className="font-bold">
                  {activeTab === "shu" 
                    ? `Rp ${computedRows.reduce((a, b) => a + b.totalShu, 0).toLocaleString("id-ID")}`
                    : `Rp ${computedRows.reduce((a, b) => a + b.totalSaving, 0).toLocaleString("id-ID")}`}
                </span>
              </div>
              <div>
                <span className="opacity-75">AVERAGE: </span>
                <span className="font-bold">
                  {activeTab === "shu"
                    ? `Rp ${Math.round(computedRows.reduce((a, b) => a + b.totalShu, 0) / rows.length).toLocaleString("id-ID")}`
                    : `Rp ${Math.round(computedRows.reduce((a, b) => a + b.totalSaving, 0) / rows.length).toLocaleString("id-ID")}`}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* EXPORT OPTIONS MODAL */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 transition-opacity">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-[#107c41] text-white px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <h3 className="font-bold text-base">Ekspor Laporan (.xls)</h3>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="text-white/80 hover:text-white hover:bg-white/10 p-1 rounded-lg transition"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <p className="text-slate-500 text-xs sm:text-sm">
                Pilih cakupan data laporan yang ingin Anda unduh sebagai file spreadsheet Excel (`.xls`):
              </p>

              {/* Option 1: Export ALL */}
              <button
                onClick={handleExportAll}
                className="w-full text-left p-4 rounded-2xl border border-slate-200 hover:border-green-600 hover:bg-green-50/30 transition-all flex items-start gap-3.5 group"
              >
                <div className="bg-green-100 text-green-700 p-2 rounded-xl group-hover:scale-105 transition-transform mt-0.5">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 text-sm group-hover:text-green-700 transition-colors">
                    Ekspor Semua Laporan (Bundel RAT)
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Mendownload Laporan Simpanan & Laporan SHU sekaligus dalam file terpisah.
                  </p>
                </div>
              </button>

              {/* Option 2: Export Simpanan Only */}
              <button
                onClick={handleExportSimpananOnly}
                className="w-full text-left p-4 rounded-2xl border border-slate-200 hover:border-green-600 hover:bg-green-50/30 transition-all flex items-start gap-3.5 group"
              >
                <div className="bg-slate-100 text-slate-700 p-2 rounded-xl group-hover:scale-105 transition-transform mt-0.5">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 text-sm group-hover:text-green-700 transition-colors">
                    Ekspor Laporan Simpanan Saja
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Hanya mendownload Sheet 1 (Laporan Simpanan Pokok, Wajib, Sukarela).
                  </p>
                </div>
              </button>

              {/* Option 3: Export SHU Only */}
              <button
                onClick={handleExportShuOnly}
                className="w-full text-left p-4 rounded-2xl border border-slate-200 hover:border-green-600 hover:bg-green-50/30 transition-all flex items-start gap-3.5 group"
              >
                <div className="bg-slate-100 text-slate-700 p-2 rounded-xl group-hover:scale-105 transition-transform mt-0.5">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 text-sm group-hover:text-green-700 transition-colors">
                    Ekspor Laporan SHU Saja
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Hanya mendownload Sheet 2 (Laporan Hasil Usaha pembagian Jasa & Simpanan).
                  </p>
                </div>
              </button>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 flex justify-end">
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-100 text-xs sm:text-sm font-semibold text-slate-700 transition"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
