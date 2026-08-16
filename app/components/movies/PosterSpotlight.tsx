import { useEffect, useRef } from "react";

/** A bola de luz cobre esse tanto da altura do card focado. */
const SPOT_SIZE_RATIO = 1.15;
/** Raio do holofote "passeando" pela tela, fora de qualquer card. */
const ROAM_RADIUS_PX = 160;
/** Seletor marcado pelos cards em nível de animação "full" — define o tamanho do furo de luz. */
const CARD_SELECTOR = "[data-tilt-card]";

interface PosterSpotlightProps {
  /**
   * Luzes acesas (padrão): sem sombreado nenhum, só a carta laminada/inclinada.
   * Luzes apagadas (easter egg via Ctrl+F): tela sempre escura, com um holofote
   * sempre aceso seguindo o mouse — do tamanho do card quando estiver em cima
   * de um, ou de um raio menor "passeando" pelo resto da tela.
   */
  lightsOn: boolean;
}

/**
 * Holofote global (animações "full", luzes apagadas): escurece a página inteira
 * e mantém um círculo de luz sempre aceso seguindo o mouse, com um feixe cônico
 * partindo do topo. Sobre um card marcado com `data-tilt-card`, o círculo cresce
 * pro tamanho do card; fora de qualquer card, ele volta a um raio menor.
 */
export function PosterSpotlight({ lightsOn }: PosterSpotlightProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const beamRef = useRef<SVGPolygonElement>(null);

  useEffect(() => {
    function handleMouseMove(event: MouseEvent) {
      const overlay = overlayRef.current;
      // Com as luzes acesas o componente não renderiza o overlay (ver abaixo) —
      // aqui não há nada pra atualizar.
      if (!overlay) return;

      const target = event.target as Element | null;
      const card = target?.closest(CARD_SELECTOR) ?? null;

      // Furo de luz acompanha o tamanho do card em foco, não um valor fixo —
      // continua proporcional em qualquer tamanho de grade. offsetHeight (não
      // getBoundingClientRect) porque o próprio MovieCard já aplicou o tilt/scale
      // nesse mesmo evento antes deste handler rodar — getBoundingClientRect
      // leria o card já ampliado e rotacionado, inflando o raio calculado.
      const radius = card ? ((card as HTMLElement).offsetHeight * SPOT_SIZE_RATIO) / 2 : ROAM_RADIUS_PX;

      overlay.style.setProperty("--spot-radius", `${radius}px`);
      overlay.style.setProperty("--spot-x", `${event.clientX}px`);
      overlay.style.setProperty("--spot-y", `${event.clientY}px`);

      const beam = beamRef.current;
      if (beam) {
        // Feixe fixo no topo-centro da tela, como um refletor apontando pro mouse.
        const apexX = window.innerWidth / 2;
        const apexY = 0;
        const dx = event.clientX - apexX;
        const dy = event.clientY - apexY;
        const dist = Math.hypot(dx, dy) || 1;
        const perpX = (-dy / dist) * radius * 0.6;
        const perpY = (dx / dist) * radius * 0.6;
        beam.setAttribute(
          "points",
          `${apexX},${apexY} ${event.clientX + perpX},${event.clientY + perpY} ${event.clientX - perpX},${event.clientY - perpY}`,
        );
      }
    }

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Luzes acesas: sem sombreado algum — só a inclinação/verniz do card (MovieCard cuida disso).
  if (lightsOn) return null;

  return (
    <div
      ref={overlayRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40"
      style={{
        background:
          "radial-gradient(circle var(--spot-radius, 160px) at var(--spot-x, 50%) var(--spot-y, 50%), transparent 0%, transparent 55%, rgba(2,1,6,0.96) 100%)",
      }}
    >
      {/*
        blur no feixe: sem isso, a borda reta do triângulo SVG corta contra o
        degradê radial do fundo e cria um "degrau" de cor visível — o blur
        dissolve essa borda geométrica dura numa transição suave, como um
        feixe de luz de verdade.
      */}
      <svg className="absolute inset-0 h-full w-full" aria-hidden="true" style={{ filter: "blur(40px)" }}>
        <defs>
          <linearGradient id="poster-spotlight-beam" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(245,196,81,0)" />
            <stop offset="100%" stopColor="rgba(245,196,81,0.09)" />
          </linearGradient>
        </defs>
        <polygon ref={beamRef} fill="url(#poster-spotlight-beam)" />
      </svg>
    </div>
  );
}
