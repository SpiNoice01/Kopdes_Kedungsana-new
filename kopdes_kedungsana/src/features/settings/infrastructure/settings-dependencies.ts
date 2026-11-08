import { SupabaseSettingsRepository } from "./supabase-settings-repository";
import { GetSettingsUseCase } from "../application/get-settings-use-case";
import { UpdateSettingsUseCase } from "../application/update-settings-use-case";

const settingsRepository = new SupabaseSettingsRepository();

export const settingsDependencies = {
  getSettingsUseCase: new GetSettingsUseCase(settingsRepository),
  updateSettingsUseCase: new UpdateSettingsUseCase(settingsRepository),
};
