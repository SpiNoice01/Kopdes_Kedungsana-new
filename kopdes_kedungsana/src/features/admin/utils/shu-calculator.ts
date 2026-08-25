import type { KopdesSettings } from "@/src/features/settings/domain/settings";

export interface ShuPools {
  totalShuKotor: number;
  danaShuSimpanan: number;
  danaShuJasa: number;
}

export const calculateShuPools = (
  totalSimpananBasis: number,
  settings: KopdesSettings
): ShuPools => {
  const totalShuKotor = Math.round(totalSimpananBasis * 0.1);
  const danaShuSimpanan = Math.round((totalShuKotor * settings.pctJasaModal) / 100);
  const danaShuJasa = Math.round((totalShuKotor * settings.pctJasaTransaksi) / 100);

  return { totalShuKotor, danaShuSimpanan, danaShuJasa };
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
 * Single source of truth for a member's SHU split, shared by every screen
 * that renders a Daftar SHU (Quick SHU, RAT bundle export) so the formula
 * can't silently drift between them the way it once did (Sukarela was
 * previously double-counted in one screen's modal basis but not the
 * other's).
 */
export const computeMemberShu = (
  row: MemberShuBasisRow,
  totalModalBasis: number,
  totalJasaBasis: number,
  shuPools: ShuPools
): MemberShuResult => {
  const totalSaving = row.savingPokok + row.savingWajib + row.savingSukarela;
  const modalSaving = row.savingPokok + row.savingWajib + row.investmentAmount;

  const savingShu = totalModalBasis > 0
    ? Math.round((modalSaving / totalModalBasis) * shuPools.danaShuSimpanan)
    : 0;

  const serviceShu = totalJasaBasis > 0
    ? Math.round((row.serviceContribution / totalJasaBasis) * shuPools.danaShuJasa)
    : 0;

  return { totalSaving, savingShu, serviceShu, totalShu: savingShu + serviceShu };
};
