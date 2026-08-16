const SEGMENT_COLORS = [
  "#ef4444",
  "#f59e0b",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
  "#f97316",
];

/** Pontos do octógono (facetas retas, não arcos — mesmo efeito visual de uma roleta em ícone pequeno). */
const POINTS: [number, number][] = [
  [50, 2],
  [83.94, 16.06],
  [98, 50],
  [83.94, 83.94],
  [50, 98],
  [16.06, 83.94],
  [2, 50],
  [16.06, 16.06],
];

interface RouletteIconProps {
  className?: string;
}

/** Roleta colorida (ícone) — usada no botão principal do speed dial. */
export function RouletteIcon({ className }: RouletteIconProps) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={className}>
      {POINTS.map((point, index) => {
        const next = POINTS[(index + 1) % POINTS.length];
        return (
          <path
            key={index}
            d={`M50 50 L${point[0]} ${point[1]} L${next[0]} ${next[1]} Z`}
            fill={SEGMENT_COLORS[index % SEGMENT_COLORS.length]}
          />
        );
      })}
      <circle cx="50" cy="50" r="48" fill="none" stroke="#fef9c3" strokeWidth="4" />
      <circle cx="50" cy="50" r="10" fill="#fef9c3" />
      <circle cx="50" cy="50" r="10" fill="none" stroke="#1f2937" strokeWidth="2" />
    </svg>
  );
}
