import { useCallback, useState } from "react";
import type { AppSettings } from "~/models/settings";
import { settingsRepository } from "~/storage/repositories/settingsRepository";

interface UseSettingsResult {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
}

export function useSettings(): UseSettingsResult {
  const [settings, setSettings] = useState<AppSettings>(() => settingsRepository.get());

  const updateSettings = useCallback((partial: Partial<AppSettings>) => {
    setSettings(settingsRepository.update(partial));
  }, []);

  return { settings, updateSettings };
}
