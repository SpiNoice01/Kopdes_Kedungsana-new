import type { KopdesSettings } from "./settings";

export interface SettingsRepository {
  getSettings(): Promise<KopdesSettings>;
  updateSettings(settings: KopdesSettings): Promise<void>;
}
