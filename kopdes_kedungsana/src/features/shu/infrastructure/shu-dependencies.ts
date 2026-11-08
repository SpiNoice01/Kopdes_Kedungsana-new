import { GetFiscalYearShuUseCase } from "../application/get-fiscal-year-shu-use-case";
import { SaveFiscalYearShuUseCase } from "../application/save-fiscal-year-shu-use-case";
import { GetShuBasisRowsUseCase } from "../application/get-shu-basis-rows-use-case";
import { SupabaseFiscalYearShuRepository } from "./supabase-fiscal-year-shu-repository";
import { memberDependencies } from "@/src/features/member/infrastructure/member-dependencies";

const fiscalYearShuRepository = new SupabaseFiscalYearShuRepository();

export const shuDependencies = {
  getFiscalYearShuUseCase: new GetFiscalYearShuUseCase(fiscalYearShuRepository),
  saveFiscalYearShuUseCase: new SaveFiscalYearShuUseCase(fiscalYearShuRepository),
  getShuBasisRowsUseCase: new GetShuBasisRowsUseCase(
    memberDependencies.getMembersUseCase,
    memberDependencies.getMemberLedgersUseCase,
  ),
};
