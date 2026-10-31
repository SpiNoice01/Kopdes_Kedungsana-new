import { supabase } from "@/src/utils/supabase-client";
import type { FiscalYearShu } from "../domain/fiscal-year-shu";
import type { FiscalYearShuRepository } from "../domain/fiscal-year-shu-repository";

export class SupabaseFiscalYearShuRepository implements FiscalYearShuRepository {
  async findByYear(fiscalYear: number): Promise<FiscalYearShu | null> {
    const { data, error } = await supabase
      .from("fiscal_year_shu")
      .select("*")
      .eq("fiscal_year", fiscalYear)
      .maybeSingle();

    if (error) {
      console.error("Supabase Error [fiscal_year_shu findByYear]:", error);
      throw error;
    }

    if (!data) return null;

    return {
      fiscalYear: data.fiscal_year,
      netShu: Number(data.net_shu),
      updatedAt: data.updated_at,
    };
  }

  async save(fiscalYear: number, netShu: number): Promise<void> {
    const { error } = await supabase
      .from("fiscal_year_shu")
      .upsert(
        { fiscal_year: fiscalYear, net_shu: netShu, updated_at: new Date().toISOString() },
        { onConflict: "fiscal_year" },
      );

    if (error) {
      console.error("Supabase Error [fiscal_year_shu save]:", error);
      throw error;
    }
  }
}
