export interface MovieList {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

/** MovieList com contagem de filmes — usado na gaveta de listas. */
export interface MovieListWithStats extends MovieList {
  totalCount: number;
  watchedCount: number;
}
