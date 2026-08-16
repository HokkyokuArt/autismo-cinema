import type { Rating } from "~/models/rating";
import { storageService } from "~/storage/storageService";
import { STORAGE_KEYS } from "~/storage/storageKeys";

function getAll(): Rating[] {
  return storageService.readJSON<Rating[]>(STORAGE_KEYS.ratings, []);
}

function saveAll(ratings: Rating[]): void {
  storageService.writeJSON(STORAGE_KEYS.ratings, ratings);
}

function findByMovieId(movieId: string): Rating[] {
  return getAll().filter((rating) => rating.movieId === movieId);
}

function add(rating: Rating): void {
  saveAll([...getAll(), rating]);
}

function update(rating: Rating): void {
  saveAll(getAll().map((existing) => (existing.id === rating.id ? rating : existing)));
}

function remove(id: string): void {
  saveAll(getAll().filter((rating) => rating.id !== id));
}

function removeByMovieId(movieId: string): void {
  saveAll(getAll().filter((rating) => rating.movieId !== movieId));
}

export const ratingsRepository = {
  getAll,
  findByMovieId,
  add,
  update,
  remove,
  removeByMovieId,
  /** Substitui a lista inteira de uma vez — usado pra restaurar um backup. */
  replaceAll: saveAll,
};
