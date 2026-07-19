"use client";

import ExcelJS from "exceljs";
import { useMemo, useState } from "react";
import { addAuditLog } from "../../../utils/audit-logger";

type MemberRow = {
  memberId: string;
  memberName: string;
  joinDate: string;
  savingPokok: number;
  savingWajib: number;
  savingSukarela: number;
  serviceContribution: number;
};

import { useEffect } from "react";
import { memberDependencies } from "../../member/infrastructure/member-dependencies";
import { loadSettingsAsync, defaultSettings } from "@/src/actions/settings-actions";
import type { KopdesSettings } from "@/src/features/settings/domain/settings";

const formatRelativeDate = (dateStr: string): string => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  const now = new Date();
  
  if (now < date) return dateStr;
  
  let years = now.getFullYear() - date.getFullYear();
  let months = now.getMonth() - date.getMonth();
  let days = now.getDate() - date.getDate();
  
  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }
  
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  
  const parts: string[] = [];
  if (years > 0) {
    parts.push(`${years} thn`);
    if (months > 0) {
      parts.push(`${months} bln`);
    }
  } else if (months > 0) {
    parts.push(`${months} bln`);
    if (days > 0) {
      parts.push(`${days} hari`);
    }
  } else {
    parts.push(`${days} hari`);
  }
  
  return parts.join(", ");
};

