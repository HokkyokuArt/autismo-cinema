import { useEffect, useState } from "react";
import type { Movie } from "~/models/movie";
import { EMPTY_ADVANCED_FILTERS, type AdvancedMovieFilters, type RangeFilterKey } from "~/models/movieFilters";
import { Dialog } from "~/components/common/Dialog";
import { Button } from "~/components/common/Button";
import { AutocompleteChipsField } from "~/components/filters/AutocompleteChipsField";
import { RangeSliderField } from "~/components/filters/RangeSliderField";
import { WatchedFilterToggle } from "~/components/filters/WatchedFilterToggle";
import { MULTI_TEXT_FIELDS, RANGE_FIELDS, cloneAdvancedFilters, getFieldSuggestions } from "~/utils/movieFilters";
import type { RangeFilter } from "~/models/movieFilters";

interface AdvancedFiltersDialogProps {
  open: boolean;
  onClose: () => void;
  movies: Movie[];
  activeFilters: AdvancedMovieFilters;
  bounds: Record<RangeFilterKey, RangeFilter | undefined>;
  onApply: (filters: AdvancedMovieFilters) => void;
}

/**
 * Dialog de filtros avançados — trabalha sobre um rascunho local; só afeta o
 * filtro ativo (e limpa o filtro simples) ao clicar em "Aplicar filtros".
 */
export function AdvancedFiltersDialog({
  open,
  onClose,
  movies,
  activeFilters,
  bounds,
  onApply,
}: AdvancedFiltersDialogProps) {
  const [draft, setDraft] = useState<AdvancedMovieFilters>(activeFilters);

  useEffect(() => {
    if (open) setDraft(cloneAdvancedFilters(activeFilters));
  }, [open, activeFilters]);

  function updateMultiText(key: (typeof MULTI_TEXT_FIELDS)[number]["key"], values: string[]) {
    setDraft((current) => ({ ...current, [key]: values }));
  }

  function updateRange(key: RangeFilterKey, value: RangeFilter | undefined) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function handleApply() {
    onApply(draft);
    onClose();
  }

  function handleClearAll() {
    setDraft(EMPTY_ADVANCED_FILTERS);
  }

  return (
    <Dialog open={open} onClose={onClose} title="Filtros avançados" size="lg">
      <div className="flex flex-col gap-5">
        <div>
          <p className="mb-1.5 text-sm font-medium text-mist-200">Assistido</p>
          <WatchedFilterToggle value={draft.watched} onChange={(value) => setDraft((c) => ({ ...c, watched: value }))} />
        </div>

        {MULTI_TEXT_FIELDS.map((field) => (
          <AutocompleteChipsField
            key={field.key}
            label={field.label}
            values={draft[field.key]}
            onChange={(values) => updateMultiText(field.key, values)}
            getSuggestions={(query, selected) => getFieldSuggestions(movies, field, query, selected)}
          />
        ))}

        {RANGE_FIELDS.map((field) => {
          const fieldBounds = bounds[field.key];
          if (!fieldBounds) return null;
          return (
            <RangeSliderField
              key={field.key}
              label={field.label}
              unit={field.unit}
              step={field.step}
              bounds={fieldBounds}
              value={draft[field.key]}
              onChange={(value) => updateRange(field.key, value)}
            />
          );
        })}

        <div className="flex gap-3 border-t border-ink-700 pt-4">
          <Button type="button" variant="ghost" className="flex-1" onClick={handleClearAll}>
            Limpar filtros
          </Button>
          <Button type="button" className="flex-1" onClick={handleApply}>
            Aplicar filtros
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
