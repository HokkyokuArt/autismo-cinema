/** DTOs crus das APIs externas — privados ao módulo `api/`, nunca usados fora dele. */

export interface TmdbSearchResult {
  id: number;
  title: string;
  original_title?: string;
  poster_path?: string | null;
  release_date?: string;
  overview?: string;
}

export interface TmdbSearchResponse {
  results: TmdbSearchResult[];
}

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbCastMember {
  name: string;
  order: number;
}

export interface TmdbCrewMember {
  name: string;
  job: string;
}

export interface TmdbWatchProviderEntry {
  provider_name: string;
  logo_path?: string;
}

export interface TmdbWatchProvidersCountry {
  /** Página do TMDB com "onde assistir" pra este filme+região — não é um deep link por provedor. */
  link?: string;
  flatrate?: TmdbWatchProviderEntry[];
  rent?: TmdbWatchProviderEntry[];
  buy?: TmdbWatchProviderEntry[];
}

export interface TmdbWatchProvidersResponse {
  results?: Record<string, TmdbWatchProvidersCountry>;
}

export interface TmdbMovieDetails {
  id: number;
  title: string;
  original_title?: string;
  original_language?: string;
  poster_path?: string | null;
  overview?: string;
  release_date?: string;
  runtime?: number;
  genres?: TmdbGenre[];
  credits?: {
    cast?: TmdbCastMember[];
    crew?: TmdbCrewMember[];
  };
  external_ids?: {
    imdb_id?: string | null;
  };
  "watch/providers"?: TmdbWatchProvidersResponse;
}

export interface TmdbImage {
  file_path: string;
  vote_average: number;
  iso_639_1?: string | null;
}

export interface TmdbImagesResponse {
  posters?: TmdbImage[];
}

export interface OmdbResponse {
  Response: "True" | "False";
  imdbRating?: string;
  Error?: string;
}