export default function SpreadsheetModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [rows, setRows] = useState<MemberRow[]>([]);
  const [originalRows, setOriginalRows] = useState<MemberRow[]>([]);
  const [activeTab, setActiveTab] = useState<"shu" | "simpanan">("simpanan");
  const [searchQuery, setSearchQuery] = useState("");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<KopdesSettings>(defaultSettings);

  useEffect(() => {
    if (!isOpen) return;
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [members, fetchedSettings] = await Promise.all([
          memberDependencies.getMembersUseCase.execute(),
          loadSettingsAsync()
        ]);
        setSettings(fetchedSettings);
        
        const records: MemberRow[] = [];
        
        for (const member of members) {
          if (member.status !== "aktif") continue;

          const savings = await memberDependencies.getMemberMonthlySavingsUseCase.execute(member.id);
          
          let savingPokok = 0;
          let savingWajib = 0;
          let savingSukarela = 0;
          
          for (const s of savings) {
            if (s.period === "POKOK") {
              savingPokok += s.requiredSaving;
            } else {
              savingWajib += s.requiredSaving;
              savingSukarela += s.voluntarySaving;
            }
          }
          
          records.push({
            memberId: member.id,
            memberName: member.name.toUpperCase(),
            joinDate: member.joinDate,
            savingPokok,
            savingWajib,
            savingSukarela,
            serviceContribution: 0,
          });
        }
        
        setRows(records);
        setOriginalRows([...records]);
      } catch (e) {
        console.error("Failed to load Spreadsheet Live data", e);
      } finally {
        setIsLoading(false);
      }
    };
    
    void fetchData();
  }, [isOpen]);
  
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
      case "C": return `${row.joinDate} (${formatRelativeDate(row.joinDate)})`;
      case "D": return activeTab === "shu" ? row.totalSaving.toString() : row.savingPokok.toString();
      case "E": return activeTab === "shu" ? row.serviceContribution.toString() : row.savingWajib.toString();
      case "F": return activeTab === "shu" ? row.savingShu.toString() : row.savingSukarela.toString();
      case "G": return activeTab === "shu" ? row.serviceShu.toString() : row.totalSaving.toString();
      case "H": return row.totalShu.toString();
      default: return "";
    }
  }, [selectedCell, computedRows, activeTab]);

  // Check if cell is write-protected (formulas are calculated automatically)
  const isCellCalculated = (colName: string) => {
    if (activeTab === "shu") {
      return ["D", "F", "G", "H"].includes(colName);
    } else {
      return ["G"].includes(colName);
    }
  };

  const handleCellClick = (rowIdx: number, colName: string) => {
    setSelectedCell({ rowIdx, colName });
    setEditingCell(null);
  };

  const handleCellDoubleClick = (rowIdx: number, colName: string) => {
    // Read-only: editing is disabled in spreadsheet view.
    return;
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
        joinDate: "2025-01-01",
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
        "Mereset seluruh modifikasi data spreadsheet kembali ke data dari database Supabase!",
        "danger"
      );
      setRows([...originalRows]);
      setSelectedCell({ rowIdx: 0, colName: "B" });
      setEditingCell(null);
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const buildSimpananSheet = (wb: ExcelJS.Workbook) => {
    const formattedDate = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
    const ws = wb.addWorksheet("Simpanan");
    ws.columns = [
      { width: 5 },  // NO
      { width: 30 }, // NAMA ANGGOTA
      { width: 20 }, // SIMPANAN POKOK
      { width: 20 }, // SIMPANAN WAJIB
      { width: 20 }, // SIMPANAN SUKARELA
      { width: 20 }, // JUMLAH
      { width: 25 }, // CATATAN
    ];

    ws.mergeCells("A1:G1");
    ws.getCell("A1").value = "DAFTAR SIMPANAN ANGGOTA";
    ws.getCell("A1").font = { bold: true, size: 12 };
    ws.getCell("A1").alignment = { horizontal: "center" };

    ws.mergeCells("A2:G2");
    ws.getCell("A2").value = settings.cooperativeName.toUpperCase();
    ws.getCell("A2").font = { bold: true, size: 12 };
    ws.getCell("A2").alignment = { horizontal: "center" };

    ws.mergeCells("A3:G3");
    ws.getCell("A3").value = settings.district.toUpperCase();
    ws.getCell("A3").font = { bold: true, size: 12 };
    ws.getCell("A3").alignment = { horizontal: "center" };

    ws.mergeCells("A4:G4");
    ws.getCell("A4").value = `PER ${formattedDate.toUpperCase()}`;
    ws.getCell("A4").font = { bold: true, size: 12 };
    ws.getCell("A4").alignment = { horizontal: "center" };

    // Header Rows 6 and 7
    ws.mergeCells("A6:A7");
    const noCell = ws.getCell("A6");
    noCell.value = "NO";

    ws.mergeCells("B6:B7");
    const namaCell = ws.getCell("B6");
    namaCell.value = "NAMA ANGGOTA";

    ws.mergeCells("C6:E6");
    const simpananCell = ws.getCell("C6");
    simpananCell.value = "SIMPANAN";

    ws.getCell("C7").value = "POKOK";
    ws.getCell("D7").value = "WAJIB";
    ws.getCell("E7").value = "SUKARELA";

    ws.mergeCells("F6:F7");
    const jumlahCell = ws.getCell("F6");
    jumlahCell.value = "JUMLAH";

    ws.mergeCells("G6:G7");
    const catatanCell = ws.getCell("G6");
    catatanCell.value = "CATATAN";

    const headerRows = [ws.getRow(6), ws.getRow(7)];
    headerRows.forEach(row => {
      row.font = { bold: true };
      for (let i = 1; i <= 7; i++) {
        const cell = row.getCell(i);
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
      }
    });

    let currentRow = 8;
    computedRows.forEach((row, idx) => {
      const dataRow = ws.getRow(currentRow);
      dataRow.values = [
        idx + 1,
        row.memberName,
        row.savingPokok,
        row.savingWajib,
        row.savingSukarela,
        row.totalSaving,
        "" // CATATAN
      ];
      
      dataRow.getCell(1).alignment = { horizontal: "center" };
      
      for (let i = 1; i <= 7; i++) {
        const cell = dataRow.getCell(i);
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
        if (i >= 3 && i <= 6) cell.numFmt = '_("Rp"* #,##0_);_("Rp"* (#,##0);_("Rp"* "-"_);_(@_)';
      }
      currentRow++;
    });

    const sumRow = ws.getRow(currentRow);
    ws.mergeCells(`A${currentRow}:B${currentRow}`);
    sumRow.getCell(1).value = "JUMLAH";
    sumRow.getCell(1).font = { bold: true };
    sumRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };

    sumRow.getCell(3).value = computedRows.reduce((a, b) => a + b.savingPokok, 0);
    sumRow.getCell(4).value = computedRows.reduce((a, b) => a + b.savingWajib, 0);
    sumRow.getCell(5).value = computedRows.reduce((a, b) => a + b.savingSukarela, 0);
    sumRow.getCell(6).value = computedRows.reduce((a, b) => a + b.totalSaving, 0);
    sumRow.font = { bold: true };

    for (let i = 1; i <= 7; i++) {
      const cell = sumRow.getCell(i);
      cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
      if (i >= 3 && i <= 6) cell.numFmt = '_("Rp"* #,##0_);_("Rp"* (#,##0);_("Rp"* "-"_);_(@_)';
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
    
    currentRow += 1;
    ws.mergeCells(`A${currentRow}:G${currentRow}`);
    ws.getCell(`A${currentRow}`).value = settings.address;
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
  };

  const buildShuSheet = (wb: ExcelJS.Workbook) => {
    const formattedDate = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
    const ws = wb.addWorksheet("Daftar SHU");

    ws.columns = [
      { width: 5 },  // NO
      { width: 30 }, // NAMA ANGGOTA
      { width: 20 }, // JML SIMPANAN
      { width: 20 }, // SETORAN JASA
      { width: 20 }, // SHU SIMPANAN
      { width: 20 }, // SHU JASA
      { width: 20 }, // JUMLAH
    ];

    ws.mergeCells("A1:G1");
    ws.getCell("A1").value = "DAFTAR PEMBAGIAN SHU";
    ws.getCell("A1").font = { bold: true, size: 12 };
    ws.getCell("A1").alignment = { horizontal: "center" };

    ws.mergeCells("A2:G2");
    ws.getCell("A2").value = settings.cooperativeName.toUpperCase();
    ws.getCell("A2").font = { bold: true, size: 12 };
    ws.getCell("A2").alignment = { horizontal: "center" };

    ws.mergeCells("A3:G3");
    ws.getCell("A3").value = settings.district.toUpperCase();
    ws.getCell("A3").font = { bold: true, size: 12 };
    ws.getCell("A3").alignment = { horizontal: "center" };

    ws.mergeCells("A4:G4");
    ws.getCell("A4").value = `PER ${formattedDate.toUpperCase()}`;
    ws.getCell("A4").font = { bold: true, size: 12 };
    ws.getCell("A4").alignment = { horizontal: "center" };

    const headerRow = ws.getRow(6);
    headerRow.values = ["NO", "NAMA ANGGOTA", "JML SIMPANAN", "SETORAN JASA", "SHU SIMPANAN", "SHU JASA", "JUMLAH"];
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };

    for (let i = 1; i <= 7; i++) {
      headerRow.getCell(i).border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    }

    let currentRow = 7;
    computedRows.forEach((row, idx) => {
      const dataRow = ws.getRow(currentRow);
      dataRow.values = [
        idx + 1,
        row.memberName,
        row.totalSaving,
        row.serviceContribution,
        row.savingShu,
        row.serviceShu,
        row.totalShu
      ];
      
      dataRow.getCell(1).alignment = { horizontal: "center" };
      
      for (let i = 1; i <= 7; i++) {
        const cell = dataRow.getCell(i);
        cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
        if (i >= 3) {
          cell.numFmt = '_("Rp"* #,##0_);_("Rp"* (#,##0);_("Rp"* "-"_);_(@_)';
        }
      }
      currentRow++;
    });

    const sumRow = ws.getRow(currentRow);
    ws.mergeCells(`A${currentRow}:B${currentRow}`);
    sumRow.getCell(1).value = "JUMLAH";
    sumRow.getCell(1).font = { bold: true };
    sumRow.getCell(1).alignment = { horizontal: "center", vertical: "middle" };

    sumRow.getCell(3).value = computedRows.reduce((a, b) => a + b.totalSaving, 0);
    sumRow.getCell(4).value = computedRows.reduce((a, b) => a + b.serviceContribution, 0);
    sumRow.getCell(5).value = computedRows.reduce((a, b) => a + b.savingShu, 0);
    sumRow.getCell(6).value = computedRows.reduce((a, b) => a + b.serviceShu, 0);
    sumRow.getCell(7).value = computedRows.reduce((a, b) => a + b.totalShu, 0);

    sumRow.font = { bold: true };
    
    for (let i = 1; i <= 7; i++) {
      const cell = sumRow.getCell(i);
      cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
      if (i >= 3) {
        cell.numFmt = '_("Rp"* #,##0_);_("Rp"* (#,##0);_("Rp"* "-"_);_(@_)';
      }
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
    
    currentRow += 1;
    ws.mergeCells(`A${currentRow}:G${currentRow}`);
    ws.getCell(`A${currentRow}`).value = settings.address;
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
  };

  const handleExportSimpananOnly = async () => {
    addAuditLog("EXPORT_EXCEL", "Mengekspor data Spreadsheet Simpanan Live ke berkas Excel (.xlsx).", "info");
    const wb = new ExcelJS.Workbook();
    buildSimpananSheet(wb);
    const buffer = await wb.xlsx.writeBuffer();
    downloadBlob(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `SPREADSHEET_SIMPANAN_${settings.activeFiscalYear}.xlsx`);
    setIsExportModalOpen(false);
  };

  const handleExportShuOnly = async () => {
    addAuditLog("EXPORT_EXCEL", "Mengekspor data Spreadsheet SHU Live ke berkas Excel (.xlsx).", "info");
    const wb = new ExcelJS.Workbook();
    buildShuSheet(wb);
    const buffer = await wb.xlsx.writeBuffer();
    downloadBlob(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `SPREADSHEET_SHU_${settings.activeFiscalYear}.xlsx`);
    setIsExportModalOpen(false);
  };

  const handleExportAll = async () => {
    addAuditLog("EXPORT_EXCEL", "Mengekspor seluruh lembar kerja Spreadsheet Live (Simpanan & SHU) ke dalam satu berkas Excel (.xlsx).", "info");
    const wb = new ExcelJS.Workbook();
    buildSimpananSheet(wb);
    buildShuSheet(wb);
    const buffer = await wb.xlsx.writeBuffer();
    downloadBlob(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `SPREADSHEET_BUNDEL_RAT_${settings.activeFiscalYear}.xlsx`);
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

            <div className="px-3 py-1.5 bg-white/10 border border-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 select-none">
              <svg className="h-3.5 w-3.5 text-green-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Mode: Lihat Saja (Read-Only)</span>
            </div>

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
            disabled={true}
            placeholder={
              selectedCell 
                ? `Nilai Sel: ${selectedCell.colName}${selectedCell.rowIdx + 1} (Mode Lihat Saja)`
                : "Pilih sel untuk melihat detail..."
            }
            className="flex-1 bg-slate-100 border border-slate-200 px-3 py-1 rounded text-xs outline-none transition font-mono disabled:opacity-75 disabled:cursor-not-allowed select-all"
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
                <th className="w-40 border border-slate-300 bg-slate-100 text-center font-bold text-slate-500 py-1">G</th>
                {activeTab === "shu" && (
                  <th className="w-40 border border-slate-300 bg-slate-100 text-center font-bold text-slate-500 py-1">H</th>
                )}
              </tr>
              <tr>
                <th className="border border-slate-300 bg-slate-50 text-center text-slate-400 py-0.5 border-l-0"></th>
                <th className="border border-slate-300 bg-slate-50 text-slate-400 text-center py-0.5 font-normal">NO</th>
                <th className="border border-slate-300 bg-slate-50 text-slate-400 text-left px-2 py-0.5 font-normal">NAMA ANGGOTA</th>
                <th className="border border-slate-300 bg-slate-50 text-slate-400 text-center px-2 py-0.5 font-normal">TGL BERGABUNG</th>
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
              {isLoading ? (
                <tr>
                  <td colSpan={activeTab === "shu" ? 9 : 8} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-2 border-slate-200 border-t-green-600 rounded-full animate-spin"></div>
                      <p className="text-slate-500 font-sans">Mengambil data dari Supabase Database...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredRows.map((row, index) => {
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

                    {/* Column C: TGL BERGABUNG */}
                    <td
                      onClick={() => handleCellClick(actualRowIdx, "C")}
                      className={`border px-2 py-1 text-center font-semibold text-slate-500 relative ${
                        selectedCell?.rowIdx === actualRowIdx && selectedCell?.colName === "C"
                          ? "ring-2 ring-green-600 z-[1]"
                          : "border-slate-200"
                      }`}
                    >
                      {formatRelativeDate(row.joinDate)}
                    </td>

                    {activeTab === "shu" ? (
                      <>
                        {/* Column D: Total Savings (Formula) */}
                        <td
                          onClick={() => handleCellClick(actualRowIdx, "D")}
                          className={`border px-2 py-1 text-right bg-slate-50/50 font-semibold text-slate-600 relative ${
                            selectedCell?.rowIdx === actualRowIdx && selectedCell?.colName === "D"
                              ? "ring-2 ring-green-600 z-[1]"
                              : "border-slate-200"
                          }`}
                        >
                          Rp {row.totalSaving.toLocaleString("id-ID")}
                        </td>

                        {/* Column E: Service Contribution */}
                        <td
                          onClick={() => handleCellClick(actualRowIdx, "E")}
                          className={`border px-2 py-1 text-right relative ${
                            selectedCell?.rowIdx === actualRowIdx && selectedCell?.colName === "E"
                              ? "ring-2 ring-green-600 z-[1]"
                              : "border-slate-200"
                          }`}
                        >
                          Rp {row.serviceContribution.toLocaleString("id-ID")}
                        </td>

                        {/* Column F: SHU Simpanan (Formula) */}
                        <td
                          onClick={() => handleCellClick(actualRowIdx, "F")}
                          className={`border px-2 py-1 text-right bg-slate-50/50 text-slate-700 relative ${
                            selectedCell?.rowIdx === actualRowIdx && selectedCell?.colName === "F"
                              ? "ring-2 ring-green-600 z-[1]"
                              : "border-slate-200"
                          }`}
                        >
                          Rp {row.savingShu.toLocaleString("id-ID")}
                        </td>

                        {/* Column G: SHU Jasa (Formula) */}
                        <td
                          onClick={() => handleCellClick(actualRowIdx, "G")}
                          className={`border px-2 py-1 text-right bg-slate-50/50 text-slate-700 relative ${
                            selectedCell?.rowIdx === actualRowIdx && selectedCell?.colName === "G"
                              ? "ring-2 ring-green-600 z-[1]"
                              : "border-slate-200"
                          }`}
                        >
                          Rp {row.serviceShu.toLocaleString("id-ID")}
                        </td>

                        {/* Column H: Total SHU (Formula) */}
                        <td
                          onClick={() => handleCellClick(actualRowIdx, "H")}
                          className={`border px-2 py-1 text-right bg-green-50/30 text-green-700 font-bold relative ${
                            selectedCell?.rowIdx === actualRowIdx && selectedCell?.colName === "H"
                              ? "ring-2 ring-green-600 z-[1]"
                              : "border-slate-200"
                          }`}
                        >
                          Rp {row.totalShu.toLocaleString("id-ID")}
                        </td>
                      </>
                    ) : (
                      <>
                        {/* Column D: Pokok */}
                        <td
                          onClick={() => handleCellClick(actualRowIdx, "D")}
                          className={`border px-2 py-1 text-right relative ${
                            selectedCell?.rowIdx === actualRowIdx && selectedCell?.colName === "D"
                              ? "ring-2 ring-green-600 z-[1]"
                              : "border-slate-200"
                          }`}
                        >
                          Rp {row.savingPokok.toLocaleString("id-ID")}
                        </td>

                        {/* Column E: Wajib */}
                        <td
                          onClick={() => handleCellClick(actualRowIdx, "E")}
                          className={`border px-2 py-1 text-right relative ${
                            selectedCell?.rowIdx === actualRowIdx && selectedCell?.colName === "E"
                              ? "ring-2 ring-green-600 z-[1]"
                              : "border-slate-200"
                          }`}
                        >
                          Rp {row.savingWajib.toLocaleString("id-ID")}
                        </td>

                        {/* Column F: Sukarela */}
                        <td
                          onClick={() => handleCellClick(actualRowIdx, "F")}
                          className={`border px-2 py-1 text-right relative ${
                            selectedCell?.rowIdx === actualRowIdx && selectedCell?.colName === "F"
                              ? "ring-2 ring-green-600 z-[1]"
                              : "border-slate-200"
                          }`}
                        >
                          Rp {row.savingSukarela.toLocaleString("id-ID")}
                        </td>

                        {/* Column G: Total Saving (Formula) */}
                        <td
                          onClick={() => handleCellClick(actualRowIdx, "G")}
                          className={`border px-2 py-1 text-right bg-green-50/20 text-green-700 font-bold relative ${
                            selectedCell?.rowIdx === actualRowIdx && selectedCell?.colName === "G"
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
                <td className="border border-slate-300 text-center text-slate-400 py-1">
                  -
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
