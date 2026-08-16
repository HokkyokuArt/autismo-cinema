import type { GridSize } from "~/models/settings";

const OPTIONS: { value: GridSize; label: string }[] = [
  { value: "small", label: "Compacto" },
  { value: "medium", label: "Médio" },
  { value: "large", label: "Grande" },
];

interface GridSizeControlProps {
  value: GridSize;
  onChange: (value: GridSize) => void;
}

export function GridSizeControl({ value, onChange }: GridSizeControlProps) {
  return (
    <div
      role="group"
      aria-label="Tamanho dos pôsteres"
      className="flex gap-1 rounded-lg bg-ink-800 p-1"
    >
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={
            "flex-1 rounded-md px-3 py-1.5 text-center text-xs font-medium whitespace-nowrap transition-colors " +
            (value === option.value
              ? "bg-brand-600 text-white"
              : "text-mist-400 hover:text-mist-50")
          }
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
