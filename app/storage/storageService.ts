interface StorageEnvelope<T> {
  schemaVersion: number;
  data: T;
}

function isBrowser(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

function readJSON<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const envelope = JSON.parse(raw) as StorageEnvelope<T>;
    return envelope?.data ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJSON<T>(key: string, data: T, schemaVersion = 1): void {
  if (!isBrowser()) return;
  try {
    const envelope: StorageEnvelope<T> = { schemaVersion, data };
    window.localStorage.setItem(key, JSON.stringify(envelope));
  } catch {
    // localStorage indisponível/cheio — a aplicação segue funcionando sem persistir.
  }
}

function remove(key: string): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignorar
  }
}

export const storageService = { readJSON, writeJSON, remove };
