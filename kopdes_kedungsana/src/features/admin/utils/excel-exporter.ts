import ExcelJS from "exceljs";
import type { KopdesSettings } from "@/src/features/settings/domain/settings";

export interface ExcelExportRow {
  memberName: string;
  savingPokok: number;
  savingWajib: number;
  savingSukarela: number;
  totalSaving: number;
  investmentAmount: number;
  serviceContribution: number;
  savingShu: number;
  serviceShu: number;
  totalShu: number;
}

export const buildSimpananSheet = (
  wb: ExcelJS.Workbook,
  settings: KopdesSettings,
  rows: ExcelExportRow[]
) => {
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
  ws.getCell("A6").value = "NO";

  ws.mergeCells("B6:B7");
  ws.getCell("B6").value = "NAMA ANGGOTA";

  ws.mergeCells("C6:E6");
  ws.getCell("C6").value = "SIMPANAN";

  ws.getCell("C7").value = "POKOK";
  ws.getCell("D7").value = "WAJIB";
  ws.getCell("E7").value = "SUKARELA";

  ws.mergeCells("F6:F7");
  ws.getCell("F6").value = "JUMLAH";

  ws.mergeCells("G6:G7");
  ws.getCell("G6").value = "CATATAN";

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
  rows.forEach((row, idx) => {
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

  sumRow.getCell(3).value = rows.reduce((a, b) => a + b.savingPokok, 0);
  sumRow.getCell(4).value = rows.reduce((a, b) => a + b.savingWajib, 0);
  sumRow.getCell(5).value = rows.reduce((a, b) => a + b.savingSukarela, 0);
  sumRow.getCell(6).value = rows.reduce((a, b) => a + b.totalSaving, 0);
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

export const buildShuSheet = (
  wb: ExcelJS.Workbook,
  settings: KopdesSettings,
  rows: ExcelExportRow[]
) => {
  const formattedDate = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
  const ws = wb.addWorksheet("Daftar SHU");

  ws.columns = [
    { width: 5 },  // NO
    { width: 30 }, // NAMA ANGGOTA
    { width: 20 }, // JML SIMPANAN
    { width: 20 }, // INVESTASI
    { width: 20 }, // SETORAN JASA
    { width: 20 }, // SHU SIMPANAN
    { width: 20 }, // SHU JASA
    { width: 20 }, // JUMLAH
  ];

  ws.mergeCells("A1:H1");
  ws.getCell("A1").value = "DAFTAR PEMBAGIAN SHU";
  ws.getCell("A1").font = { bold: true, size: 12 };
  ws.getCell("A1").alignment = { horizontal: "center" };

  ws.mergeCells("A2:H2");
  ws.getCell("A2").value = settings.cooperativeName.toUpperCase();
  ws.getCell("A2").font = { bold: true, size: 12 };
  ws.getCell("A2").alignment = { horizontal: "center" };

  ws.mergeCells("A3:H3");
  ws.getCell("A3").value = settings.district.toUpperCase();
  ws.getCell("A3").font = { bold: true, size: 12 };
  ws.getCell("A3").alignment = { horizontal: "center" };

  ws.mergeCells("A4:H4");
  ws.getCell("A4").value = `PER ${formattedDate.toUpperCase()}`;
  ws.getCell("A4").font = { bold: true, size: 12 };
  ws.getCell("A4").alignment = { horizontal: "center" };

  const headerRow = ws.getRow(6);
  headerRow.values = ["NO", "NAMA ANGGOTA", "JML SIMPANAN", "INVESTASI", "SETORAN JASA", "SHU SIMPANAN", "SHU JASA", "JUMLAH"];
  headerRow.font = { bold: true };
  headerRow.alignment = { horizontal: "center", vertical: "middle" };

  for (let i = 1; i <= 8; i++) {
    headerRow.getCell(i).border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
  }

  let currentRow = 7;
  rows.forEach((row, idx) => {
    const dataRow = ws.getRow(currentRow);
    dataRow.values = [
      idx + 1,
      row.memberName,
      row.totalSaving,
      row.investmentAmount,
      row.serviceContribution,
      row.savingShu,
      row.serviceShu,
      row.totalShu
    ];

    dataRow.getCell(1).alignment = { horizontal: "center" };

    for (let i = 1; i <= 8; i++) {
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

  sumRow.getCell(3).value = rows.reduce((a, b) => a + b.totalSaving, 0);
  sumRow.getCell(4).value = rows.reduce((a, b) => a + b.investmentAmount, 0);
  sumRow.getCell(5).value = rows.reduce((a, b) => a + b.serviceContribution, 0);
  sumRow.getCell(6).value = rows.reduce((a, b) => a + b.savingShu, 0);
  sumRow.getCell(7).value = rows.reduce((a, b) => a + b.serviceShu, 0);
  sumRow.getCell(8).value = rows.reduce((a, b) => a + b.totalShu, 0);

  sumRow.font = { bold: true };

  for (let i = 1; i <= 8; i++) {
    const cell = sumRow.getCell(i);
    cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
    if (i >= 3) {
      cell.numFmt = '_("Rp"* #,##0_);_("Rp"* (#,##0);_("Rp"* "-"_);_(@_)';
    }
  }

  currentRow += 3;
  ws.mergeCells(`A${currentRow}:H${currentRow}`);
  ws.getCell(`A${currentRow}`).value = `${settings.printLocation}, ${formattedDate}`;
  ws.getCell(`A${currentRow}`).font = { bold: true };
  ws.getCell(`A${currentRow}`).alignment = { horizontal: "center" };

  currentRow += 1;
  ws.mergeCells(`A${currentRow}:H${currentRow}`);
  ws.getCell(`A${currentRow}`).value = `Pengurus ${settings.cooperativeName}`;
  ws.getCell(`A${currentRow}`).font = { bold: true };
  ws.getCell(`A${currentRow}`).alignment = { horizontal: "center" };

  currentRow += 1;
  ws.mergeCells(`A${currentRow}:H${currentRow}`);
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

export const downloadExcelBuffer = (buffer: ExcelJS.Buffer, filename: string) => {
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
