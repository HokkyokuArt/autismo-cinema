import { useEffect, useState, type CSSProperties } from "react";

const COLORS = ["#f5c451", "#a78bfa", "#f472b6", "#60a5fa", "#34d399", "#fb7185"];
const PARTICLES_PER_BURST = 36;
const BURST_COUNT = 12;
const BURST_STAGGER_MS = 150;
const PARTICLE_LIFETIME_MS = 1100;

interface Burst {
  id: number;
  x: number;
  y: number;
  delay: number;
  color: string;
}

interface FireworksProps {
  onDone: () => void;
}

/** Comemoração ao completar o Konami code: estouros grandes e brilhantes de partículas coloridas que somem sozinhos. */
export function Fireworks({ onDone }: FireworksProps) {
  const [bursts] = useState<Burst[]>(() =>
    Array.from({ length: BURST_COUNT }, (_, i) => ({
      id: i,
      x: 15 + Math.random() * 70,
      y: 10 + Math.random() * 50,
      delay: i * BURST_STAGGER_MS,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    })),
  );

  useEffect(() => {
    const timeout = setTimeout(onDone, BURST_STAGGER_MS * BURST_COUNT + PARTICLE_LIFETIME_MS + 300);
    return () => clearTimeout(timeout);
  }, [onDone]);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {bursts.map((burst) => (
        <div key={burst.id} className="absolute" style={{ left: `${burst.x}%`, top: `${burst.y}%` }}>
          <span
            className="firework-flash"
            style={{ backgroundColor: burst.color, animationDelay: `${burst.delay}ms` }}
          />
          {Array.from({ length: PARTICLES_PER_BURST }).map((_, i) => {
            const angle = (i / PARTICLES_PER_BURST) * Math.PI * 2;
            const distance = 140 + Math.random() * 160;
            const style: CSSProperties = {
              backgroundColor: burst.color,
              boxShadow: `0 0 14px 4px ${burst.color}`,
              animationDelay: `${burst.delay}ms`,
              "--dx": `${Math.cos(angle) * distance}px`,
              "--dy": `${Math.sin(angle) * distance}px`,
            } as CSSProperties;
            return <span key={i} className="firework-particle" style={style} />;
          })}
        </div>
      ))}
    </div>
  );
}
