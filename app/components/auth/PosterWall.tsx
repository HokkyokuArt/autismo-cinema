import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { movieProvider, type PosterWallItem } from "~/api/movieProvider";

const LANE_COUNT = 7;
/** Precisa de pôster suficiente pra não ficar repetindo o mesmo pouquinho o tempo todo. */
const MIN_TOTAL_POSTERS = 8;
/**
 * Pôsteres por raia (reaproveitando o pool circularmente se precisar) — bem mais que o
 * necessário pra cobrir a tela duas vezes, pra nunca faltar conteúdo em nenhum momento
 * do loop (a raia funciona como uma fita cíclica: quando acaba, recomeça do início sem
 * nunca mostrar espaço vazio).
 */
const POSTERS_PER_LANE = 16;
/**
 * Velocidade base do scroll, em pixels por segundo — a duração real de cada raia é
 * calculada a partir disso e da altura de pôsteres medida de verdade no DOM (não um
 * "% do container" chutado), pra garantir que a distância percorrida por ciclo seja
 * exatamente igual à altura de um grupo de pôsteres. Varia por raia pra não sincronizarem
 * visualmente.
 */
const BASE_SPEED_PX_S = 3;
/** Palpite usado só até a primeira medição real do DOM chegar (evita layout "pulando"). */
const FALLBACK_LANE_SHIFT_PX = 3200;
/** Não trava pra sempre esperando pôster nenhum — depois disso, mostra a página do jeito que estiver. */
const PRELOAD_TIMEOUT_MS = 6000;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

interface PosterWallProps {
  /** Chamado uma vez, quando os pôsteres já buscados terminaram de pré-carregar (ou estourou o timeout). */
  onReady?: () => void;
}

/**
 * Mural de pôsteres girando ao fundo da tela de login — puramente decorativo,
 * um plano único inclinado (perspective + rotateX/rotateZ) com várias raias
 * verticais, cada uma rolando num sentido (alternado) e numa velocidade
 * diferente, pra parecer um fluxo 3D diagonal de filmes vindo em direção à
 * tela. Busca filmes populares reais do TMDB uma vez ao montar; se a API
 * falhar (ou não vier pôster suficiente), simplesmente não renderiza nada —
 * o login nunca pode depender disso pra funcionar.
 *
 * Só entra na fila de exibição o pôster cuja imagem já terminou de carregar
 * de verdade (pré-carregada via `Image()`) — sem isso, apareciam retângulos
 * em branco no meio do fluxo até a imagem chegar da rede.
 */
