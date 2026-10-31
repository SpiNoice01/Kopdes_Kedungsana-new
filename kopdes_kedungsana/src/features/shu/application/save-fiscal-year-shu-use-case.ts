import type { FiscalYearShuRepository } from "../domain/fiscal-year-shu-repository";

type SaveFiscalYearShuResult =
  | { success: true; netShu: number }
  | { success: false; message: string };

export class SaveFiscalYearShuUseCase {
  constructor(private readonly fiscalYearShuRepository: FiscalYearShuRepository) {}

  async execute(fiscalYear: number, netShu: number): Promise<SaveFiscalYearShuResult> {
    const value = Number(netShu);

    if (!Number.isFinite(value)) {
      return { success: false, message: "SHU bersih wajib berupa angka." };
    }

    if (value < 0) {
      return {
        success: false,
        message: "SHU bersih tidak boleh negatif. Jika koperasi merugi, isi 0 (tidak ada SHU yang dibagikan).",
      };
    }

    if (!Number.isInteger(value)) {
      return { success: false, message: "SHU bersih wajib dalam Rupiah bulat (tanpa desimal)." };
    }

    await this.fiscalYearShuRepository.save(fiscalYear, value);

    return { success: true, netShu: value };
  }
}
