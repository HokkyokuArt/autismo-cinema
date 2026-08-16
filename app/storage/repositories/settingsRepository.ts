import type { AppSettings } from "~/models/settings";
import { storageService } from "~/storage/storageService";
import { STORAGE_KEYS } from "~/storage/storageKeys";

const DEFAULT_SETTINGS: AppSettings = { gridSize: "medium", animationLevel: "basic" };

function get(): AppSettings {
  // `animationsEnabled` era o campo antigo (boolean) de antes dos 3 níveis existirem —
  // só migramos o caso "false" pra "off"; qualquer outra coisa cai no padrão "basic".
  const stored = storageService.readJSON<Partial<AppSettings> & { animationsEnabled?: boolean }>(
    STORAGE_KEYS.settings,
    {},
  );
  const { animationsEnabled, ...rest } = stored;
  const animationLevel = rest.animationLevel ?? (animationsEnabled === false ? "off" : DEFAULT_SETTINGS.animationLevel);
  return { ...DEFAULT_SETTINGS, ...rest, animationLevel };
}

function update(partial: Partial<AppSettings>): AppSettings {
  const next = { ...get(), ...partial };
  storageService.writeJSON(STORAGE_KEYS.settings, next);
  return next;
}

export const settingsRepository = { get, update, DEFAULT_SETTINGS };
