/** Alcance mín/máx pra filtros numéricos (ano, duração, nota). */
export interface RangeFilter {
  min: number;
  max: number;
}

export type WatchedFilterValue = "all" | "watched" | "unwatched";

/** Chaves de `MovieInfo`/`Movie` filtráveis por texto (múltiplos valores, lógica OU entre eles). */
export type MultiTextFilterKey = "title" | "originalTitle" | "director" | "cast" | "genres" | "streamingPlatforms";

export type RangeFilterKey = "releaseYear" | "runtimeMinutes" | "imdbRating";

export interface AdvancedMovieFilters {
  title: string[];
  originalTitle: string[];
  director: string[];
  cast: string[];
  genres: string[];
  streamingPlatforms: string[];
  releaseYear?: RangeFilter;
  runtimeMinutes?: RangeFilter;
  imdbRating?: RangeFilter;
  watched: WatchedFilterValue;
}

export const EMPTY_ADVANCED_FILTERS: AdvancedMovieFilters = {
  title: [],
  originalTitle: [],
  director: [],
  cast: [],
  genres: [],
  streamingPlatforms: [],
  releaseYear: undefined,
  runtimeMinutes: undefined,
  imdbRating: undefined,
  watched: "all",
};
