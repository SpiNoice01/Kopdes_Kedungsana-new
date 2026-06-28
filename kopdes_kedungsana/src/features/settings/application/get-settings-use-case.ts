import { SettingsRepository } from "../infrastructure/settings-repository";
import type { KopdesSettings } from "../domain/settings";

export class GetSettingsUseCase {
  constructor(private readonly settingsRepository: SettingsRepository) {}

  async execute(): Promise<KopdesSettings> {
    return await this.settingsRepository.getSettings();
  }
}
