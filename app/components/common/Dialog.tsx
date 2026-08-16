import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "~/components/common/Button";

/**
 * Combos responsivos completos (literais, para o scanner do Tailwind encontrar).
 * Cada tamanho define seu próprio conjunto de classes sm: sem sobreposição com os
 * outros — evita depender da ordem de geração do Tailwind pra saber qual classe
 * conflitante (ex.: sm:h-fit vs sm:h-full) "vence" quando as duas aparecem juntas.
 */
const SIZE_CLASSES = {
  md: {
    dialog: "sm:m-auto sm:h-fit sm:max-h-[95dvh] sm:w-full sm:max-w-lg sm:rounded-2xl sm:border",
    inner: "sm:h-fit sm:max-h-[95dvh]",
  },
  lg: {
    dialog: "sm:m-auto sm:h-fit sm:max-h-[95dvh] sm:w-full sm:max-w-3xl sm:rounded-2xl sm:border",
    inner: "sm:h-fit sm:max-h-[95dvh]",
  },
  xl: {
    dialog: "sm:m-auto sm:h-fit sm:max-h-[95dvh] sm:w-full sm:max-w-6xl sm:rounded-2xl sm:border",
    inner: "sm:h-fit sm:max-h-[95dvh]",
  },
  /** Tela cheia mesmo no desktop — sem margem, sem cantos arredondados, ocupando o viewport todo. */
  full: {
    dialog: "sm:m-0 sm:h-dvh sm:max-h-none sm:w-full sm:max-w-none sm:rounded-none sm:border-0",
    inner: "sm:h-full",
  },
} as const;

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: keyof typeof SIZE_CLASSES;
  /** Se true, fechar (X ou Esc) pede confirmação antes de descartar. */
  isDirty?: boolean;
  /** Se true, esconde visualmente o título do cabeçalho (mantido só para acessibilidade) — usado quando o conteúdo já mostra o próprio título. */
  hideTitle?: boolean;
}

/**
 * <dialog> nativo: foco e fechamento com Esc já vêm de graça do navegador,
 * só precisamos sincronizar open/close com o estado do React. Fechar só
 * acontece pelo X ou por um botão do formulário — clicar fora não fecha
 * mais (ver histórico). Com alterações não salvas (isDirty), o X e o Esc
 * pedem confirmação antes de descartar.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  size = "md",
  isDirty = false,
  hideTitle = false,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;
  const [confirmingClose, setConfirmingClose] = useState(false);

  useEffect(() => {
    const dialogEl = dialogRef.current;
    if (!dialogEl) return;
    if (open && !dialogEl.open) {
      setConfirmingClose(false);
      dialogEl.showModal();
    } else if (!open && dialogEl.open) {
      dialogEl.close();
    }
  }, [open]);

  useEffect(() => {
    const dialogEl = dialogRef.current;
    if (!dialogEl) return;

    function handleCancel(event: Event) {
      if (!isDirtyRef.current) return;
      event.preventDefault();
      setConfirmingClose(true);
    }

    dialogEl.addEventListener("close", onClose);
    dialogEl.addEventListener("cancel", handleCancel);
    return () => {
      dialogEl.removeEventListener("close", onClose);
      dialogEl.removeEventListener("cancel", handleCancel);
    };
  }, [onClose]);

  function handleCloseClick() {
    if (isDirty) {
      setConfirmingClose(true);
    } else {
      onClose();
    }
  }

  function handleDiscard() {
    setConfirmingClose(false);
    onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="dialog-title"
      className={
        // O <dialog> nativo vem com max-height/max-width padrão do navegador
        // (algo como calc(100% - 2em)) que nunca tínhamos sobrescrito — max-h-none
        // aqui zera isso, senão o diálogo fica ~2em curto embaixo mesmo com h-dvh.
        "m-0 h-dvh max-h-none w-full max-w-none rounded-none border-0 " +
        `${SIZE_CLASSES[size].dialog} ` +
        "border-ink-700 bg-ink-900 p-0 text-mist-50 backdrop:bg-ink-950/80"
      }
    >
      <div className={"relative flex h-full flex-col " + SIZE_CLASSES[size].inner}>
        <div
          className={
            "flex items-center border-b border-ink-700 px-5 py-4 " +
            (hideTitle ? "justify-end" : "justify-between")
          }
        >
          <h2 id="dialog-title" className={"font-display text-xl " + (hideTitle ? "sr-only" : "")}>
            {title}
          </h2>
          <button
            type="button"
            onClick={handleCloseClick}
            aria-label="Fechar"
            className="rounded-full p-1.5 text-mist-400 hover:bg-ink-700 hover:text-mist-50"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                d="M6 6l12 12M18 6L6 18"
              />
            </svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 [scrollbar-gutter:stable]">{children}</div>

        {confirmingClose && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink-950/90 p-6">
            <div className="flex max-w-xs flex-col gap-4 text-center">
              <p className="text-sm text-mist-100">Você tem alterações não salvas. Descartar?</p>
              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={() => setConfirmingClose(false)}>
                  Continuar editando
                </Button>
                <Button className="flex-1" onClick={handleDiscard}>
                  Descartar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}
