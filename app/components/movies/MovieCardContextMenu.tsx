import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { createPortal } from "react-dom";
import type { MovieList } from "~/models/movieList";

type Mode = "menu" | "confirmDelete" | "chooseCopyTarget";

interface MovieCardContextMenuProps {
  position: { x: number; y: number };
  otherLists: MovieList[];
  watched: boolean;
  onCopyToList: (targetListId: string) => void;
  onDelete: () => void;
  onSelect: () => void;
  onEdit: () => void;
  onToggleWatched: () => void;
  onView?: () => void;
  onClose: () => void;
}

/** Menu de contexto (clique direito no card): visualizar, selecionar, editar, assistido, copiar, excluir. */
export function MovieCardContextMenu({
  position,
  otherLists,
  watched,
  onCopyToList,
  onDelete,
  onSelect,
  onEdit,
  onToggleWatched,
  onView,
  onClose,
}: MovieCardContextMenuProps) {
  const [mode, setMode] = useState<Mode>("menu");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("contextmenu", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("contextmenu", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  function stopPropagation(event: ReactMouseEvent) {
    event.stopPropagation();
  }

  // Portal pro body: em animações "full" o card ganha `transform` (tilt/scale) no hover, o que
  // vira o containing block de qualquer `position: fixed` dentro dele — sem o portal, o menu
  // renderiza preso/cortado dentro do card (com overflow-hidden) em vez de sobre a tela toda.
  return createPortal(
    <div
      ref={containerRef}
      onClick={stopPropagation}
      onContextMenu={stopPropagation}
      style={{ top: position.y, left: position.x }}
      className="fixed z-50 w-52 rounded-lg border border-ink-700 bg-ink-900 p-1.5 shadow-2xl"
    >
      {mode === "menu" && (
        <div className="flex flex-col">
          {onView && (
            <button
              type="button"
              onClick={() => {
                onView();
                onClose();
              }}
              className="flex items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-mist-100 hover:bg-ink-800"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 shrink-0">
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12Z"
                />
                <circle cx="12" cy="12" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
              Visualizar
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onSelect();
              onClose();
            }}
            className="flex items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-mist-100 hover:bg-ink-800"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 shrink-0">
              <rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="2" />
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12l3 3 5-6"
              />
            </svg>
            Selecionar
          </button>

          <button
            type="button"
            onClick={() => {
              onEdit();
              onClose();
            }}
            className="flex items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-mist-100 hover:bg-ink-800"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 shrink-0">
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"
              />
            </svg>
            Editar
          </button>

          <button
            type="button"
            onClick={() => {
              onToggleWatched();
              onClose();
            }}
            className="flex items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-mist-100 hover:bg-ink-800"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 shrink-0">
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
            {watched ? "Marcar como não assistido" : "Marcar como assistido"}
          </button>

          {otherLists.length > 0 && (
            <button
              type="button"
              onClick={() => setMode("chooseCopyTarget")}
              className="flex items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-mist-100 hover:bg-ink-800"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 shrink-0">
                <rect
                  x="8"
                  y="8"
                  width="12"
                  height="12"
                  rx="2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"
                />
              </svg>
              Copiar para lista
            </button>
          )}

          <button
            type="button"
            onClick={() => setMode("confirmDelete")}
            className="flex items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-red-400 hover:bg-red-600/20"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 shrink-0">
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-.8 12.1a1 1 0 0 1-1 .9H8.8a1 1 0 0 1-1-.9L7 7"
              />
            </svg>
            Excluir
          </button>
        </div>
      )}

      {mode === "confirmDelete" && (
        <div className="p-1">
          <p className="mb-2 px-1.5 text-sm text-mist-200">Excluir este filme?</p>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setMode("menu")}
              className="flex-1 rounded-md px-2 py-1.5 text-center text-sm text-mist-300 hover:bg-ink-800"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => {
                onDelete();
                onClose();
              }}
              className="flex-1 rounded-md bg-red-600/90 px-2 py-1.5 text-center text-sm text-white hover:bg-red-500"
            >
              Excluir
            </button>
          </div>
        </div>
      )}

      {mode === "chooseCopyTarget" && (
        <div>
          <p className="mb-1 px-1.5 text-xs text-mist-400">Copiar para:</p>
          {otherLists.map((list) => (
            <button
              key={list.id}
              type="button"
              onClick={() => {
                onCopyToList(list.id);
                onClose();
              }}
              className="block w-full truncate rounded-md px-2.5 py-1.5 text-left text-sm text-mist-100 hover:bg-ink-800"
            >
              {list.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setMode("menu")}
            className="mt-1 block w-full rounded-md px-2.5 py-1.5 text-left text-xs text-mist-400 hover:bg-ink-800"
          >
            Voltar
          </button>
        </div>
      )}
    </div>,
    document.body,
  );
}
