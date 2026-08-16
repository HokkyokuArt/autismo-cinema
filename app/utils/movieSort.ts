import type { Movie } from "~/models/movie";
import type { SortCriterion, SortDirection, SortFieldKey } from "~/models/movieSort";

type FieldKind = "text" | "number" | "date";

interface SortFieldConfig {
  key: SortFieldKey;
  label: string;
  kind: FieldKind;
  getValue: (movie: Movie) => string | number | undefined;
}

export const SORT_FIELDS: SortFieldConfig[] = [
  { key: "title", label: "Título", kind: "text", getValue: (movie) => movie.info.title },
  { key: "originalTitle", label: "Título original", kind: "text", getValue: (movie) => movie.info.originalTitle },
  { key: "director", label: "Diretor", kind: "text", getValue: (movie) => movie.info.director },
  { key: "cast", label: "Elenco", kind: "text", getValue: (movie) => movie.info.cast?.[0] },
  { key: "genres", label: "Gênero", kind: "text", getValue: (movie) => movie.info.genres?.[0] },
  {
    key: "streamingPlatforms",
    label: "Plataforma",
    kind: "text",
    getValue: (movie) => movie.info.streamingPlatforms?.[0]?.name,
  },
  { key: "releaseYear", label: "Ano", kind: "number", getValue: (movie) => movie.info.releaseYear },
  { key: "runtimeMinutes", label: "Duração", kind: "number", getValue: (movie) => movie.info.runtimeMinutes },
  { key: "imdbRating", label: "Nota IMDb", kind: "number", getValue: (movie) => movie.info.imdbRating },
  { key: "createdAt", label: "Adicionado", kind: "date", getValue: (movie) => movie.createdAt },
  { key: "updatedAt", label: "Editado", kind: "date", getValue: (movie) => movie.updatedAt },
  { key: "watchedAt", label: "Visto", kind: "date", getValue: (movie) => movie.watchedAt },
];

export function sortFieldConfig(key: SortFieldKey): SortFieldConfig {
  const field = SORT_FIELDS.find((f) => f.key === key);
  if (!field) throw new Error(`Campo de ordenação desconhecido: ${key}`);
  return field;
}

/** Rótulo contextual pra cada direção, conforme o tipo do campo. */
export function directionLabel(kind: FieldKind, direction: SortDirection): string {
  if (kind === "date") return direction === "desc" ? "Mais recentes primeiro" : "Mais antigos primeiro";
  if (kind === "number") return direction === "desc" ? "Maior primeiro" : "Menor primeiro";
  return direction === "asc" ? "A-Z" : "Z-A";
}

function compareValues(a: string | number | undefined, b: string | number | undefined, direction: SortDirection): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;

  const raw =
    typeof a === "number" && typeof b === "number"
      ? a - b
      : String(a).localeCompare(String(b), "pt-BR", { sensitivity: "base" });

  return direction === "asc" ? raw : -raw;
}

export function compareMovies(a: Movie, b: Movie, criteria: SortCriterion[]): number {
  for (const criterion of criteria) {
    const field = sortFieldConfig(criterion.field);
    const result = compareValues(field.getValue(a), field.getValue(b), criterion.direction);
    if (result !== 0) return result;
  }
  return 0;
}

export function sortMovies(movies: Movie[], criteria: SortCriterion[]): Movie[] {
  if (criteria.length === 0) return movies;
  return [...movies].sort((a, b) => compareMovies(a, b, criteria));
}
