import ExcelJS from "exceljs";
import { supabase } from "@/src/utils/supabase-client";

const RESTORE_TABLES = [
  "members",
  "member_monthly_savings",
  "member_investments",
  "member_service_contributions",
  "cooperative_settings",
] as const;

// Must match backup-exporter.ts's truncation marker exactly — a column that
// got truncated during backup (currently only members.photo_url, which
// stores full base64 image data) must never be written back on restore, or
// the real photo gets silently replaced with broken truncated garbage.
// Handled per-row (not as a blanket excluded column) so members whose photo
// was short enough to NOT get truncated still restore normally.
const TRUNCATION_MARKER = "...[DIPOTONG,";
const MAX_SAFE_RESTORE_TEXT_LENGTH = 30_000;

export type ParsedRestoreTable = {
  table: (typeof RESTORE_TABLES)[number];
  rows: Record<string, unknown>[];
};

export type ParsedRestoreData = {
  tables: ParsedRestoreTable[];
  warnings: string[];
};

const cellToValue = (value: ExcelJS.CellValue): unknown => {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value === "" ? null : value;
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (value instanceof Date) return value.toISOString();
  // Rich/formula cell objects aren't expected in this raw-dump format — fall
  // back to a string rather than crash the whole restore over one odd cell.
  return String(value);
};

export const parseBackupWorkbook = async (file: File): Promise<ParsedRestoreData> => {
  const buffer = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);

  const warnings: string[] = [];
  const tables: ParsedRestoreTable[] = [];

  for (const tableName of RESTORE_TABLES) {
    const ws = wb.getWorksheet(tableName);
    if (!ws) continue; // sheet not present in this file — not an error, just skip that table

    const headers: string[] = [];
    ws.getRow(1).eachCell((cell, colNumber) => {
      headers[colNumber - 1] = String(cell.value ?? "").trim();
    });

    if (headers.length === 0 || headers[0] === "Tidak ada data pada tabel ini.") {
      continue; // empty-table placeholder sheet from backup-exporter.ts
    }
    if (!headers.includes("id")) {
      warnings.push(`Sheet "${tableName}" tidak punya kolom "id" — dilewati seluruhnya (kemungkinan bukan berkas backup database yang valid).`);
      continue;
    }

    const rows: Record<string, unknown>[] = [];

    for (let rowNumber = 2; rowNumber <= ws.rowCount; rowNumber++) {
      const row = ws.getRow(rowNumber);
      if (row.cellCount === 0) continue;

      const record: Record<string, unknown> = {};
      let hasId = false;
      let skippedTruncatedField = false;

      headers.forEach((header, idx) => {
        if (!header) return;
        const value = cellToValue(row.getCell(idx + 1).value);

        if (typeof value === "string" && (value.includes(TRUNCATION_MARKER) || value.length > MAX_SAFE_RESTORE_TEXT_LENGTH)) {
          skippedTruncatedField = true;
          return; // never write a truncated/oversized value back — leave existing DB value untouched for this field
        }

        record[header] = value;
        if (header === "id" && typeof value === "string" && value) hasId = true;
      });

      if (!hasId) {
        warnings.push(`${tableName} baris Excel ke-${rowNumber} tidak punya "id" yang valid — dilewati (tidak direstore).`);
        continue;
      }
      if (skippedTruncatedField) {
        warnings.push(`${tableName} baris ${rowNumber} (id: ${record.id}): satu kolom terpotong saat backup, kolom tsb TIDAK ditimpa — nilai lama di database tetap dipertahankan.`);
      }

      rows.push(record);
    }

    tables.push({ table: tableName, rows });
  }

  return { tables, warnings };
};

export type RestoreSummary = { table: string; rowCount: number }[];

// cooperative_settings is a true singleton (exactly one row, never inserted
// again after initial seed) — its RLS policy only grants UPDATE to the
// authenticated role, not INSERT (matches settings-repository.ts, which
// only ever calls .update().eq("id", ...), never .insert()). Postgres's
// INSERT ... ON CONFLICT DO UPDATE always attempts the INSERT branch first
// even when a conflict is expected, so .upsert() on this table fails RLS
// before it ever reaches the UPDATE fallback. Plain .update() sidesteps
// that entirely, and is also more correct: restore should never create a
// second settings row regardless of what RLS would otherwise allow.
const SINGLETON_UPDATE_ONLY_TABLES = new Set<(typeof RESTORE_TABLES)[number]>(["cooperative_settings"]);

/**
 * Upserts row-by-row (not one batched call per table) so each row can carry
 * its own set of columns — required because a truncated field is dropped
 * per-row above, and a single batched upsert requires every row in the call
 * to share the exact same columns. Data volumes here are small (village
 * cooperative scale), so the extra round-trips are not a real cost.
 */
export const performDatabaseRestore = async (
  data: ParsedRestoreData,
  onProgress?: (table: string, done: number, total: number) => void,
): Promise<RestoreSummary> => {
  const summary: RestoreSummary = [];

  for (const { table, rows } of data.tables) {
    if (rows.length === 0) continue;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const { error } = SINGLETON_UPDATE_ONLY_TABLES.has(table)
        ? await supabase.from(table).update(row).eq("id", row.id as string)
        : await supabase.from(table).upsert(row, { onConflict: "id" });
      if (error) {
        throw new Error(`Gagal restore ${table} (baris id=${row.id}): ${error.message}`);
      }
      onProgress?.(table, i + 1, rows.length);
    }

    summary.push({ table, rowCount: rows.length });
  }

  return summary;
};
