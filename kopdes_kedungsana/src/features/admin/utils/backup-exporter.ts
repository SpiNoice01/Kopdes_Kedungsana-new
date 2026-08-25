import ExcelJS from "exceljs";
import { supabase } from "@/src/utils/supabase-client";
import { appendRatBundleSheets } from "./rat-bundle-exporter";

const BACKUP_TABLES = [
  "members",
  "member_monthly_savings",
  "member_investments",
  "member_service_contributions",
  "cooperative_settings",
] as const;

// Excel's hard per-cell text limit is 32,767 characters. Some columns (e.g.
// members.photo_url) store full base64 data URLs, which can easily exceed
// that and corrupt the whole .xlsx (Excel then "repairs" it, silently
// dropping data). Truncate well under the limit rather than hit it exactly.
const MAX_CELL_TEXT_LENGTH = 30000;

const toCellValue = (value: unknown): string | number | boolean => {
  if (value === null || value === undefined) return "";

  let text: string | number | boolean;
  if (typeof value === "object") {
    text = JSON.stringify(value);
  } else {
    text = value as string | number | boolean;
  }

  if (typeof text === "string" && text.length > MAX_CELL_TEXT_LENGTH) {
    return `${text.slice(0, MAX_CELL_TEXT_LENGTH)}...[DIPOTONG, panjang asli ${text.length} karakter — nilai ini kemungkinan base64/data URL, tidak muat di satu sel Excel]`;
  }

  return text;
};

const buildRawTableSheet = (
  wb: ExcelJS.Workbook,
  sheetName: string,
  rows: Record<string, unknown>[],
) => {
  const ws = wb.addWorksheet(sheetName);

  if (rows.length === 0) {
    ws.getCell("A1").value = "Tidak ada data pada tabel ini.";
    ws.getCell("A1").font = { italic: true };
    return;
  }

  const headers = Object.keys(rows[0]);
  const headerRow = ws.addRow(headers);
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
  });
  ws.columns = headers.map((header) => ({ header, width: Math.max(header.length + 2, 15) }));

  rows.forEach((row) => {
    const values = headers.map((header) => toCellValue(row[header]));
    ws.addRow(values);
  });
};

/**
 * Raw database dump only — one sheet per table, unformatted, for
 * restorability. Kept separate from the RAT bundle (buildRatReportWorkbook)
 * so an admin who only wants the raw data doesn't have to wade through
 * formatted report sheets in the same file, and vice versa.
 */
export const buildDatabaseBackupWorkbook = async (): Promise<ExcelJS.Workbook> => {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Kopdes Kedungsana - Auto Backup";
  wb.created = new Date();

  for (const table of BACKUP_TABLES) {
    const { data, error } = await supabase.from(table).select("*");
    if (error) {
      throw new Error(`Gagal mengambil data tabel ${table}: ${error.message}`);
    }
    buildRawTableSheet(wb, table, data ?? []);
  }

  return wb;
};

/**
 * Formatted RAT report only (Simpanan + Daftar SHU) — same sheets Quick
 * SHU's "Ekspor Semua Laporan (Bundel RAT)" button produces.
 */
export const buildRatReportWorkbook = async (): Promise<ExcelJS.Workbook> => {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Kopdes Kedungsana - Auto Backup";
  wb.created = new Date();

  await appendRatBundleSheets(wb);

  return wb;
};

export const buildDatabaseBackupFilename = (date: Date = new Date()): string => {
  const isoDate = date.toISOString().slice(0, 10); // YYYY-MM-DD
  return `backup_database_kopdes_kedungsana_${isoDate}.xlsx`;
};

export const buildRatReportFilename = (date: Date = new Date()): string => {
  const isoDate = date.toISOString().slice(0, 10); // YYYY-MM-DD
  return `backup_laporan_rat_kopdes_kedungsana_${isoDate}.xlsx`;
};
