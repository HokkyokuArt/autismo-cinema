import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import type { Movie } from "~/models/movie";
import { RouletteMarquee } from "~/components/roulette/RouletteMarquee";

gsap.registerPlugin(Draggable, InertiaPlugin);

/** Mesma paleta vibrante do ícone da roleta — usada só no fallback de filmes sem pôster. */
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

/** Gradiente metálico do aro fixo (não gira) — tons de prata alternados simulando reflexo. */
const METAL_RIM_GRADIENT =
  "conic-gradient(from 0deg, #f3f4f6, #6b7280 8%, #e5e7eb 16%, #4b5563 24%, #f9fafb 32%, " +
  "#9ca3af 40%, #e5e7eb 48%, #6b7280 56%, #f3f4f6 64%, #9ca3af 72%, #e5e7eb 80%, #4b5563 88%, #f3f4f6 100%)";

const EXTRA_SPINS_MIN = 5;
const EXTRA_SPINS_RANGE = 3;
const SPIN_DURATION_S = 4.5;

/**
 * Fatia de pizza de verdade: dois lados retos (centro → borda) e a borda externa
 * seguindo o arco real do círculo (comando SVG "A"), não um polígono com facetas
 * retas. `clip-path: path()` exige coordenadas em px (não aceita %), por isso
 * recebe o tamanho real do elemento em pixels (medido via ResizeObserver).
 */
function wedgeSectorPath(sizePx: number, startAngleDeg: number, endAngleDeg: number): string {
  const cx = sizePx / 2;
  const cy = sizePx / 2;
  const r = sizePx / 2;
  const toPoint = (angleDeg: number): [number, number] => {
    const rad = (angleDeg * Math.PI) / 180;
    return [cx + r * Math.sin(rad), cy - r * Math.cos(rad)];
  };
  const [startX, startY] = toPoint(startAngleDeg);
  const [endX, endY] = toPoint(endAngleDeg);
  const largeArcFlag = endAngleDeg - startAngleDeg > 180 ? 1 : 0;
  return `M${cx} ${cy} L${startX} ${startY} A${r} ${r} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`;
}

/** Índice do segmento parado sob o ponteiro fixo no topo, para um ângulo de rotação qualquer. */
function currentSegmentIndex(rotationDeg: number, segmentDeg: number, count: number): number {
  const pointerLocalAngle = ((-rotationDeg % 360) + 360) % 360;
  return Math.min(count - 1, Math.floor(pointerLocalAngle / segmentDeg));
}

/** Ângulo final (em graus) que alinha o segmento vencedor com o ponteiro fixo no topo. */
function computeTargetRotation(currentRotation: number, winnerMidAngleDeg: number, direction: 1 | -1): number {
  const targetMod = ((-winnerMidAngleDeg % 360) + 360) % 360;
  const currentMod = ((currentRotation % 360) + 360) % 360;
  const extraSpins = EXTRA_SPINS_MIN + Math.floor(Math.random() * EXTRA_SPINS_RANGE);

  if (direction === 1) {
    let delta = targetMod - currentMod;
    if (delta < 0) delta += 360;
    return currentRotation + delta + extraSpins * 360;
  }

  let delta = targetMod - currentMod;
  if (delta > 0) delta -= 360;
  return currentRotation + delta - extraSpins * 360;
}

interface RouletteWheelProps {
  movies: Movie[];
  winnerId: string;
  onSpinComplete: () => void;
}

/**
 * Preenche o setor todo (fit cover) — sem o aspect-ratio 2:3 do PosterImage, que não
 * cabe num triângulo. Sem pôster (ou se falhar ao carregar), cai pra cor do segmento —
 * a roleta não tem mais um fundo colorido por baixo das imagens, só onde falta pôster.
 */
