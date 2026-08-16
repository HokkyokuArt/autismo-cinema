import type { MovieList } from "~/models/movieList";
import { storageService } from "~/storage/storageService";
import { STORAGE_KEYS } from "~/storage/storageKeys";

function getAll(): MovieList[] {
  return storageService.readJSON<MovieList[]>(STORAGE_KEYS.lists, []);
}

function saveAll(lists: MovieList[]): void {
  storageService.writeJSON(STORAGE_KEYS.lists, lists);
}

function findById(id: string): MovieList | undefined {
  return getAll().find((list) => list.id === id);
}

function add(list: MovieList): void {
  saveAll([...getAll(), list]);
}

function update(list: MovieList): void {
  saveAll(getAll().map((existing) => (existing.id === list.id ? list : existing)));
}

function remove(id: string): void {
  saveAll(getAll().filter((list) => list.id !== id));
}

/** Reordena pela sequência de ids informada — a ordem da lista é só a ordem do array salvo. */
function reorder(orderedIds: string[]): void {
  const all = getAll();
  const byId = new Map(all.map((list) => [list.id, list]));
  const reordered = orderedIds.map((id) => byId.get(id)).filter((list): list is MovieList => list !== undefined);
  // Ids que não vieram no array informado (não deveria acontecer) vão pro fim, sem se perder.
  const missing = all.filter((list) => !orderedIds.includes(list.id));
  saveAll([...reordered, ...missing]);
}

export const listsRepository = {
  getAll,
  findById,
  add,
  update,
  remove,
  reorder,
  /** Substitui a lista inteira de uma vez — usado pra restaurar um backup. */
  replaceAll: saveAll,
};
