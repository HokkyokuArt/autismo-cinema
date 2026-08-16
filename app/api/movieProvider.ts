import type { MovieInfo } from "~/models/movie";
import { tmdbClient } from "~/api/tmdb/client";
import { omdbClient } from "~/api/omdb/client";
import {
  mapMovieDetails,
  mapSearchResult,
  pickOriginalPosterPath,
  posterUrlFromPath,
} from "~/api/tmdb/mappers";

export interface MovieSearchResult {
  tmdbId: number;
  title: string;
  originalTitle?: string;
  posterUrl?: string;
  releaseYear?: number;
}

export interface PosterWallItem {
  title: string;
  posterUrl: string;
}

export class MovieProviderError extends Error {}

async function searchMovies(query: string): Promise<MovieSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  try {
    const response = await tmdbClient.searchMovies(trimmed);
    return response.results.map(mapSearchResult);
  } catch {
    throw new MovieProviderError("Não foi possível buscar filmes agora. Tente novamente em instantes.");
  }
}

async function getMovieDetails(tmdbId: number): Promise<MovieInfo> {
  let details;
  try {
    details = await tmdbClient.getMovieDetails(tmdbId);
  } catch {
    throw new MovieProviderError("Não foi possível carregar os detalhes deste filme.");
  }

  const info = mapMovieDetails(details);

  try {
    const images = await tmdbClient.getMovieImages(tmdbId, details.original_language);
    const originalPosterPath = pickOriginalPosterPath(
      images.posters,
      details.original_language,
      details.poster_path,
    );
    info.posterUrl = posterUrlFromPath(originalPosterPath);
  } catch {
    // Mantém o pôster (possivelmente localizado) já vindo dos detalhes.
  }

  if (info.imdbId) {
    const imdbRating = await omdbClient.getRatingByImdbId(info.imdbId);
    if (imdbRating !== undefined) {
      info.imdbRating = imdbRating;
    }
  }

  return info;
}

/**
 * Filmes populares só pro mural decorativo da tela de login — puramente estético,
 * então nunca lança: se a API falhar, volta lista vazia e o mural simplesmente não
 * aparece (o login não pode depender disso pra funcionar).
 */
async function getPosterWallMovies(pageCount = 3): Promise<PosterWallItem[]> {
  try {
    const pages = await Promise.all(
      Array.from({ length: pageCount }, (_, index) => tmdbClient.getPopularMovies(index + 1)),
    );
    return pages
      .flatMap((page) => page.results)
      .map(mapSearchResult)
      .filter((movie) => !!movie.posterUrl)
      .map((movie) => ({ title: movie.title, posterUrl: movie.posterUrl as string }));
  } catch {
    return [];
  }
}

export const movieProvider = { searchMovies, getMovieDetails, getPosterWallMovies };
