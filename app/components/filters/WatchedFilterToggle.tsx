import type { WatchedFilterValue } from "~/models/movieFilters";

const OPTIONS: { value: WatchedFilterValue; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "watched", label: "Assistidos" },
  { value: "unwatched", label: "Não assistidos" },
];

interface WatchedFilterToggleProps {
  value: WatchedFilterValue;
  onChange: (value: WatchedFilterValue) => void;
}

export function WatchedFilterToggle({ value, onChange }: WatchedFilterToggleProps) {
  return (
    <div role="group" aria-label="Filtrar por assistido" className="flex gap-1 rounded-lg bg-ink-800 p-1">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={
            "flex-1 rounded-md px-3 py-1.5 text-center text-xs font-medium whitespace-nowrap transition-colors " +
            (value === option.value ? "bg-brand-600 text-white" : "text-mist-400 hover:text-mist-50")
          }
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
