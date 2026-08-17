import { useEffect, useRef, useState, type ReactNode } from "react";

interface SpeedDialProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Clique direto no botão principal (em telas com hover) — a roleta, hoje. */
  onMainAction: () => void;
  mainIcon: ReactNode;
  mainLabel: string;
  children: ReactNode;
}

const HOVER_CLOSE_DELAY_MS = 200;
/** Quanto tempo segurando o botão principal conta como "press and hold" em touch. */
const LONG_PRESS_MS = 450;

/**
 * Botão flutuante (canto inferior direito) que expande um painel com ações.
 * Em telas com hover (desktop/mouse): passar o mouse abre o painel; clicar no
 * botão principal dispara `onMainAction` direto. Em touch (sem hover): um
 * toque rápido no botão principal dispara `onMainAction` direto (igual ao
 * hover) — segurar por `LONG_PRESS_MS` é que abre o painel com as outras
 * opções, já que não existe hover pra revelar isso de outro jeito.
 */
export function SpeedDial({ open, onOpenChange, onMainAction, mainIcon, mainLabel, children }: SpeedDialProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const longPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // Marca que o "segurar" já completou e abriu o painel — o click nativo que dispara logo
  // depois de soltar o dedo não deve também acionar a ação principal nesse caso.
  const longPressTriggeredRef = useRef(false);
  const [isHoverCapable, setIsHoverCapable] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(hover: hover) and (pointer: fine)");
    setIsHoverCapable(mql.matches);
    function handleChange(event: MediaQueryListEvent) {
      setIsHoverCapable(event.matches);
    }
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onOpenChange(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onOpenChange(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  useEffect(() => () => clearTimeout(closeTimeoutRef.current), []);
  useEffect(() => () => clearTimeout(longPressTimeoutRef.current), []);

  function handleMouseEnter() {
    if (!isHoverCapable) return;
    clearTimeout(closeTimeoutRef.current);
    onOpenChange(true);
  }

  function handleMouseLeave() {
    if (!isHoverCapable) return;
    closeTimeoutRef.current = setTimeout(() => onOpenChange(false), HOVER_CLOSE_DELAY_MS);
  }

  function handleMainPointerDown() {
    if (isHoverCapable) return;
    longPressTriggeredRef.current = false;
    longPressTimeoutRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      onOpenChange(true);
    }, LONG_PRESS_MS);
  }

  function handleMainPointerUp() {
    if (isHoverCapable) return;
    clearTimeout(longPressTimeoutRef.current);
  }

  function handleMainClick() {
    if (isHoverCapable) {
      onOpenChange(false);
      onMainAction();
      return;
    }
    // Já abriu o painel segurando — o click nativo que acompanha o soltar do dedo não deve
    // também disparar a ação principal por cima.
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }
    // Toque rápido (sem segurar) — vai direto pra ação principal, como um botão comum.
    onOpenChange(false);
    onMainAction();
  }

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="fixed right-6 bottom-6 z-40 flex flex-col items-end gap-3"
    >
      {open && (
        <div className="w-72 rounded-2xl border border-ink-700 bg-ink-900 p-3 shadow-2xl">{children}</div>
      )}

      <button
        type="button"
        onClick={handleMainClick}
        onPointerDown={handleMainPointerDown}
        onPointerUp={handleMainPointerUp}
        onPointerLeave={handleMainPointerUp}
        onPointerCancel={handleMainPointerUp}
        onContextMenu={(event) => event.preventDefault()}
        aria-label={mainLabel}
        title={mainLabel}
        data-tutorial="speed-dial-main"
        className="flex h-14 w-14 touch-none items-center justify-center overflow-hidden rounded-full bg-brand-600 text-white shadow-2xl transition-transform select-none hover:scale-105"
      >
        <span className="h-9 w-9">{mainIcon}</span>
      </button>
    </div>
  );
}

interface SpeedDialActionProps {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  dataTutorial?: string;
}

export function SpeedDialAction({ label, icon, onClick, dataTutorial }: SpeedDialActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-tutorial={dataTutorial}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-mist-100 hover:bg-ink-800"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-800 text-mist-200">
        {icon}
      </span>
      {label}
    </button>
  );
}
