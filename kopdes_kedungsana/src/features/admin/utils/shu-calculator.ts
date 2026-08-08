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
