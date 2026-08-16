export interface Session {
  userId: string;
  /** Epoch ms — janela deslizante de inatividade. */
  expiresAt: number;
}
