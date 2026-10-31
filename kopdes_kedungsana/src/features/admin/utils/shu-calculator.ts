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
 * Single source of truth for every member's SHU split, shared by every screen
 * that renders a Daftar SHU (Quick SHU, Spreadsheet Live, RAT bundle export)
 * so the formula can't silently drift between them. Returns one result per
 * row, in the same order.
 *
 * Each member is entitled to basis × tarif, which is rarely a whole rupiah.
 * Rounding each value on its own lets the total drift a few rupiah from Dana
 * Anggota, so this uses the largest remainder method instead: every SHU
 * Simpanan and SHU Jasa value is floored, then the leftover rupiah go one each
 * to the values with the largest fractional part. The total then equals Dana
 * Anggota exactly, and each value is still within Rp 1 of basis × tarif.
 */
export const distributeMemberShu = (
  rows: MemberShuBasisRow[],
  danaAnggota: number
): MemberShuResult[] => {
  const totals = totalShuBasis(rows);
  const basis = totals.savingBasis + totals.serviceBasis;

  // Slot 2i = SHU Simpanan of row i, slot 2i + 1 = its SHU Jasa.
  const exact = rows.flatMap((row) =>
    basis > 0
      ? [(memberSavingBasis(row) * danaAnggota) / basis, (row.serviceContribution * danaAnggota) / basis]
      : [0, 0]
  );
  const amounts = exact.map(Math.floor);

  let leftover = (basis > 0 ? danaAnggota : 0) - amounts.reduce((sum, a) => sum + a, 0);
  const byRemainder = exact
    .map((value, slot) => ({ slot, remainder: value - amounts[slot] }))
    .sort((a, b) => b.remainder - a.remainder || a.slot - b.slot);
  for (const { slot } of byRemainder) {
    if (leftover <= 0) break;
    amounts[slot] += 1;
    leftover -= 1;
  }

  return rows.map((row, i) => {
    const savingShu = amounts[2 * i];
    const serviceShu = amounts[2 * i + 1];
    return {
      totalSaving: row.savingPokok + row.savingWajib + row.savingSukarela,
      savingShu,
      serviceShu,
      totalShu: savingShu + serviceShu,
    };
  });
};
