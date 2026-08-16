import { useCallback, useState } from "react";
import type { Movie } from "~/models/movie";
import { moviesRepository } from "~/storage/repositories/moviesRepository";

interface UseMoviesResult {
  movies: Movie[];
  addMovie: (movie: Movie) => void;
  updateMovie: (movie: Movie) => void;
  removeMovie: (movieId: string) => void;
  toggleWatched: (movieId: string) => void;
  refresh: () => void;
}

export function useMovies(): UseMoviesResult {
  const [movies, setMovies] = useState<Movie[]>(() => moviesRepository.getAll());

  const refresh = useCallback(() => {
    setMovies(moviesRepository.getAll());
  }, []);

  const addMovie = useCallback((movie: Movie) => {
    moviesRepository.add(movie);
    setMovies(moviesRepository.getAll());
  }, []);

  const updateMovie = useCallback((movie: Movie) => {
    moviesRepository.update(movie);
    setMovies(moviesRepository.getAll());
  }, []);

  const removeMovie = useCallback((movieId: string) => {
    moviesRepository.remove(movieId);
    setMovies(moviesRepository.getAll());
  }, []);

  const toggleWatched = useCallback(
    (movieId: string) => {
      const movie = moviesRepository.findById(movieId);
      if (!movie) return;
      const now = new Date().toISOString();
      const watched = !movie.watched;
      updateMovie({ ...movie, watched, watchedAt: watched ? now : undefined, updatedAt: now });
    },
    [updateMovie],
  );

  return { movies, addMovie, updateMovie, removeMovie, toggleWatched, refresh };
}