function WedgeImage({ src, alt, fallbackColor }: { src?: string; alt: string; fallbackColor: string }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  if (!src || failed) {
    return (
      <div
        className="flex h-full w-full items-center justify-center p-3 text-center"
        style={{ backgroundColor: fallbackColor }}
      >
        <span className="font-display text-sm leading-snug text-white drop-shadow-md sm:text-base">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      draggable={false}
      onError={() => setFailed(true)}
      className="h-full w-full object-cover"
    />
  );
}

/**
 * Roda circular com pôsteres como segmentos — arrasto (GSAP Draggable +
 * InertiaPlugin) com uma tween determinística assumindo o controle ao soltar
 * pra garantir que pare exatamente no vencedor (já sorteado antes do giro).
 * Botão "Girar" como alternativa sem arrasto (acessibilidade).
 */
export function RouletteWheel({ movies, winnerId, onSpinComplete }: RouletteWheelProps) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const draggableRef = useRef<Draggable | null>(null);
  const lastRotationRef = useRef(0);
  const lastDeltaRef = useRef(0);
  const isSpinningRef = useRef(false);
  // Depois que o giro termina, os fogos ainda tocam antes do resultado abrir — trava
  // o botão e o arrasto pra não disparar um giro novo por cima dessa espera.
  const hasFinishedRef = useRef(false);
  const [isSpinning, setIsSpinning] = useState(false);
  // Tamanho real em px do disco — necessário pro clip-path em arco (path() não aceita %).
  const [wheelSize, setWheelSize] = useState(0);
  // Filme atualmente sob o ponteiro fixo — alimenta o visor colado na roda.
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);
  const lastReportedIndexRef = useRef<number | null>(null);

  const segmentDeg = 360 / movies.length;
  const winnerIndex = Math.max(
    0,
    movies.findIndex((movie) => movie.id === winnerId),
  );
  const winnerMidAngleDeg = winnerIndex * segmentDeg + segmentDeg / 2;

  function reportCurrentMovie(rotationDeg: number) {
    if (movies.length === 0) return;
    const index = currentSegmentIndex(rotationDeg, segmentDeg, movies.length);
    if (index === lastReportedIndexRef.current) return;
    lastReportedIndexRef.current = index;
    setCurrentMovie(movies[index]);
  }

  function spinToWinner(direction: 1 | -1) {
    if (isSpinningRef.current || hasFinishedRef.current || !wheelRef.current) return;
    isSpinningRef.current = true;
    setIsSpinning(true);
    // Trava o arrasto assim que a tween determinística assume o controle: se o usuário
    // conseguisse agarrar a roda de novo nesse meio-tempo, o Draggable mata a tween em
    // andamento pra tomar controle (comportamento padrão do GSAP ao "pressionar"), e como
    // ela nunca chega no onComplete, isSpinningRef ficava travado em "true" pra sempre —
    // o botão "Girando…" ficava preso e um novo giro nunca mais disparava.
    draggableRef.current?.disable();

    const current = (gsap.getProperty(wheelRef.current, "rotation") as number) || 0;
    const target = computeTargetRotation(current, winnerMidAngleDeg, direction);

    // O giro é a própria funcionalidade da roleta, não uma transição incidental —
    // sempre anima de verdade, independente da configuração de animações ou de
    // prefers-reduced-motion. Sem isso, girar vira um "sorteio instantâneo" sem roleta.
    gsap.to(wheelRef.current, {
      rotation: target,
      duration: SPIN_DURATION_S,
      ease: "power4.out",
      onUpdate: () => {
        reportCurrentMovie((gsap.getProperty(wheelRef.current, "rotation") as number) || 0);
      },
      onComplete: () => {
        isSpinningRef.current = false;
        hasFinishedRef.current = true;
        setIsSpinning(false);
        onSpinComplete();
      },
    });
  }

  useEffect(() => {
    // Mostra o filme sob o ponteiro desde o primeiro frame, antes de qualquer giro/arrasto.
    reportCurrentMovie(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    if (!wheelRef.current) return;
    const ctx = gsap.context(() => {
      const [draggable] = Draggable.create(wheelRef.current, {
        type: "rotation",
        inertia: true,
        onDrag: function handleDrag(this: Draggable) {
          const current = this.rotation;
          lastDeltaRef.current = current - lastRotationRef.current;
          lastRotationRef.current = current;
          reportCurrentMovie(current);
        },
        onDragEnd: function handleDragEnd(this: Draggable & { tween?: gsap.core.Tween }) {
          this.tween?.kill();
          spinToWinner(lastDeltaRef.current < 0 ? -1 : 1);
        },
      });
      draggableRef.current = draggable;
    });
    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    const el = wheelRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWheelSize(entry.contentRect.width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="relative mx-auto aspect-square w-full max-w-[min(85vw,75vh)]">
        <div
          aria-hidden="true"
          className="absolute top-0 left-1/2 z-10 -translate-x-1/2 -translate-y-2"
          style={{
            width: 0,
            height: 0,
            borderLeft: "28px solid transparent",
            borderRight: "28px solid transparent",
            borderTop: "48px solid var(--color-marquee)",
          }}
        />

        {/* Aro metálico fixo — não gira, só o disco de pôsteres por dentro dele. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-full shadow-[inset_0_0_0_2px_rgba(0,0,0,0.35),0_10px_30px_rgba(0,0,0,0.5)]"
          style={{ background: METAL_RIM_GRADIENT }}
        />

        <div
          ref={wheelRef}
          className="absolute inset-[3%] cursor-grab touch-none overflow-hidden rounded-full bg-ink-900 shadow-2xl select-none active:cursor-grabbing"
        >
          {wheelSize > 0 &&
            movies.map((movie, index) => {
              const startAngle = index * segmentDeg;
              const endAngle = (index + 1) * segmentDeg;
              return (
                <div
                  key={movie.id}
                  className="absolute inset-0"
                  style={{ clipPath: `path('${wedgeSectorPath(wheelSize, startAngle, endAngle)}')` }}
                >
                  <WedgeImage
                    src={movie.info.posterUrl}
                    alt={movie.info.title}
                    fallbackColor={SEGMENT_COLORS[index % SEGMENT_COLORS.length]}
                  />
                </div>
              );
            })}

          <div className="absolute top-1/2 left-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink-900 bg-mist-50" />
        </div>

        {/*
          Colado na roda com 20px de distância, sem entrar no fluxo do flex-col —
          assim a roda continua centralizada na tela exatamente como antes, e o
          visor só existe em telas largas o bastante pra caber ao lado (sm+).
        */}
        <div className="absolute top-1/2 left-full ml-[20px] hidden -translate-y-1/2 sm:block">
          <RouletteMarquee title={currentMovie?.info.title ?? ""} />
        </div>
      </div>

      <div className="sm:hidden">
        <RouletteMarquee title={currentMovie?.info.title ?? ""} />
      </div>

      <button
        type="button"
        disabled={isSpinning || hasFinishedRef.current}
        onClick={() => spinToWinner(1)}
        className="rounded-full bg-brand-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSpinning ? "Girando…" : "Girar"}
      </button>
    </div>
  );
}
