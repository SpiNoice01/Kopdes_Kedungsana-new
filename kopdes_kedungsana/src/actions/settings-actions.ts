import { settingsDependencies } from "@/src/features/settings/infrastructure/settings-dependencies";
import type { KopdesSettings } from "@/src/features/settings/domain/settings";

export const defaultSettings: KopdesSettings = {
  cooperativeName: "Koperasi Desa Kedungsana",
  address: "RT 01/RW 03, Kecamatan Plumbon, Kabupaten Cirebon",
  legalNumber: "AHU-0012903.AH.01.26",
  district: "KABUPATEN CIREBON",
  printLocation: "Cirebon",
  chairmanName: "NENI MULYANI",
  secretaryName: "NENI MULYANI",
  treasurerName: "Hj. DJEDJEH ZAKIAH",
  principalSavingAmount: 100_000,
  monthlyDuesAmount: 10_000,
  activeFiscalYear: new Date().getFullYear(),
  pctCadangan: 40,
  pctJasaModal: 33.32,
  pctJasaTransaksi: 6.68,
  pctPengurus: 5,
  pctKaryawan: 5,
  pctPendidikan: 5,
  pctSosial: 5,
};

export async function loadSettingsAsync(): Promise<KopdesSettings> {
  try {
    const settings = await settingsDependencies.getSettingsUseCase.execute();
    return settings as KopdesSettings;
  } catch (error) {
    console.error("Failed to load settings from Supabase", error);
    return defaultSettings;
  }
}

export async function saveSettingsAsync(settings: KopdesSettings): Promise<void> {
  await settingsDependencies.updateSettingsUseCase.execute(settings as any);
}
