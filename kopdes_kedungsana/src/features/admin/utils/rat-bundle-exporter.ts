import ExcelJS from "exceljs";
import { loadSettingsAsync } from "@/src/actions/settings-actions";
import { loadFiscalYearNetShu, loadMemberShuBasisRows } from "./shu-basis-loader";
import { calculateShuPools, distributeMemberShu } from "./shu-calculator";
import { buildSimpananSheet, buildShuSheet } from "./excel-exporter";
import type { ExcelExportRow } from "./excel-exporter";

/**
 * Fetches active members' savings/investment/service-contribution data for
 * the active fiscal year (via loadMemberShuBasisRows, shared with Quick
 * SHU's page) and appends the same "Simpanan" + "Daftar SHU" report sheets
 * Quick SHU's "Ekspor Semua Laporan (Bundel RAT)" button produces, onto an
 * existing workbook. Row-level SHU math comes from distributeMemberShu
 * (shu-calculator.ts) — the same function Quick SHU's page uses — so the
 * numbers can never drift between the two entry points.
 */
export const appendRatBundleSheets = async (wb: ExcelJS.Workbook): Promise<void> => {
  const settings = await loadSettingsAsync();
  const [rows, netShu] = await Promise.all([
    loadMemberShuBasisRows(settings),
    loadFiscalYearNetShu(settings),
  ]);

  const shuPools = calculateShuPools(netShu ?? 0, settings);
  const shuResults = distributeMemberShu(rows, shuPools.danaAnggota);

  const exportRows: ExcelExportRow[] = rows.map((row, i) => ({
    memberName: row.memberName,
    savingPokok: row.savingPokok,
    savingWajib: row.savingWajib,
    savingSukarela: row.savingSukarela,
    investmentAmount: row.investmentAmount,
    serviceContribution: row.serviceContribution,
    ...shuResults[i],
  }));

  buildSimpananSheet(wb, settings, exportRows);
  buildShuSheet(wb, settings, exportRows);
};
