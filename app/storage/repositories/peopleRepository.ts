import type { Person } from "~/models/person";
import { storageService } from "~/storage/storageService";
import { STORAGE_KEYS } from "~/storage/storageKeys";

function getAll(): Person[] {
  return storageService.readJSON<Person[]>(STORAGE_KEYS.people, []);
}

function saveAll(people: Person[]): void {
  storageService.writeJSON(STORAGE_KEYS.people, people);
}

function findById(id: string): Person | undefined {
  return getAll().find((person) => person.id === id);
}

function add(person: Person): void {
  saveAll([...getAll(), person]);
}

function update(person: Person): void {
  saveAll(getAll().map((existing) => (existing.id === person.id ? person : existing)));
}

function remove(id: string): void {
  saveAll(getAll().filter((person) => person.id !== id));
}

export const peopleRepository = {
  getAll,
  findById,
  add,
  update,
  remove,
  /** Substitui a lista inteira de uma vez — usado pra restaurar um backup. */
  replaceAll: saveAll,
};
