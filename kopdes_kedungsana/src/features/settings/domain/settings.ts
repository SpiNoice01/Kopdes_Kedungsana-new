export interface KopdesSettings {
  id?: string;
  cooperativeName: string;
  address: string;
  legalNumber: string;
  district: string;
  printLocation: string;
  chairmanName: string;
  secretaryName: string;
  treasurerName: string;
  principalSavingAmount: number;
  monthlyDuesAmount: number;
  activeFiscalYear: number;
  pctCadangan: number;
  /** Dana Anggota — the single member-facing pos, split across savings and service participation at one rate. */
  pctDanaAnggota: number;
  pctPengurus: number;
  pctKaryawan: number;
  pctPendidikan: number;
  /** Pembangunan Daerah Kerja. */
  pctPmdk: number;
  pctSosial: number;
  enableInvestasi: boolean;
}
