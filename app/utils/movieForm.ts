import type { MovieInfo, StreamingPlatform } from "~/models/movie";
import { officialUrlFor } from "~/utils/streamingPlatforms";

export interface MovieFormState {
  title: string;
  originalTitle: string;
  posterUrl: string;
  shortDescription: string;
  synopsis: string;
  imdbRating: string;
  imdbId: string;
  imdbUrl: string;
  releaseYear: string;
  runtimeMinutes: string;
  genres: string;
  director: string;
  cast: string;
  streamingPlatforms: string;
}

export const EMPTY_MOVIE_FORM: MovieFormState = {
  title: "",
  originalTitle: "",
  posterUrl: "",
  shortDescription: "",
  synopsis: "",
  imdbRating: "",
  imdbId: "",
  imdbUrl: "",
  releaseYear: "",
  runtimeMinutes: "",
  genres: "",
  director: "",
  cast: "",
  streamingPlatforms: "",
};

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function movieInfoToFormState(info: Partial<MovieInfo>): MovieFormState {
  return {
    title: info.title ?? "",
    originalTitle: info.originalTitle ?? "",
    posterUrl: info.posterUrl ?? "",
    shortDescription: info.shortDescription ?? "",
    synopsis: info.synopsis ?? "",
    imdbRating: info.imdbRating != null ? String(info.imdbRating) : "",
    imdbId: info.imdbId ?? "",
    imdbUrl: info.imdbUrl ?? "",
    releaseYear: info.releaseYear != null ? String(info.releaseYear) : "",
    runtimeMinutes: info.runtimeMinutes != null ? String(info.runtimeMinutes) : "",
    genres: info.genres?.join(", ") ?? "",
    director: info.director ?? "",
    cast: info.cast?.join(", ") ?? "",
    streamingPlatforms: info.streamingPlatforms?.map((platform) => platform.name).join(", ") ?? "",
  };
}

/**
 * `previousPlatforms` vem do filme original (quando editando) — usado só pra
 * recuperar o `logoUrl` já buscado da API, já que o formulário edita
 * plataformas apenas por nome (sem campo pra ícone).
 */
export function formStateToMovieInfo(
  form: MovieFormState,
  previousPlatforms?: StreamingPlatform[],
): MovieInfo {
  const genres = splitList(form.genres);
  const cast = splitList(form.cast);
  const platformNames = splitList(form.streamingPlatforms);
  const imdbRating = form.imdbRating.trim() === "" ? undefined : Number(form.imdbRating);
  const releaseYear = form.releaseYear.trim() === "" ? undefined : Number(form.releaseYear);
  const runtimeMinutes = form.runtimeMinutes.trim() === "" ? undefined : Number(form.runtimeMinutes);

  return {
    title: form.title.trim(),
    originalTitle: form.originalTitle.trim() || undefined,
    posterUrl: form.posterUrl.trim() || undefined,
    shortDescription: form.shortDescription.trim() || undefined,
    synopsis: form.synopsis.trim() || undefined,
    imdbRating: Number.isFinite(imdbRating) ? imdbRating : undefined,
    imdbId: form.imdbId.trim() || undefined,
    imdbUrl: form.imdbUrl.trim() || undefined,
    releaseYear: Number.isFinite(releaseYear) ? releaseYear : undefined,
    runtimeMinutes: Number.isFinite(runtimeMinutes) ? runtimeMinutes : undefined,
    genres: genres.length > 0 ? genres : undefined,
    director: form.director.trim() || undefined,
    cast: cast.length > 0 ? cast : undefined,
    streamingPlatforms:
      platformNames.length > 0
        ? platformNames.map((name) => {
            const previous = previousPlatforms?.find((platform) => platform.name === name);
            return {
              name,
              url: previous?.url ?? officialUrlFor(name),
              logoUrl: previous?.logoUrl,
            };
          })
        : undefined,
  };
}
