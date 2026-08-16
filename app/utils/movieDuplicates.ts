import type { Movie } from "~/models/movie";

interface MovieCandidate {
  imdbId?: string;
  title: string;
}

/**
 * Mesmo filme = mesmo imdbId (quando os dois têm) ou título igual (sem
 * diferenciar maiúsculas/espaços). `excludeMovieId` evita comparar consigo
 * mesmo ao editar.
 */
export function findDuplicateMovie(
  movies: Movie[],
  candidate: MovieCandidate,
  excludeMovieId?: string,
): Movie | undefined {
  const normalizedTitle = candidate.title.trim().toLowerCase();

  return movies.find((movie) => {
    if (movie.id === excludeMovieId) return false;

    if (candidate.imdbId && movie.info.imdbId) {
      return movie.info.imdbId === candidate.imdbId;
    }

    return movie.info.title.trim().toLowerCase() === normalizedTitle;
  });
}
