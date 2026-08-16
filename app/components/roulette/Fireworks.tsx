import { useEffect, useRef } from "react";
import gsap from "gsap";

/** Mesma paleta vibrante da roleta. */
const FIREWORK_COLORS = ["#ef4444", "#f59e0b", "#22c55e", "#06b6d4", "#3b82f6", "#a855f7", "#ec4899", "#f97316"];

const PARTICLES_PER_BURST = 28;
const BURST_COUNT = 3;
const BURST_STAGGER_S = 0.15;
const PARTICLE_DURATION_S = 0.6;
// Fogos curtos e diretos — o objetivo é comemorar por um instante, não segurar a
// revelação do filme. Total fixado em ~1s (2 intervalos de stagger + 1 duração + folga).
const TOTAL_DURATION_MS = (BURST_STAGGER_S * (BURST_COUNT - 1) + PARTICLE_DURATION_S + 0.1) * 1000;

interface FireworksProps {
  onComplete: () => void;
}

/**
 * Comemoração antes de revelar o filme — várias explosões de partículas via GSAP.
 * Assim como o giro da roleta, isso não é uma animação incidental: é a própria festa
 * do sorteio, então sempre toca por completo, independente da configuração de
 * animações — só depois disso o resultado abre.
 */
export function Fireworks({ onComplete }: FireworksProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ctx = gsap.context(() => {
      for (let burst = 0; burst < BURST_COUNT; burst++) {
        const originXPercent = 15 + Math.random() * 70;
        const originYPercent = 12 + Math.random() * 45;
        const color = FIREWORK_COLORS[burst % FIREWORK_COLORS.length];

        for (let i = 0; i < PARTICLES_PER_BURST; i++) {
          const particle = document.createElement("div");
          particle.style.position = "absolute";
          particle.style.left = `${originXPercent}%`;
          particle.style.top = `${originYPercent}%`;
          particle.style.width = "10px";
          particle.style.height = "10px";
          particle.style.marginLeft = "-5px";
          particle.style.marginTop = "-5px";
          particle.style.borderRadius = "9999px";
          particle.style.background = color;
          particle.style.boxShadow = `0 0 10px 2px ${color}`;
          particle.style.opacity = "0";
          container.appendChild(particle);

          const angle = (i / PARTICLES_PER_BURST) * Math.PI * 2 + Math.random() * 0.2;
          const distance = 90 + Math.random() * 140;
          const dx = Math.cos(angle) * distance;
          const dy = Math.sin(angle) * distance;
          const delay = burst * BURST_STAGGER_S;

          gsap.fromTo(
            particle,
            { x: 0, y: 0, opacity: 1, scale: 1 },
            {
              x: dx,
              y: dy,
              opacity: 0,
              scale: 0.3,
              duration: PARTICLE_DURATION_S,
              delay,
              ease: "power2.out",
              onComplete: () => particle.remove(),
            },
          );
        }
      }
    }, containerRef);

    const timeout = setTimeout(onComplete, TOTAL_DURATION_MS);
    return () => {
      clearTimeout(timeout);
      ctx.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden" />;
}
