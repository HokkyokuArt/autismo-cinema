import type { Session } from "~/models/session";
import { storageService } from "~/storage/storageService";
import { STORAGE_KEYS } from "~/storage/storageKeys";

function get(): Session | null {
  return storageService.readJSON<Session | null>(STORAGE_KEYS.session, null);
}

function set(session: Session): void {
  storageService.writeJSON(STORAGE_KEYS.session, session);
}

function clear(): void {
  storageService.remove(STORAGE_KEYS.session);
}

export const sessionRepository = { get, set, clear };
