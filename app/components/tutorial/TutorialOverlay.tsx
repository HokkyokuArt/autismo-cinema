import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "~/components/common/Button";

export interface TutorialStepView {
  /** Valor de `data-tutorial` do elemento a destacar. Ausente = passo informativo, sem recorte. */
  target?: string;
  /**
   * Alvo alternativo pra destacar se `target` sumir do DOM antes de ser clicado (ex.: o
   * usuário tocou fora do painel do speed dial e ele fechou sozinho) — evita que a tela
   * inteira fique bloqueada sem nenhum jeito de continuar.
   */
  fallbackTarget?: string;
  title?: string;
  message: ReactNode;
  /** Texto do botão de avançar quando o passo não depende de um clique real no alvo. */
  cta?: string;
  onAdvance?: () => void;
}

interface TutorialOverlayProps {
  step: TutorialStepView | null;
  onSkip: () => void;
  /** Espelha `effectiveAnimationLevel !== "off"` — desliga o pulso do anel de destaque. */
  animationsEnabled: boolean;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const SPOTLIGHT_PADDING = 6;
const OVERLAY_Z = "z-[80]";
const CARD_Z = "z-[85]";

function readTargetRect(target: string | undefined): Rect | null {
  if (!target) return null;
  const el = document.querySelector(`[data-tutorial="${target}"]`);
  if (!el) return null;
  const box = el.getBoundingClientRect();
  return {
    top: box.top - SPOTLIGHT_PADDING,
    left: box.left - SPOTLIGHT_PADDING,
    width: box.width + SPOTLIGHT_PADDING * 2,
    height: box.height + SPOTLIGHT_PADDING * 2,
  };
}

/** Acompanha a posição do alvo em tempo real (rolagem, dialogs abrindo/fechando, gavetas deslizando). */
function useTrackedRect(target: string | undefined, fallbackTarget: string | undefined): Rect | null {
  const [rect, setRect] = useState<Rect | null>(() =>
    typeof window === "undefined" ? null : (readTargetRect(target) ?? readTargetRect(fallbackTarget)),
  );

  useEffect(() => {
    if (!target && !fallbackTarget) {
      setRect(null);
      return;
    }
    let frameId: number;
    function tick() {
      setRect(readTargetRect(target) ?? readTargetRect(fallbackTarget));
      frameId = requestAnimationFrame(tick);
    }
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [target, fallbackTarget]);

  return rect;
}

function SkipLink({ onSkip }: { onSkip: () => void }) {
  return (
    <button
      type="button"
      onClick={onSkip}
      className="text-xs font-medium text-mist-400 underline-offset-2 hover:text-mist-100 hover:underline"
    >
      Pular tutorial
    </button>
  );
}

function TutorialCard({
  step,
  onSkip,
  placement,
}: {
  step: TutorialStepView;
  onSkip: () => void;
  placement: "top" | "bottom" | "center";
}) {
  const placementClasses =
    placement === "center"
      ? "relative"
      : placement === "top"
        ? "fixed top-4 left-1/2 -translate-x-1/2"
        : "fixed bottom-4 left-1/2 -translate-x-1/2";

  return (
    <div
      role="dialog"
      aria-label={step.title ?? "Dica do tutorial"}
      className={
        `${placementClasses} ${CARD_Z} flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 ` +
        "rounded-2xl border border-ink-700 bg-ink-900 p-4 shadow-2xl"
      }
    >
      {step.title && <p className="font-display text-lg text-mist-50">{step.title}</p>}
      <p className="text-sm leading-relaxed text-mist-200">{step.message}</p>
      <div className="flex items-center justify-between gap-3 pt-1">
        <SkipLink onSkip={onSkip} />
        {step.cta && (
          <Button className="px-4 py-2 text-sm" onClick={step.onAdvance}>
            {step.cta}
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Camada de tutorial: escurece a tela e recorta um "holofote" ao redor do elemento
 * `data-tutorial="<step.target>"`, deixando só ele clicável — o resto vira 4 faixas
 * escurecidas que bloqueiam clique. Sem `target`, escurece a tela inteira e mostra
 * um cartão central (avanço só pelo botão do cartão).
 */
export function TutorialOverlay({ step, onSkip, animationsEnabled }: TutorialOverlayProps) {
  const rect = useTrackedRect(step?.target, step?.fallbackTarget);
  const swallow = (event: React.MouseEvent) => event.preventDefault();

  if (!step) return null;

  if (!step.target || !rect) {
    return (
      <div className={`fixed inset-0 ${OVERLAY_Z} flex items-center justify-center bg-ink-950/85 p-4`} onClick={swallow}>
        <TutorialCard step={step} onSkip={onSkip} placement="center" />
      </div>
    );
  }

  const viewportHeight = window.innerHeight;
  const placement: "top" | "bottom" = rect.top > viewportHeight / 2 ? "top" : "bottom";

  const stripBase = `fixed bg-ink-950/80 ${OVERLAY_Z}`;

  return (
    <>
      <div
        aria-hidden="true"
        onClick={swallow}
        className={stripBase}
        style={{ top: 0, left: 0, right: 0, height: Math.max(rect.top, 0) }}
      />
      <div
        aria-hidden="true"
        onClick={swallow}
        className={stripBase}
        style={{ top: rect.top + rect.height, left: 0, right: 0, bottom: 0 }}
      />
      <div
        aria-hidden="true"
        onClick={swallow}
        className={stripBase}
        style={{ top: rect.top, left: 0, width: Math.max(rect.left, 0), height: rect.height }}
      />
      <div
        aria-hidden="true"
        onClick={swallow}
        className={stripBase}
        style={{ top: rect.top, left: rect.left + rect.width, right: 0, height: rect.height }}
      />
      <div
        aria-hidden="true"
        className={
          `pointer-events-none fixed rounded-xl border-2 border-brand-400 shadow-[0_0_0_4px_rgba(139,92,246,0.35)] ${OVERLAY_Z} ` +
          (animationsEnabled ? "animate-pulse" : "")
        }
        style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
      />
      <TutorialCard step={step} onSkip={onSkip} placement={placement} />
    </>
  );
}
