import { settingsDependencies } from "@/src/features/settings/infrastructure/settings-dependencies";
import type { KopdesSettings } from "@/src/features/settings/domain/settings";

export const defaultSettings: KopdesSettings = {
  cooperativeName: "Koperasi Desa Merah Putih Kedungsana",
  address: "Jl. Pangeran Kisana No. 01, Desa Kedungsana, Kec. Plumbon, Kab. Cirebon, Jawa Barat 45155",
  legalNumber: "AHU-0021490.AH.01.29.TAHUN 2025",
  district: "KABUPATEN CIREBON",
  printLocation: "Cirebon",
  chairmanName: "ASEP SARIFUDIN",
  secretaryName: "ARYANTO",
  treasurerName: "MINTI SARI",
  principalSavingAmount: 100_000,
  monthlyDuesAmount: 10_000,
  activeFiscalYear: new Date().getFullYear(),
  // Pembagian SHU sesuai persentase AD yang ditetapkan klien.
  pctCadangan: 25,
  pctDanaAnggota: 50,
  pctPengurus: 10,
  pctKaryawan: 5,
  pctPendidikan: 2.5,
  pctPmdk: 2.5,
  pctSosial: 5,
  enableInvestasi: false,
};

/**
 * Dipakai saat pengaturan belum/gagal dimuat dari database. Sama dengan
 * defaultSettings, kecuali nama pengurus dikosongkan: nama orang tidak boleh
 * tercetak di laporan hanya karena database gagal dibaca. (defaultSettings
 * sendiri tetap utuh untuk tombol "Reset ke Default" di Pengaturan.)
 */
export const unloadedSettings: KopdesSettings = {
  ...defaultSettings,
  chairmanName: "",
  secretaryName: "",
  treasurerName: "",
};

export async function loadSettingsAsync(): Promise<KopdesSettings> {
  try {
    const settings = await settingsDependencies.getSettingsUseCase.execute();
    return settings as KopdesSettings;
  } catch (error) {
    console.error("Failed to load settings from Supabase", error);
    return unloadedSettings;
  }
}

export async function saveSettingsAsync(settings: KopdesSettings): Promise<void> {
  await settingsDependencies.updateSettingsUseCase.execute(settings as any);
}
