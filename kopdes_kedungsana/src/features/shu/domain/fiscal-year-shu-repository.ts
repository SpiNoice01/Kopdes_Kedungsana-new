import type { FiscalYearShu } from "./fiscal-year-shu";

export interface FiscalYearShuRepository {
  findByYear(fiscalYear: number): Promise<FiscalYearShu | null>;
  save(fiscalYear: number, netShu: number): Promise<void>;
}
