import type { AnimationLevel } from "~/models/settings";
import { useIsCoarsePointer } from "~/hooks/useIsCoarsePointer";

const OPTIONS: { value: AnimationLevel; label: string }[] = [
  { value: "off", label: "Desativadas" },
  { value: "basic", label: "Básicas" },
  { value: "full", label: "Completas" },
];

interface AnimationLevelToggleProps {
  value: AnimationLevel;
  onChange: (value: AnimationLevel) => void;
}

export function AnimationLevelToggle({ value, onChange }: AnimationLevelToggleProps) {
  // "Completas" depende de hover (spotlight, tilt 3D) — não existe em telas touch, então nem oferecemos a opção.
  const isCoarsePointer = useIsCoarsePointer();
  const options = isCoarsePointer ? OPTIONS.filter((option) => option.value !== "full") : OPTIONS;

  return (
    <div role="group" aria-label="Nível de animações" className="flex gap-1 rounded-lg bg-ink-800 p-1">
      {options.map((option) => (
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
