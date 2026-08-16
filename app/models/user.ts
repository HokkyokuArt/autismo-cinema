export interface AppUser {
  id: string;
  name: string;
  email: string;
  /** URL de uma imagem — ausente = avatar com a inicial do nome. */
  avatarUrl?: string;
  /** Base64 de PBKDF2-SHA256 — nunca a senha em texto puro. */
  passwordHash: string;
  /** Base64 do salt aleatório usado para gerar o hash. */
  salt: string;
  createdAt: string;
}
