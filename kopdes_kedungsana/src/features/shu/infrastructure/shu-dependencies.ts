import { GetFiscalYearShuUseCase } from "../application/get-fiscal-year-shu-use-case";
import { SaveFiscalYearShuUseCase } from "../application/save-fiscal-year-shu-use-case";
import { SupabaseFiscalYearShuRepository } from "./supabase-fiscal-year-shu-repository";

const fiscalYearShuRepository = new SupabaseFiscalYearShuRepository();

export const shuDependencies = {
  getFiscalYearShuUseCase: new GetFiscalYearShuUseCase(fiscalYearShuRepository),
  saveFiscalYearShuUseCase: new SaveFiscalYearShuUseCase(fiscalYearShuRepository),
};
