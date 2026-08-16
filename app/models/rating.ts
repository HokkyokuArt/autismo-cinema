/** Avaliação de uma pessoa do grupo sobre um filme — vive fora do Movie de propósito. */
export interface Rating {
  id: string;
  movieId: string;
  personId: string;
  /** 0–10 */
  score: number;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}
