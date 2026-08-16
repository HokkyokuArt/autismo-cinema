export type SortFieldKey =
  | "title"
  | "originalTitle"
  | "director"
  | "cast"
  | "genres"
  | "streamingPlatforms"
  | "releaseYear"
  | "runtimeMinutes"
  | "imdbRating"
  | "createdAt"
  | "updatedAt"
  | "watchedAt";

export type SortDirection = "asc" | "desc";

export interface SortCriterion {
  field: SortFieldKey;
  direction: SortDirection;
}

/** Padrão: ordem alfabética do título. */
export const DEFAULT_SORT: SortCriterion[] = [{ field: "title", direction: "asc" }];
