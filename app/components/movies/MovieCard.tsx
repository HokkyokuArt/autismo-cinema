import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent as ReactMouseEvent } from "react";
import type { Movie } from "~/models/movie";
import type { MovieList } from "~/models/movieList";
import type { AnimationLevel } from "~/models/settings";
import { PosterImage } from "~/components/movies/PosterImage";
import { MovieCardContextMenu } from "~/components/movies/MovieCardContextMenu";
import { StarRating } from "~/components/movies/StarRating";

/** Janela para diferenciar clique simples (ver) de duplo clique (editar). */
const CLICK_DELAY_MS = 250;
/** Estimativa de tamanho do menu de contexto, só pra não deixar ele sair da tela. */
const MENU_WIDTH = 208;
const MENU_HEIGHT_ESTIMATE = 200;

/** Inclinação 3D máxima (graus) e o quanto o card "salta" da tela — só em animações "full". */
const TILT_MAX_DEG = 12;
const TILT_LIFT_SCALE = 1.06;
const TILT_RESET_TRANSITION = "transform 500ms cubic-bezier(0.22, 1, 0.36, 1)";

interface MovieCardProps {
  movie: Movie;
  otherLists: MovieList[];
  selectionMode: boolean;
  selected: boolean;
  animationLevel: AnimationLevel;
  onToggleSelect: (movie: Movie) => void;
  onEnterSelectionMode: (movie: Movie) => void;
  onView?: (movie: Movie) => void;
  onEdit: (movie: Movie) => void;
  onDelete: (movie: Movie) => void;
  onCopyToList: (movie: Movie, targetListId: string) => void;
  onToggleWatched: (movie: Movie) => void;
  /** Marca este card como o alvo do tutorial guiado (`data-tutorial="movie-card-first"`). */
  isTutorialTarget?: boolean;
  /** Chamado ao abrir o menu de contexto (long-press/clique direito) — usado pelo tutorial. */
  onContextMenuOpen?: () => void;
}

