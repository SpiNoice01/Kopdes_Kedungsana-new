import type { FiscalYearShu } from "../domain/fiscal-year-shu";
import type { FiscalYearShuRepository } from "../domain/fiscal-year-shu-repository";

export class GetFiscalYearShuUseCase {
  constructor(private readonly fiscalYearShuRepository: FiscalYearShuRepository) {}

  async execute(fiscalYear: number): Promise<FiscalYearShu | null> {
    return this.fiscalYearShuRepository.findByYear(fiscalYear);
  }
}
