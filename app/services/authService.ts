import type { AppUser } from "~/models/user";
import type { Session } from "~/models/session";
import { usersRepository } from "~/storage/repositories/usersRepository";
import { sessionRepository } from "~/storage/repositories/sessionRepository";

const PBKDF2_ITERATIONS = 100_000;
export const SESSION_DURATION_MS = 30 * 60 * 1000;

export class AuthError extends Error {}

function toBase64(bytes: ArrayBuffer): string {
  let binary = "";
  new Uint8Array(bytes).forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function generateSalt(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return toBase64(bytes.buffer);
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: fromBase64(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );
  return toBase64(derivedBits);
}

async function register(name: string, email: string, password: string): Promise<AppUser> {
  if (usersRepository.findByEmail(email)) {
    throw new AuthError("Já existe uma conta com este e-mail.");
  }

  const salt = generateSalt();
  const passwordHash = await hashPassword(password, salt);
  const user: AppUser = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
  };

  usersRepository.add(user);
  return user;
}

async function login(email: string, password: string): Promise<AppUser> {
  const user = usersRepository.findByEmail(email);
  if (!user) {
    throw new AuthError("E-mail ou senha inválidos.");
  }

  const hash = await hashPassword(password, user.salt);
  if (hash !== user.passwordHash) {
    throw new AuthError("E-mail ou senha inválidos.");
  }

  return user;
}

function updateEmail(userId: string, newEmail: string): AppUser {
  const user = usersRepository.findById(userId);
  if (!user) throw new AuthError("Usuário não encontrado.");

  const normalized = newEmail.trim().toLowerCase();
  const existing = usersRepository.findByEmail(normalized);
  if (existing && existing.id !== userId) {
    throw new AuthError("Já existe uma conta com este e-mail.");
  }

  const updated: AppUser = { ...user, email: normalized };
  usersRepository.update(updated);
  return updated;
}

async function updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<AppUser> {
  const user = usersRepository.findById(userId);
  if (!user) throw new AuthError("Usuário não encontrado.");

  const currentHash = await hashPassword(currentPassword, user.salt);
  if (currentHash !== user.passwordHash) {
    throw new AuthError("Senha atual incorreta.");
  }

  const salt = generateSalt();
  const passwordHash = await hashPassword(newPassword, salt);
  const updated: AppUser = { ...user, passwordHash, salt };
  usersRepository.update(updated);
  return updated;
}

function updateAvatarUrl(userId: string, avatarUrl: string | undefined): AppUser {
  const user = usersRepository.findById(userId);
  if (!user) throw new AuthError("Usuário não encontrado.");

  const updated: AppUser = { ...user, avatarUrl: avatarUrl || undefined };
  usersRepository.update(updated);
  return updated;
}

function startSession(userId: string): void {
  sessionRepository.set({ userId, expiresAt: Date.now() + SESSION_DURATION_MS });
}

function extendSession(): void {
  const session = sessionRepository.get();
  if (!session) return;
  sessionRepository.set({ ...session, expiresAt: Date.now() + SESSION_DURATION_MS });
}

/** Retorna a sessão ativa, ou null (limpando o storage) se já expirou. */
function getActiveSession(): Session | null {
  const session = sessionRepository.get();
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    sessionRepository.clear();
    return null;
  }
  return session;
}

function getCurrentUser(): AppUser | null {
  const session = getActiveSession();
  if (!session) return null;
  return usersRepository.findById(session.userId) ?? null;
}

function logout(): void {
  sessionRepository.clear();
}

export const authService = {
  register,
  login,
  updateEmail,
  updatePassword,
  updateAvatarUrl,
  startSession,
  extendSession,
  getActiveSession,
  getCurrentUser,
  logout,
};
