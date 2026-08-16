import type { Movie } from "~/models/movie";
import { storageService } from "~/storage/storageService";
import { STORAGE_KEYS } from "~/storage/storageKeys";

function getAll(): Movie[] {
  return storageService.readJSON<Movie[]>(STORAGE_KEYS.movies, []);
}

function saveAll(movies: Movie[]): void {
  storageService.writeJSON(STORAGE_KEYS.movies, movies);
}

function findById(id: string): Movie | undefined {
  return getAll().find((movie) => movie.id === id);
}

function add(movie: Movie): void {
  saveAll([...getAll(), movie]);
}

function update(movie: Movie): void {
  saveAll(getAll().map((existing) => (existing.id === movie.id ? movie : existing)));
}

function remove(id: string): void {
  saveAll(getAll().filter((movie) => movie.id !== id));
}

function removeByListId(listId: string): void {
  saveAll(getAll().filter((movie) => movie.listId !== listId));
}

export const moviesRepository = {
  getAll,
  findById,
  add,
  update,
  remove,
  removeByListId,
  /** Substitui a lista inteira de uma vez — usado pra restaurar um backup. */
  replaceAll: saveAll,
};
