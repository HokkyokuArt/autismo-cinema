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

/**
 * Botão flutuante (canto inferior direito) que expande um painel com ações.
 * Em telas com hover (desktop/mouse): passar o mouse abre o painel; clicar no
 * botão principal dispara `onMainAction` direto. Em touch (sem hover): tocar
 * no botão principal só abre/fecha o painel — a ação principal também fica
 * disponível como a primeira opção da lista.
 */
export function SpeedDial({ open, onOpenChange, onMainAction, mainIcon, mainLabel, children }: SpeedDialProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
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

  function handleMouseEnter() {
    if (!isHoverCapable) return;
    clearTimeout(closeTimeoutRef.current);
    onOpenChange(true);
  }

  function handleMouseLeave() {
    if (!isHoverCapable) return;
    closeTimeoutRef.current = setTimeout(() => onOpenChange(false), HOVER_CLOSE_DELAY_MS);
  }

  function handleMainClick() {
    if (isHoverCapable) {
      onOpenChange(false);
      onMainAction();
    } else {
      onOpenChange(!open);
    }
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
        aria-label={mainLabel}
        title={mainLabel}
        className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-brand-600 text-white shadow-2xl transition-transform hover:scale-105"
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
}

export function SpeedDialAction({ label, icon, onClick }: SpeedDialActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-mist-100 hover:bg-ink-800"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-800 text-mist-200">
        {icon}
      </span>
      {label}
    </button>
  );
}
