import type { FiscalYearShu } from "../domain/fiscal-year-shu";
import type { FiscalYearShuRepository } from "../domain/fiscal-year-shu-repository";

export class GetFiscalYearShuUseCase {
  constructor(private readonly fiscalYearShuRepository: FiscalYearShuRepository) {}

  async execute(fiscalYear: number): Promise<FiscalYearShu | null> {
    return this.fiscalYearShuRepository.findByYear(fiscalYear);
  }

  /**
   * Net SHU entered for the fiscal year, or null when none has been entered
   * yet. Throws if fiscal_year_shu can't be read (e.g. the
   * database/migrations/0001_schema.sql migration hasn't been run).
   */
  async netShu(fiscalYear: number): Promise<number | null> {
    const record = await this.execute(fiscalYear);
    return record ? record.netShu : null;
  }
}
