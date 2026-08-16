import type { Movie, MovieInfo } from "~/models/movie";
import type {
  AdvancedMovieFilters,
  MultiTextFilterKey,
  RangeFilter,
  RangeFilterKey,
} from "~/models/movieFilters";
import { EMPTY_ADVANCED_FILTERS } from "~/models/movieFilters";

interface MultiTextFieldConfig {
  key: MultiTextFilterKey;
  label: string;
  getValues: (info: MovieInfo) => string[];
}

interface RangeFieldConfig {
  key: RangeFilterKey;
  label: string;
  unit?: string;
  getValue: (info: MovieInfo) => number | undefined;
  step?: number;
}

export const MULTI_TEXT_FIELDS: MultiTextFieldConfig[] = [
  { key: "title", label: "Título", getValues: (info) => (info.title ? [info.title] : []) },
  {
    key: "originalTitle",
    label: "Título original",
    getValues: (info) => (info.originalTitle ? [info.originalTitle] : []),
  },
  { key: "genres", label: "Gênero", getValues: (info) => info.genres ?? [] },
  { key: "director", label: "Diretor", getValues: (info) => (info.director ? [info.director] : []) },
  { key: "cast", label: "Elenco", getValues: (info) => info.cast ?? [] },
  {
    key: "streamingPlatforms",
    label: "Plataforma",
    getValues: (info) => info.streamingPlatforms?.map((platform) => platform.name) ?? [],
  },
];

export const RANGE_FIELDS: RangeFieldConfig[] = [
  { key: "releaseYear", label: "Ano", getValue: (info) => info.releaseYear },
  { key: "runtimeMinutes", label: "Duração", unit: "min", getValue: (info) => info.runtimeMinutes },
  { key: "imdbRating", label: "Nota IMDb", getValue: (info) => info.imdbRating, step: 0.1 },
];

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** Filtro simples: título ou título original contém o texto (sem acento, case-insensitive). */
export function matchesSimpleQuery(movie: Movie, query: string): boolean {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return true;

  const title = normalize(movie.info.title ?? "");
  const originalTitle = normalize(movie.info.originalTitle ?? "");
  return title.includes(normalizedQuery) || originalTitle.includes(normalizedQuery);
}

function matchesMultiTextField(info: MovieInfo, field: MultiTextFieldConfig, selected: string[]): boolean {
  if (selected.length === 0) return true;
  const values = field.getValues(info).map(normalize);
  if (values.length === 0) return false;
  return selected.some((selectedValue) => {
    const normalizedSelected = normalize(selectedValue);
    return values.some((value) => value.includes(normalizedSelected));
  });
}

function matchesRangeField(info: MovieInfo, field: RangeFieldConfig, range: RangeFilter | undefined): boolean {
  if (!range) return true;
  const value = field.getValue(info);
  if (value == null) return false;
  return value >= range.min && value <= range.max;
}

export function matchesAdvancedFilters(movie: Movie, filters: AdvancedMovieFilters): boolean {
  if (filters.watched === "watched" && !movie.watched) return false;
  if (filters.watched === "unwatched" && movie.watched) return false;

  for (const field of MULTI_TEXT_FIELDS) {
    if (!matchesMultiTextField(movie.info, field, filters[field.key])) return false;
  }
  for (const field of RANGE_FIELDS) {
    if (!matchesRangeField(movie.info, field, filters[field.key])) return false;
  }
  return true;
}

/** true se ao menos um campo do filtro avançado estiver ativo. */
export function isAdvancedFiltersActive(filters: AdvancedMovieFilters): boolean {
  if (filters.watched !== "all") return true;
  if (MULTI_TEXT_FIELDS.some((field) => filters[field.key].length > 0)) return true;
  if (RANGE_FIELDS.some((field) => filters[field.key] != null)) return true;
  return false;
}

/** Sugestões de autocomplete: valores existentes (distintos) do campo que ainda não foram selecionados. */
export function getFieldSuggestions(
  movies: Movie[],
  field: MultiTextFieldConfig,
  query: string,
  alreadySelected: string[],
  limit = 8,
): string[] {
  const normalizedQuery = normalize(query);
  const normalizedSelected = new Set(alreadySelected.map(normalize));
  const seen = new Set<string>();
  const suggestions: string[] = [];

  for (const movie of movies) {
    for (const value of field.getValues(movie.info)) {
      const normalizedValue = normalize(value);
      if (seen.has(normalizedValue) || normalizedSelected.has(normalizedValue)) continue;
      if (normalizedQuery && !normalizedValue.includes(normalizedQuery)) continue;
      seen.add(normalizedValue);
      suggestions.push(value);
      if (suggestions.length >= limit) return suggestions;
    }
  }
  return suggestions;
}

/** Limites reais (mín/máx) de cada campo numérico, a partir dos filmes já cadastrados. */
export function computeFilterBounds(movies: Movie[]): Record<RangeFilterKey, RangeFilter | undefined> {
  const bounds: Record<RangeFilterKey, RangeFilter | undefined> = {
    releaseYear: undefined,
    runtimeMinutes: undefined,
    imdbRating: undefined,
  };

  for (const field of RANGE_FIELDS) {
    let min: number | undefined;
    let max: number | undefined;
    for (const movie of movies) {
      const value = field.getValue(movie.info);
      if (value == null) continue;
      min = min == null ? value : Math.min(min, value);
      max = max == null ? value : Math.max(max, value);
    }
    bounds[field.key] = min != null && max != null ? { min, max } : undefined;
  }

  return bounds;
}

export interface FilterChipDescriptor {
  key: keyof AdvancedMovieFilters;
  label: string;
}

/** Um chip por campo ativo do filtro avançado — usado na barra acima da grade. */
export function describeActiveFilters(
  filters: AdvancedMovieFilters,
  bounds: Record<RangeFilterKey, RangeFilter | undefined>,
): FilterChipDescriptor[] {
  const chips: FilterChipDescriptor[] = [];

  for (const field of MULTI_TEXT_FIELDS) {
    const values = filters[field.key];
    if (values.length > 0) {
      chips.push({ key: field.key, label: `${field.label}: ${values.join(", ")}` });
    }
  }

  for (const field of RANGE_FIELDS) {
    const range = filters[field.key];
    const bound = bounds[field.key];
    if (range && bound && (range.min !== bound.min || range.max !== bound.max)) {
      const unit = field.unit ? ` ${field.unit}` : "";
      chips.push({ key: field.key, label: `${field.label}: ${range.min}${unit} – ${range.max}${unit}` });
    }
  }

  if (filters.watched !== "all") {
    chips.push({
      key: "watched",
      label: filters.watched === "watched" ? "Assistido: sim" : "Assistido: não",
    });
  }

  return chips;
}

export function cloneAdvancedFilters(filters: AdvancedMovieFilters): AdvancedMovieFilters {
  return {
    ...EMPTY_ADVANCED_FILTERS,
    ...filters,
    title: [...filters.title],
    originalTitle: [...filters.originalTitle],
    director: [...filters.director],
    cast: [...filters.cast],
    genres: [...filters.genres],
    streamingPlatforms: [...filters.streamingPlatforms],
  };
}
