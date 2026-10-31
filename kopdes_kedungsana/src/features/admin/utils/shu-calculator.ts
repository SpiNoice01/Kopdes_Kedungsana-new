import type { KopdesSettings } from "@/src/features/settings/domain/settings";

export interface ShuPools {
  netShu: number;
  danaAnggota: number;
}

/**
 * Sizes the Dana Anggota pos from the fiscal year's net SHU (entered by the
 * treasurer from the income statement, see fiscal_year_shu). The other six
 * pos (Cadangan, Pengurus, ...) are organisational funds and are never split
 * per member.
 */
export const calculateShuPools = (
  netShu: number,
  settings: KopdesSettings
): ShuPools => {
  const danaAnggota = Math.round((netShu * settings.pctDanaAnggota) / 100);

  return { netShu, danaAnggota };
};

export interface MemberShuBasisRow {
  savingPokok: number;
  savingWajib: number;
  savingSukarela: number;
  investmentAmount: number;
  serviceContribution: number;
}

export interface MemberShuResult {
  totalSaving: number;
  savingShu: number;
  serviceShu: number;
  totalShu: number;
}

/**
 * A member's SHU Simpanan basis: every savings type plus Investasi. Sukarela
 * is included because that is how the client's reference RAT (Laporan RAT
 * 2024, "JML SIMPANAN" column) computes it.
 */
export const memberSavingBasis = (row: MemberShuBasisRow): number =>
  row.savingPokok + row.savingWajib + row.savingSukarela + row.investmentAmount;

export interface ShuBasisTotals {
  savingBasis: number;
  serviceBasis: number;
}

export const totalShuBasis = (rows: MemberShuBasisRow[]): ShuBasisTotals => ({
  savingBasis: rows.reduce((sum, r) => sum + memberSavingBasis(r), 0),
  serviceBasis: rows.reduce((sum, r) => sum + r.serviceContribution, 0),
});

/**
 * One rate for both savings and service participation, as in the reference
 * RAT: Dana Anggota ÷ (total simpanan + total setoran jasa). With no service
 * data yet, the whole Dana Anggota simply flows to savings — nothing is left
 * undistributed.
 */
export const calculateShuRate = (danaAnggota: number, totals: ShuBasisTotals): number => {
  const basis = totals.savingBasis + totals.serviceBasis;
  return basis > 0 ? danaAnggota / basis : 0;
};

/**
 * Single source of truth for a member's SHU split, shared by every screen
 * that renders a Daftar SHU (Quick SHU, Spreadsheet Live, RAT bundle export)
 * so the formula can't silently drift between them.
 */
export const computeMemberShu = (
  row: MemberShuBasisRow,
  shuRate: number
): MemberShuResult => {
  const totalSaving = row.savingPokok + row.savingWajib + row.savingSukarela;
  const savingShu = Math.round(memberSavingBasis(row) * shuRate);
  const serviceShu = Math.round(row.serviceContribution * shuRate);

  return { totalSaving, savingShu, serviceShu, totalShu: savingShu + serviceShu };
};
