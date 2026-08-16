import { useState } from "react";
import { DEFAULT_SORT, type SortCriterion } from "~/models/movieSort";

/** Estado de ordenação — reutilizável (grade atual, futuramente pool da roleta). */
export function useMovieSort() {
  const [criteria, setCriteria] = useState<SortCriterion[]>(DEFAULT_SORT);

  function applySort(next: SortCriterion[]) {
    setCriteria(next.length > 0 ? next : DEFAULT_SORT);
  }

  function resetSort() {
    setCriteria(DEFAULT_SORT);
  }

  const isDefaultSort =
    criteria.length === DEFAULT_SORT.length &&
    criteria.every((c, i) => c.field === DEFAULT_SORT[i].field && c.direction === DEFAULT_SORT[i].direction);

  return { criteria, applySort, resetSort, isDefaultSort };
}

export type UseMovieSortResult = ReturnType<typeof useMovieSort>;