export function PosterWall({ onReady }: PosterWallProps) {
  const [posters, setPosters] = useState<PosterWallItem[]>([]);
  const [isFetchDone, setIsFetchDone] = useState(false);
  const [loadedPosters, setLoadedPosters] = useState<PosterWallItem[]>([]);
  // Enquanto a aba está em segundo plano, o navegador continua contando o tempo real da
  // animação CSS — ao voltar, ela "pula" pra onde deveria estar depois de todo esse tempo,
  // parecendo que trocou/pulou pôsteres do nada. Pausar de verdade enquanto some evita isso.
  const [isTabHidden, setIsTabHidden] = useState(false);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    function handleVisibilityChange() {
      setIsTabHidden(document.hidden);
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    let cancelled = false;
    movieProvider.getPosterWallMovies().then((result) => {
      if (cancelled) return;
      setPosters(result);
      setIsFetchDone(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isFetchDone) return;
    // A busca terminou mas não veio pôster nenhum (ex.: TMDB fora do ar) — nada pra
    // pré-carregar, então libera o "onReady" na hora em vez de travar pra sempre.
    if (posters.length === 0) {
      onReadyRef.current?.();
      return;
    }
    let cancelled = false;
    const loaded: PosterWallItem[] = [];

    const timeoutId = setTimeout(() => {
      if (cancelled) return;
      cancelled = true;
      setLoadedPosters([...loaded]);
      onReadyRef.current?.();
    }, PRELOAD_TIMEOUT_MS);

    let settledCount = 0;
    posters.forEach((poster) => {
      const image = new Image();
      const settle = (success: boolean) => {
        if (cancelled) return;
        settledCount += 1;
        if (success) loaded.push(poster);
        if (settledCount === posters.length) {
          cancelled = true;
          clearTimeout(timeoutId);
          setLoadedPosters([...loaded]);
          onReadyRef.current?.();
        }
      };
      image.onload = () => settle(true);
      image.onerror = () => settle(false);
      image.src = poster.posterUrl;
    });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [isFetchDone, posters]);

  const lanes = useMemo(() => {
    if (loadedPosters.length < MIN_TOTAL_POSTERS) return [];
    // Cada raia embaralha o pool inteiro pra si (independente das outras) e cicla por
    // ele até completar POSTERS_PER_LANE — reaproveita pôsteres se o pool for menor que
    // isso, mas nunca deixa a raia curta demais pra cobrir a tela duas vezes.
    // Depois de decidir quais pôsteres entram na raia, gruda uma cópia idêntica no fim
    // dela: o dobro de pôsteres por raia. É essa repetição que permite medir no DOM
    // (mais abaixo) a distância exata entre o primeiro pôster e o seu gêmeo na cópia,
    // e usar essa distância em pixels como a volta completa do loop — sem ela, não
    // haveria um "gêmeo" pra alinhar o pixel de chegada com o de partida.
    return Array.from({ length: LANE_COUNT }, () => {
      const shuffled = shuffle(loadedPosters);
      const group = Array.from({ length: POSTERS_PER_LANE }, (_, index) => shuffled[index % shuffled.length]);
      return [...group, ...group];
    });
  }, [loadedPosters]);

  const laneContainerRefs = useRef<Array<HTMLDivElement | null>>([]);
  // Distância exata (em pixels) que cada raia precisa percorrer pra que o pôster do
  // início da cópia caia bem em cima de onde o pôster original começou — medida de
  // verdade no DOM (offsetTop), não estimada por % do container. É essa medição que
  // resolve o desalinhamento: gap entre pôsteres, arredondamento e diferenças de altura
  // de imagem tornam qualquer fração fixa (ex.: 50%) imprecisa o bastante pra criar um
  // "salto" perceptível a cada volta do loop.
  const [laneShiftsPx, setLaneShiftsPx] = useState<number[]>([]);

  useLayoutEffect(() => {
    if (lanes.length === 0) return;

    function measureAll() {
      setLaneShiftsPx((prev) => {
        const next = [...prev];
        let changed = false;
        lanes.forEach((_, laneIndex) => {
          const container = laneContainerRefs.current[laneIndex];
          if (!container) return;
          const firstOfOriginal = container.children[0] as HTMLElement | undefined;
          const firstOfCopy = container.children[POSTERS_PER_LANE] as HTMLElement | undefined;
          if (!firstOfOriginal || !firstOfCopy) return;
          const shift = firstOfCopy.offsetTop - firstOfOriginal.offsetTop;
          if (shift > 0 && shift !== next[laneIndex]) {
            next[laneIndex] = shift;
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }

    measureAll();
    // Reage a mudanças de layout (resize da janela, imagens que só assentam a altura
    // depois do primeiro paint) recalculando a distância real.
    const observer = new ResizeObserver(measureAll);
    laneContainerRefs.current.forEach((container) => {
      if (container) observer.observe(container);
    });
    return () => observer.disconnect();
  }, [lanes]);

  if (lanes.length === 0) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden [perspective:1400px]">
      <div className="absolute inset-[-15%] flex gap-4 overflow-hidden [transform:rotateX(20deg)_rotateZ(-8deg)_scale(1.4)]">
        {lanes.map((lane, laneIndex) => {
          const shiftPx = laneShiftsPx[laneIndex] ?? FALLBACK_LANE_SHIFT_PX;
          // Velocidade varia por raia (não a distância) pra dessincronizar visualmente —
          // a distância percorrida continua sendo exatamente `shiftPx`, então o loop
          // permanece perfeito não importa a velocidade escolhida.
          const speedPxS = BASE_SPEED_PX_S * (1 + (laneIndex % 4) * 0.18);
          const durationS = shiftPx / speedPxS;
          return (
            <div
              key={laneIndex}
              ref={(el) => {
                laneContainerRefs.current[laneIndex] = el;
              }}
              className="flex flex-1 flex-col gap-4"
              style={
                {
                  "--lane-shift": `${shiftPx}px`,
                  animation: `${laneIndex % 2 === 0 ? "posterWallUp" : "posterWallDown"} ${durationS.toFixed(2)}s linear infinite`,
                  animationPlayState: isTabHidden ? "paused" : "running",
                } as React.CSSProperties
              }
            >
              {lane.map((movie, index) => (
                <img
                  key={index}
                  src={movie.posterUrl}
                  alt=""
                  draggable={false}
                  className="aspect-[2/3] w-full rounded-lg object-cover shadow-2xl"
                />
              ))}
            </div>
          );
        })}
      </div>

      {/* Só um leve escurecimento uniforme (não um degradê que "come" topo/base) — os
          pôsteres ocupam a metade da tela inteira, sem faixas de fade. */}
      <div className="absolute inset-0 bg-ink-950/25" />
    </div>
  );
}
