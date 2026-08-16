import { useEffect, useMemo, useState } from "react";
import type { Movie } from "~/models/movie";
import { EMPTY_ADVANCED_FILTERS, type AdvancedMovieFilters } from "~/models/movieFilters";
import {
  cloneAdvancedFilters,
  computeFilterBounds,
  isAdvancedFiltersActive,
  matchesAdvancedFilters,
  matchesSimpleQuery,
} from "~/utils/movieFilters";

const SIMPLE_QUERY_DEBOUNCE_MS = 100;

/**
 * Filtro simples (texto, com debounce) e avançado (por campo) são mutuamente
 * exclusivos — usar um sempre limpa o outro. Reutilizável: recebe qualquer
 * lista de filmes (grade da lista atual, ou futuramente o pool da roleta).
 */
export function useMovieFilters(movies: Movie[]) {
  const [simpleQueryInput, setSimpleQueryInput] = useState("");
  const [simpleQuery, setSimpleQuery] = useState("");
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedMovieFilters>(EMPTY_ADVANCED_FILTERS);

  useEffect(() => {
    const timeoutId = setTimeout(() => setSimpleQuery(simpleQueryInput), SIMPLE_QUERY_DEBOUNCE_MS);
    return () => clearTimeout(timeoutId);
  }, [simpleQueryInput]);

  const bounds = useMemo(() => computeFilterBounds(movies), [movies]);
  const isAdvancedActive = useMemo(() => isAdvancedFiltersActive(advancedFilters), [advancedFilters]);

  function updateSimpleQueryInput(value: string) {
    setSimpleQueryInput(value);
    if (value.trim().length > 0 && isAdvancedActive) {
      setAdvancedFilters(EMPTY_ADVANCED_FILTERS);
    }
  }

  /** Chamado ao confirmar o dialog de filtros avançados — sempre limpa o filtro simples. */
  function applyAdvancedFilters(next: AdvancedMovieFilters) {
    setAdvancedFilters(cloneAdvancedFilters(next));
    setSimpleQueryInput("");
    setSimpleQuery("");
  }

  function clearAdvancedField(key: keyof AdvancedMovieFilters) {
    setAdvancedFilters((current) => ({
      ...current,
      [key]: Array.isArray(current[key]) ? [] : key === "watched" ? "all" : undefined,
    }));
  }

  function clearAllAdvancedFilters() {
    setAdvancedFilters(EMPTY_ADVANCED_FILTERS);
  }

  function clearAll() {
    setSimpleQueryInput("");
    setSimpleQuery("");
    setAdvancedFilters(EMPTY_ADVANCED_FILTERS);
  }

  const filteredMovies = useMemo(() => {
    if (isAdvancedActive) {
      return movies.filter((movie) => matchesAdvancedFilters(movie, advancedFilters));
    }
    if (simpleQuery.trim().length > 0) {
      return movies.filter((movie) => matchesSimpleQuery(movie, simpleQuery));
    }
    return movies;
  }, [movies, advancedFilters, isAdvancedActive, simpleQuery]);

  return {
    simpleQueryInput,
    setSimpleQueryInput: updateSimpleQueryInput,
    advancedFilters,
    applyAdvancedFilters,
    clearAdvancedField,
    clearAllAdvancedFilters,
    clearAll,
    isAdvancedActive,
    bounds,
    filteredMovies,
    isFiltering: isAdvancedActive || simpleQuery.trim().length > 0,
  };
}

export type UseMovieFiltersResult = ReturnType<typeof useMovieFilters>;
