import type { MovieInfo, StreamingPlatform } from "~/models/movie";
import type { MovieSearchResult } from "~/api/movieProvider";
import type { TmdbImage, TmdbMovieDetails, TmdbSearchResult } from "~/api/types";
import { officialUrlFor } from "~/utils/streamingPlatforms";

const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";
const TMDB_LOGO_BASE_URL = "https://image.tmdb.org/t/p/w92";
const WATCH_REGION = "BR";
const MAX_CAST_MEMBERS = 8;
const SHORT_DESCRIPTION_MAX_LENGTH = 140;

export function posterUrlFromPath(path?: string | null): string | undefined {
  return path ? `${TMDB_IMAGE_BASE_URL}${path}` : undefined;
}

/**
 * O `poster_path` de `/movie/{id}` pode vir localizado (com o título traduzido
 * desenhado na imagem). Preferimos o pôster no idioma original do filme, depois
 * um sem texto (textless), caindo pro que já tínhamos se nada for encontrado.
 */
export function pickOriginalPosterPath(
  posters: TmdbImage[] | undefined,
  originalLanguage: string | undefined,
  fallbackPath: string | null | undefined,
): string | null | undefined {
  if (!posters || posters.length === 0) return fallbackPath;

  const byOriginalLanguage = originalLanguage
    ? posters.find((poster) => poster.iso_639_1 === originalLanguage)
    : undefined;
  const textless = posters.find((poster) => !poster.iso_639_1);

  return (byOriginalLanguage ?? textless ?? posters[0]).file_path;
}

function releaseYearFromDate(date?: string): number | undefined {
  if (!date) return undefined;
  const year = Number(date.slice(0, 4));
  return Number.isFinite(year) ? year : undefined;
}

function originalTitleIfDifferent(title: string, originalTitle?: string): string | undefined {
  return originalTitle && originalTitle !== title ? originalTitle : undefined;
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

export function mapSearchResult(raw: TmdbSearchResult): MovieSearchResult {
  return {
    tmdbId: raw.id,
    title: raw.title,
    originalTitle: originalTitleIfDifferent(raw.title, raw.original_title),
    posterUrl: posterUrlFromPath(raw.poster_path),
    releaseYear: releaseYearFromDate(raw.release_date),
  };
}

function mapStreamingPlatforms(details: TmdbMovieDetails): StreamingPlatform[] | undefined {
  const country = details["watch/providers"]?.results?.[WATCH_REGION];
  if (!country) return undefined;

  const names = new Set<string>();
  const logoPathByName = new Map<string, string>();
  [...(country.flatrate ?? []), ...(country.rent ?? []), ...(country.buy ?? [])].forEach((entry) => {
    names.add(entry.provider_name);
    if (entry.logo_path && !logoPathByName.has(entry.provider_name)) {
      logoPathByName.set(entry.provider_name, entry.logo_path);
    }
  });

  if (names.size === 0) return undefined;
  return Array.from(names).map((name) => {
    const logoPath = logoPathByName.get(name);
    return {
      name,
      // Página do TMDB pra este filme — melhor aproximação disponível sem a API paga do JustWatch.
      url: country.link ?? officialUrlFor(name),
      logoUrl: logoPath ? `${TMDB_LOGO_BASE_URL}${logoPath}` : undefined,
    };
  });
}

export function mapMovieDetails(details: TmdbMovieDetails): MovieInfo {
  const director = details.credits?.crew?.find((member) => member.job === "Director")?.name;
  const cast = details.credits?.cast
    ?.slice(0, MAX_CAST_MEMBERS)
    .map((member) => member.name);
  const imdbId = details.external_ids?.imdb_id ?? undefined;

  return {
    title: details.title,
    originalTitle: originalTitleIfDifferent(details.title, details.original_title),
    posterUrl: posterUrlFromPath(details.poster_path),
    shortDescription: details.overview
      ? truncate(details.overview, SHORT_DESCRIPTION_MAX_LENGTH)
      : undefined,
    synopsis: details.overview || undefined,
    imdbId,
    imdbUrl: imdbId ? `https://www.imdb.com/title/${imdbId}/` : undefined,
    releaseYear: releaseYearFromDate(details.release_date),
    runtimeMinutes: details.runtime || undefined,
    genres: details.genres?.map((genre) => genre.name),
    director,
    cast: cast && cast.length > 0 ? cast : undefined,
    streamingPlatforms: mapStreamingPlatforms(details),
  };
}
