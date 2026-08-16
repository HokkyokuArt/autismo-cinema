import type { TmdbImagesResponse, TmdbMovieDetails, TmdbSearchResponse } from "~/api/types";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

function getHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${import.meta.env.VITE_TMDB_ACCESS_TOKEN}`,
    Accept: "application/json",
  };
}

async function request<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${TMDB_BASE_URL}${path}`);
  url.searchParams.set("language", "pt-BR");
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  const response = await fetch(url, { headers: getHeaders() });
  if (!response.ok) {
    throw new Error(`TMDB request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}

function searchMovies(query: string): Promise<TmdbSearchResponse> {
  return request<TmdbSearchResponse>("/search/movie", { query, include_adult: "false" });
}

function getMovieDetails(tmdbId: number): Promise<TmdbMovieDetails> {
  return request<TmdbMovieDetails>(`/movie/${tmdbId}`, {
    append_to_response: "credits,external_ids,watch/providers",
  });
}

/** Pôsteres sem filtro pelo idioma da UI — usado pra achar o pôster original do filme. */
function getMovieImages(tmdbId: number, originalLanguage?: string): Promise<TmdbImagesResponse> {
  const languages = Array.from(new Set([originalLanguage, "null", "en"].filter(Boolean)));
  return request<TmdbImagesResponse>(`/movie/${tmdbId}/images`, {
    include_image_language: languages.join(","),
  });
}

/** Filmes populares — só usado pro mural decorativo de pôsteres da tela de login. */
function getPopularMovies(page: number): Promise<TmdbSearchResponse> {
  return request<TmdbSearchResponse>("/movie/popular", { page: String(page) });
}

export const tmdbClient = { searchMovies, getMovieDetails, getMovieImages, getPopularMovies };
