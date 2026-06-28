import { supabase } from "@/src/utils/supabase-client";
import type { KopdesSettings } from "../domain/settings";

export class SettingsRepository {
  async getSettings(): Promise<KopdesSettings> {
    const { data, error } = await supabase
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
      principalSavingAmount: Number(data.principal_saving_amount),
      monthlyDuesAmount: Number(data.monthly_dues_amount),
      activeFiscalYear: data.active_fiscal_year,
      pctCadangan: Number(data.pct_cadangan),
      pctJasaModal: Number(data.pct_jasa_modal),
      pctJasaTransaksi: Number(data.pct_jasa_transaksi),
      pctPengurus: Number(data.pct_pengurus),
      pctKaryawan: Number(data.pct_karyawan),
      pctPendidikan: Number(data.pct_pendidikan),
      pctSosial: Number(data.pct_sosial),
    };
  }

  async updateSettings(settings: KopdesSettings): Promise<void> {
    const { error } = await supabase
      .from("cooperative_settings")
      .update({
        cooperative_name: settings.cooperativeName,
        address: settings.address,
        legal_number: settings.legalNumber,
        principal_saving_amount: settings.principalSavingAmount,
        monthly_dues_amount: settings.monthlyDuesAmount,
        active_fiscal_year: settings.activeFiscalYear,
        pct_cadangan: settings.pctCadangan,
        pct_jasa_modal: settings.pctJasaModal,
        pct_jasa_transaksi: settings.pctJasaTransaksi,
        pct_pengurus: settings.pctPengurus,
        pct_karyawan: settings.pctKaryawan,
        pct_pendidikan: settings.pctPendidikan,
        pct_sosial: settings.pctSosial,
        updated_at: new Date().toISOString(),
      })
      .eq("id", settings.id);

    if (error) {
      console.error("Failed to update settings in Supabase", error);
      throw error;
    }
  }
}
