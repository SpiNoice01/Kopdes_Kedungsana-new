import { SettingsRepository } from "../infrastructure/settings-repository";
import type { KopdesSettings } from "../domain/settings";

export class UpdateSettingsUseCase {
  constructor(private readonly settingsRepository: SettingsRepository) {}

  async execute(settings: KopdesSettings): Promise<void> {
    if (!settings.id) throw new Error("Settings ID is required for update");
    return await this.settingsRepository.updateSettings(settings);
  }
}
