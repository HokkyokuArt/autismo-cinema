import type { AppUser } from "~/models/user";
import { storageService } from "~/storage/storageService";
import { STORAGE_KEYS } from "~/storage/storageKeys";

function getAll(): AppUser[] {
  return storageService.readJSON<AppUser[]>(STORAGE_KEYS.users, []);
}

function saveAll(users: AppUser[]): void {
  storageService.writeJSON(STORAGE_KEYS.users, users);
}

function findByEmail(email: string): AppUser | undefined {
  const normalized = email.trim().toLowerCase();
  return getAll().find((user) => user.email.toLowerCase() === normalized);
}

function findById(id: string): AppUser | undefined {
  return getAll().find((user) => user.id === id);
}

function add(user: AppUser): void {
  saveAll([...getAll(), user]);
}

function update(user: AppUser): void {
  saveAll(getAll().map((existing) => (existing.id === user.id ? user : existing)));
}

export const usersRepository = { getAll, findByEmail, findById, add, update };
