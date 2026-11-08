import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/src/utils/supabase-client";
import type { KopdesSettings } from "../domain/settings";
import type { SettingsRepository } from "../domain/settings-repository";

export class SupabaseSettingsRepository implements SettingsRepository {
  constructor(private readonly client: SupabaseClient = supabase) {}

  async getSettings(): Promise<KopdesSettings> {
    const { data, error } = await this.client
      .from("cooperative_settings")
      .select("*")
      .limit(1)
      .single();

    if (error) {
      console.error("Failed to fetch settings from Supabase", error);
      throw error;
    }

    if (!data) {
      throw new Error("Settings not found");
    }

    return {
      id: data.id,
      cooperativeName: data.cooperative_name,
      address: data.address,
      legalNumber: data.legal_number,
      district: data.district || "KABUPATEN CIREBON",
      printLocation: data.print_location || "Cirebon",
      // Nama pengurus sengaja tidak diberi nilai cadangan: kalau kosong di
      // database, laporan menampilkan "(belum diisi)" alih-alih nama orang
      // yang mungkin sudah tidak menjabat.
      chairmanName: data.chairman_name ?? "",
      secretaryName: data.secretary_name ?? "",
      treasurerName: data.treasurer_name ?? "",
      principalSavingAmount: Number(data.principal_saving_amount),
      monthlyDuesAmount: Number(data.monthly_dues_amount),
      activeFiscalYear: data.active_fiscal_year,
      pctCadangan: Number(data.pct_cadangan),
      pctDanaAnggota: Number(data.pct_dana_anggota),
      pctPengurus: Number(data.pct_pengurus),
      pctKaryawan: Number(data.pct_karyawan),
      pctPendidikan: Number(data.pct_pendidikan),
      pctPmdk: Number(data.pct_pmdk ?? 0),
      pctSosial: Number(data.pct_sosial),
      enableInvestasi: Boolean(data.enable_investasi),
    };
  }

  async updateSettings(settings: KopdesSettings): Promise<void> {
    const { error } = await this.client
      .from("cooperative_settings")
      .update({
        cooperative_name: settings.cooperativeName,
        address: settings.address,
        legal_number: settings.legalNumber,
        district: settings.district,
        print_location: settings.printLocation,
        chairman_name: settings.chairmanName,
        secretary_name: settings.secretaryName,
        treasurer_name: settings.treasurerName,
        principal_saving_amount: settings.principalSavingAmount,
        monthly_dues_amount: settings.monthlyDuesAmount,
        active_fiscal_year: settings.activeFiscalYear,
        pct_cadangan: settings.pctCadangan,
        pct_dana_anggota: settings.pctDanaAnggota,
        pct_pengurus: settings.pctPengurus,
        pct_karyawan: settings.pctKaryawan,
        pct_pendidikan: settings.pctPendidikan,
        pct_pmdk: settings.pctPmdk,
        pct_sosial: settings.pctSosial,
        enable_investasi: settings.enableInvestasi,
        updated_at: new Date().toISOString(),
      })
      .eq("id", settings.id);

    if (error) {
      console.error("Failed to update settings in Supabase", error);
      throw error;
    }
  }
}
