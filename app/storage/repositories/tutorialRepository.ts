import type { TutorialPartId, TutorialProgress } from "~/models/tutorial";
import { storageService } from "~/storage/storageService";
import { STORAGE_KEYS } from "~/storage/storageKeys";

type TutorialStore = Record<string, TutorialProgress>;

const EMPTY_PROGRESS: TutorialProgress = { completedParts: [], dismissed: false };

function getAll(): TutorialStore {
  return storageService.readJSON<TutorialStore>(STORAGE_KEYS.tutorial, {});
}

function get(userId: string): TutorialProgress {
  return getAll()[userId] ?? EMPTY_PROGRESS;
}

/** Nunca existiu progresso salvo pra esse usuário — é a deixa pra disparar o tutorial sozinho. */
function isUnseen(userId: string): boolean {
  return getAll()[userId] === undefined;
}

function save(userId: string, progress: TutorialProgress): TutorialProgress {
  const all = getAll();
  all[userId] = progress;
  storageService.writeJSON(STORAGE_KEYS.tutorial, all);
  return progress;
}

function markPartDone(userId: string, partId: TutorialPartId): TutorialProgress {
  const current = get(userId);
  if (current.completedParts.includes(partId)) return current;
  return save(userId, { ...current, completedParts: [...current.completedParts, partId] });
}

function dismiss(userId: string): TutorialProgress {
  return save(userId, { ...get(userId), dismissed: true });
}

/** Sem `partId`: reseta tudo (permite "refazer desde o início"). Com `partId`: só remove aquela parte da lista de concluídas. */
function reset(userId: string, partId?: TutorialPartId): TutorialProgress {
  if (!partId) return save(userId, { completedParts: [], dismissed: false });
  const current = get(userId);
  return save(userId, {
    ...current,
    dismissed: false,
    completedParts: current.completedParts.filter((id) => id !== partId),
  });
}

export const tutorialRepository = { get, isUnseen, markPartDone, dismiss, reset };
