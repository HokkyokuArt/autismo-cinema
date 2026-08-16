interface MovieFilterBarProps {
  simpleQueryInput: string;
  onSimpleQueryChange: (value: string) => void;
  isAdvancedActive: boolean;
  isFiltering: boolean;
  onOpenAdvanced: () => void;
  onClearAll: () => void;
  isSortActive: boolean;
  onOpenSort: () => void;
}

const ICON_BUTTON_BASE = "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors";
const ICON_BUTTON_INACTIVE = "bg-ink-800 text-mist-200 hover:bg-ink-700";
const ICON_BUTTON_ACTIVE = "bg-brand-600 text-white hover:bg-brand-500";

/** Barra de filtros: busca simples (título/título original) + filtros avançados + ordenação + limpar tudo. */
export function MovieFilterBar({
  simpleQueryInput,
  onSimpleQueryChange,
  isAdvancedActive,
  isFiltering,
  onOpenAdvanced,
  onClearAll,
  isSortActive,
  onOpenSort,
}: MovieFilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 px-4 pt-4 sm:px-6">
      <div className="relative min-w-0 flex-1 sm:max-w-xs">
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-mist-400"
        >
          <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={simpleQueryInput}
          onChange={(event) => onSimpleQueryChange(event.target.value)}
          disabled={isAdvancedActive}
          placeholder="Buscar por título…"
          className="w-full rounded-lg border border-ink-600 bg-ink-800 py-2 pr-8 pl-8 text-sm text-mist-50 placeholder:text-mist-400 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
        />
        {simpleQueryInput.length > 0 && (
          <button
            type="button"
            onClick={() => onSimpleQueryChange("")}
            aria-label="Limpar busca"
            className="absolute top-1/2 right-2 -translate-y-1/2 text-mist-400 hover:text-mist-100"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                d="M6 6l12 12M18 6L6 18"
              />
            </svg>
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onOpenAdvanced}
        aria-label="Filtros avançados"
        title="Filtros avançados"
        className={ICON_BUTTON_BASE + " " + (isAdvancedActive ? ICON_BUTTON_ACTIVE : ICON_BUTTON_INACTIVE)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 6h16M7 12h10M10 18h4"
          />
        </svg>
      </button>

      <button
        type="button"
        onClick={onOpenSort}
        aria-label="Ordenar filmes"
        title="Ordenar filmes"
        className={ICON_BUTTON_BASE + " " + (isSortActive ? ICON_BUTTON_ACTIVE : ICON_BUTTON_INACTIVE)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7 4v16m0 0-3-3m3 3 3-3M17 20V4m0 0-3 3m3-3 3 3"
          />
        </svg>
      </button>

      {isFiltering && (
        <button
          type="button"
          onClick={onClearAll}
          aria-label="Limpar filtros"
          title="Limpar filtros"
          className={ICON_BUTTON_BASE + " " + ICON_BUTTON_INACTIVE}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 6l12 12M18 6L6 18"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
