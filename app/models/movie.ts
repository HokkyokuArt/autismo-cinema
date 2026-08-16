export interface StreamingPlatform {
  name: string;
  /** Home oficial da plataforma, quando conhecida — nunca um deep link por título. */
  url?: string;
  /** Ícone oficial da plataforma, vindo do TMDB — ausente em cadastro manual. */
  logoUrl?: string;
}

/** Dados de catálogo (vindos de API ou preenchidos manualmente) — nunca dados do grupo. */
export interface MovieInfo {
  title: string;
  originalTitle?: string;
  posterUrl?: string;
  shortDescription?: string;
  synopsis?: string;
  imdbRating?: number;
  imdbId?: string;
  imdbUrl?: string;
  releaseYear?: number;
  runtimeMinutes?: number;
  genres?: string[];
  director?: string;
  cast?: string[];
  streamingPlatforms?: StreamingPlatform[];
}

export type MovieSource = "api" | "manual" | "api+manual";

export interface Movie {
  id: string;
  listId: string;
  info: MovieInfo;
  source: MovieSource;
  watched: boolean;
  /** Quando foi marcado como assistido pela última vez — ausente se nunca assistido ou desmarcado. */
  watchedAt?: string;
  createdAt: string;
  updatedAt: string;
}
