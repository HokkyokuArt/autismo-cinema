import type { RangeFilter } from "~/models/movieFilters";

interface RangeSliderFieldProps {
  label: string;
  unit?: string;
  bounds: RangeFilter;
  value?: RangeFilter;
  step?: number;
  onChange: (value: RangeFilter | undefined) => void;
}

const THUMB_CLASSES =
  "absolute inset-x-0 top-1/2 h-2 w-full -translate-y-1/2 appearance-none bg-transparent pointer-events-none " +
  "[&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 " +
  "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:rounded-full " +
  "[&::-webkit-slider-thumb]:bg-brand-500 [&::-webkit-slider-thumb]:shadow " +
  "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 " +
  "[&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-brand-500";

/** Slider duplo (mín/máx) — limites vêm dos filmes já cadastrados; sem seleção = alcance completo (sem filtrar). */
export function RangeSliderField({ label, unit, bounds, value, step = 1, onChange }: RangeSliderFieldProps) {
  const current = value ?? bounds;
  const isFullRange = current.min === bounds.min && current.max === bounds.max;
  const span = bounds.max - bounds.min || 1;
  const minPercent = ((current.min - bounds.min) / span) * 100;
  const maxPercent = ((current.max - bounds.min) / span) * 100;

  function commit(next: RangeFilter) {
    const clamped = { min: Math.min(next.min, next.max), max: Math.max(next.min, next.max) };
    if (clamped.min === bounds.min && clamped.max === bounds.max) {
      onChange(undefined);
    } else {
      onChange(clamped);
    }
  }

  const formatValue = (n: number) => (unit ? `${n}${unit === "min" ? " min" : unit}` : `${n}`);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-mist-200">{label}</label>
        {!isFullRange && (
          <button type="button" onClick={() => onChange(undefined)} className="text-xs text-mist-400 hover:text-mist-200">
            Limpar
          </button>
        )}
      </div>

      <p className="text-xs text-mist-400">
        {formatValue(current.min)} – {formatValue(current.max)}
      </p>

      <div className="relative h-4">
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-ink-700" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-brand-600"
          style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
        />
        <input
          type="range"
          aria-label={`${label} mínimo`}
          min={bounds.min}
          max={bounds.max}
          step={step}
          value={current.min}
          onChange={(event) => commit({ min: Number(event.target.value), max: current.max })}
          className={THUMB_CLASSES}
        />
        <input
          type="range"
          aria-label={`${label} máximo`}
          min={bounds.min}
          max={bounds.max}
          step={step}
          value={current.max}
          onChange={(event) => commit({ min: current.min, max: Number(event.target.value) })}
          className={THUMB_CLASSES}
        />
      </div>
    </div>
  );
}