export function MovieCard({
  movie,
  otherLists,
  selectionMode,
  selected,
  animationLevel,
  onToggleSelect,
  onEnterSelectionMode,
  onView,
  onEdit,
  onDelete,
  onCopyToList,
  onToggleWatched,
  isTutorialTarget,
  onContextMenuOpen,
}: MovieCardProps) {
  const { info, watched } = movie;
  const clickTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const cardRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const isTiltEnabled = animationLevel === "full";

  useEffect(() => () => clearTimeout(clickTimeoutRef.current), []);

  // Seleção é mostrada só pelo anel + selo (abaixo), nunca por um scale permanente —
  // aqui só garantimos que o card volte ao tamanho base se a seleção mudar enquanto
  // ele ainda estava com o tilt do hover aplicado (ex.: "selecionar todos" disparado
  // com o mouse parado em cima de um card).
  useEffect(() => {
    if (!isTiltEnabled) return;
    const card = cardRef.current;
    if (!card) return;

    card.style.transition = TILT_RESET_TRANSITION;
    card.style.transform = "";
    card.style.zIndex = "";
  }, [selected, isTiltEnabled]);

  /** Inclina o card em direção ao mouse e move o brilho do "verniz" junto — só em animações "full". */
  function handleTiltMove(event: ReactMouseEvent<HTMLDivElement>) {
    if (!isTiltEnabled) return;
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * 2 * TILT_MAX_DEG;
    const rotateX = (0.5 - py) * 2 * TILT_MAX_DEG;
    const scale = TILT_LIFT_SCALE;

    // Posição da faixa de brilho (efeito laminado): varre na diagonal a partir
    // da combinação de px/py, então acompanha tanto a inclinação horizontal
    // quanto a vertical — como um reflexo real se movendo sobre um verniz.
    const sheenPos = ((px + (1 - py)) / 2) * 100;

    card.style.transition = "none";
    card.style.zIndex = "20";
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scale})`;
    card.style.setProperty("--gloss-x", `${px * 100}%`);
    card.style.setProperty("--gloss-y", `${py * 100}%`);
    card.style.setProperty("--sheen-pos", `${sheenPos}%`);
    card.style.setProperty("--gloss-opacity", "1");
  }

  function handleTiltLeave() {
    if (!isTiltEnabled) return;
    const card = cardRef.current;
    if (!card) return;

    card.style.transition = TILT_RESET_TRANSITION;
    card.style.transform = "";
    card.style.zIndex = "";
    card.style.setProperty("--gloss-opacity", "0");
  }

  function handleClick() {
    if (selectionMode) {
      onToggleSelect(movie);
      return;
    }
    if (!onView) return;
    clearTimeout(clickTimeoutRef.current);
    clickTimeoutRef.current = setTimeout(() => onView(movie), CLICK_DELAY_MS);
  }

  function handleDoubleClick() {
    if (selectionMode) return;
    clearTimeout(clickTimeoutRef.current);
    onEdit(movie);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (selectionMode) {
        onToggleSelect(movie);
      } else {
        onView?.(movie);
      }
    }
  }

  function handleContextMenu(event: ReactMouseEvent<HTMLDivElement>) {
    if (selectionMode) return;
    event.preventDefault();
    const x = Math.max(8, Math.min(event.clientX, window.innerWidth - MENU_WIDTH - 8));
    const y = Math.max(8, Math.min(event.clientY, window.innerHeight - MENU_HEIGHT_ESTIMATE - 8));
    setMenuPosition({ x, y });
    onContextMenuOpen?.();
  }

  return (
    <div
      ref={cardRef}
      data-tilt-card={isTiltEnabled ? "true" : undefined}
      data-tutorial={isTutorialTarget ? "movie-card-first" : undefined}
      className={
        "group relative cursor-pointer overflow-hidden rounded-lg transition-shadow " +
        (selected ? "ring-2 ring-brand-500 " : "") +
        (isTiltEnabled ? "will-change-transform hover:shadow-[0_35px_60px_-20px_rgba(0,0,0,0.85)] " : "")
      }
      style={isTiltEnabled ? { transformStyle: "preserve-3d" } : undefined}
      role="button"
      tabIndex={0}
      aria-label={info.title}
      aria-pressed={selectionMode ? selected : undefined}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      onContextMenu={handleContextMenu}
      onMouseMove={handleTiltMove}
      onMouseLeave={handleTiltLeave}
    >
      <PosterImage src={info.posterUrl} alt={info.title} watched={watched} />

      {isTiltEnabled && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-200"
          style={{
            opacity: "var(--gloss-opacity, 0)",
            // Duas camadas: a faixa quase horizontal (levemente diagonal) simula
            // o verniz laminado refletindo (varre conforme --sheen-pos, que muda
            // com a inclinação do card) + o brilho circular que segue o mouse por
            // cima. "screen" em vez de "overlay" pra clarear sempre de forma
            // consistente, independente de o pôster embaixo ser claro ou escuro.
            background:
              "linear-gradient(15deg, transparent calc(var(--sheen-pos, 50%) - 16%), rgba(255,255,255,0.28) var(--sheen-pos, 50%), transparent calc(var(--sheen-pos, 50%) + 16%)), " +
              "radial-gradient(circle at var(--gloss-x, 50%) var(--gloss-y, 50%), rgba(255,255,255,0.22), rgba(255,255,255,0.06) 35%, transparent 60%)",
            mixBlendMode: "screen",
          }}
        />
      )}

      {selectionMode && (
        <span
          aria-hidden="true"
          className={
            "absolute top-2 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 " +
            (selected
              ? "border-brand-500 bg-brand-600"
              : "border-mist-300 bg-ink-950/80")
          }
        >
          {selected && (
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-white">
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </span>
      )}

      {menuPosition && (
        <MovieCardContextMenu
          position={menuPosition}
          otherLists={otherLists}
          watched={watched}
          onCopyToList={(targetListId) => onCopyToList(movie, targetListId)}
          onDelete={() => onDelete(movie)}
          onSelect={() => onEnterSelectionMode(movie)}
          onEdit={() => onEdit(movie)}
          onToggleWatched={() => onToggleWatched(movie)}
          onView={onView ? () => onView(movie) : undefined}
          onClose={() => setMenuPosition(null)}
        />
      )}

      {/*
        Glass card simples (CSS only, sem GSAP ainda): desliza de trás do
        pôster (translate-y-full -> 0) e cobre o card inteiro, com leve blur
        pra dar o efeito vidro fosco. Ideia pra quando entrarmos em
        animações: GSAP com easing elástico/spring no slide, entrada
        escalonada (stagger) de título -> nota -> descrição, e um leve
        scale/lift do pôster ao mesmo tempo.

        Some em animações "full": lá o hover já é ocupado pelo spotlight/tilt, e
        ver os dados exige clicar (abre o dialog de visualização).
      */}
      {!isTiltEnabled && (
        <div className="pointer-events-none absolute inset-0 flex translate-y-full flex-col justify-center gap-1.5 bg-ink-700/60 p-4 opacity-0 backdrop-blur-sm transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100">
          <p className="font-display text-xl leading-tight text-mist-50">{info.title}</p>
          {info.originalTitle && (
            <p className="text-sm text-mist-400 italic">{info.originalTitle}</p>
          )}
          {info.imdbRating != null && (
            <StarRating ratingOutOfTen={info.imdbRating} className="pointer-events-auto" />
          )}
          {info.director && <p className="text-xs text-mist-300">Dir. {info.director}</p>}
          {info.shortDescription && (
            <p className="line-clamp-5 text-sm text-mist-200">{info.shortDescription}</p>
          )}
        </div>
      )}

      {watched && (
        <span
          aria-label="Assistido"
          className="absolute right-2 bottom-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white shadow"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </span>
      )}
    </div>
  );
}
