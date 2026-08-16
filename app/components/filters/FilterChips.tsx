import type { AdvancedMovieFilters, RangeFilterKey } from "~/models/movieFilters";
import type { RangeFilter } from "~/models/movieFilters";
import { describeActiveFilters } from "~/utils/movieFilters";

interface FilterChipsProps {
  filters: AdvancedMovieFilters;
  bounds: Record<RangeFilterKey, RangeFilter | undefined>;
  onRemove: (key: keyof AdvancedMovieFilters) => void;
}

/** Um chip por campo ativo do filtro avançado — filtro simples não aparece aqui. */
export function FilterChips({ filters, bounds, onRemove }: FilterChipsProps) {
  const chips = describeActiveFilters(filters, bounds);
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-4 pt-3 sm:px-6">
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="flex items-center gap-1.5 rounded-full bg-ink-800 py-1 pr-1.5 pl-3 text-xs text-mist-200"
        >
          {chip.label}
          <button
            type="button"
            onClick={() => onRemove(chip.key)}
            aria-label={`Remover filtro ${chip.label}`}
            className="rounded-full p-0.5 text-mist-400 hover:bg-ink-700 hover:text-mist-50"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3 w-3">
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                d="M6 6l12 12M18 6L6 18"
              />
            </svg>
          </button>
        </span>
      ))}
    </div>
  );
}
