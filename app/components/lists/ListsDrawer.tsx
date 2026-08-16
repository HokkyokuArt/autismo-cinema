import { useEffect, useRef, useState } from "react";
import type { MovieList, MovieListWithStats } from "~/models/movieList";
import { Button } from "~/components/common/Button";

interface ListsDrawerProps {
  open: boolean;
  onClose: () => void;
  lists: MovieListWithStats[];
  activeListId: string;
  onSelectList: (listId: string) => void;
  onCreateList: () => void;
  onEditList: (list: MovieList) => void;
  onDeleteList: (list: MovieList) => void;
  onReorderLists: (orderedIds: string[]) => void;
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

export function ListsDrawer({
  open,
  onClose,
  lists,
  activeListId,
  onSelectList,
  onCreateList,
  onEditList,
  onDeleteList,
  onReorderLists,
}: ListsDrawerProps) {
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  // Cópia local só pra poder reordenar "ao vivo" enquanto arrasta, sem esperar o
  // pai persistir e devolver a prop atualizada a cada frame do drag.
  const [orderedLists, setOrderedLists] = useState(lists);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const orderedListsRef = useRef(orderedLists);
  orderedListsRef.current = orderedLists;
  const dragStartOrderRef = useRef<string[] | null>(null);

  useEffect(() => {
    // Só resincroniza com a prop quando não tem arrasto rolando — do contrário a
    // prop (ainda com a ordem antiga, até o pai persistir) sobrescreveria a prévia.
    if (draggingId === null) setOrderedLists(lists);
  }, [lists, draggingId]);

  useEffect(() => {
    if (!open) return;
    setConfirmingDeleteId(null);
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!draggingId) return;

    function handlePointerMove(event: PointerEvent) {
      const target = document.elementFromPoint(event.clientX, event.clientY);
      const row = target instanceof Element ? target.closest("[data-list-row-id]") : null;
      const overId = row?.getAttribute("data-list-row-id");
      if (!overId || overId === draggingId) return;
      setOrderedLists((prev) => {
        const fromIndex = prev.findIndex((list) => list.id === draggingId);
        const toIndex = prev.findIndex((list) => list.id === overId);
        if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return prev;
        return moveItem(prev, fromIndex, toIndex);
      });
    }

    function handlePointerUp() {
      setDraggingId(null);
      const newOrder = orderedListsRef.current.map((list) => list.id);
      const startOrder = dragStartOrderRef.current;
      const changed = !startOrder || newOrder.some((id, index) => id !== startOrder[index]);
      if (changed) onReorderLists(newOrder);
    }

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
    };
  }, [draggingId, onReorderLists]);

  function handleHandlePointerDown(listId: string) {
    dragStartOrderRef.current = orderedLists.map((list) => list.id);
    setDraggingId(listId);
  }

  function handleHandleKeyDown(event: React.KeyboardEvent, listId: string) {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    const index = orderedLists.findIndex((list) => list.id === listId);
    const targetIndex = event.key === "ArrowUp" ? index - 1 : index + 1;
    if (index === -1 || targetIndex < 0 || targetIndex >= orderedLists.length) return;
    const next = moveItem(orderedLists, index, targetIndex);
    setOrderedLists(next);
    onReorderLists(next.map((list) => list.id));
  }

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={
          "fixed inset-0 z-40 bg-ink-950/70 transition-opacity duration-300 " +
          (open ? "opacity-100" : "pointer-events-none opacity-0")
        }
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Minhas listas"
        className={
          "fixed inset-y-0 left-0 z-50 flex w-80 max-w-[85vw] flex-col border-r border-ink-700 bg-ink-900 transition-transform duration-300 ease-out " +
          (open ? "translate-x-0" : "-translate-x-full")
        }
      >
        <div className="flex items-center justify-between border-b border-ink-700 px-4 py-4">
          <h2 className="font-display text-lg text-mist-50">Minhas listas</h2>
          <button
            type="button"
            onClick={onClose}
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

        <div className={"flex-1 overflow-y-auto p-3" + (draggingId ? " select-none" : "")}>
          {orderedLists.map((list) => (
            <div
              key={list.id}
              data-list-row-id={list.id}
              className={
                "mb-2 flex items-start gap-1 rounded-lg border p-3 transition-[opacity,box-shadow] " +
                (list.id === activeListId ? "border-brand-500 bg-ink-800" : "border-ink-700") +
                (draggingId === list.id ? " opacity-50 ring-2 ring-brand-500" : "")
              }
            >
              {confirmingDeleteId === list.id ? (
                <div className="min-w-0 flex-1">
                  <p className="mb-2 text-sm text-mist-200">
                    Excluir "{list.name}"? Os filmes dessa lista também serão apagados.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmingDeleteId(null)}
                      className="flex-1 rounded-md bg-ink-700 px-2 py-1.5 text-xs text-mist-100 hover:bg-ink-600"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmingDeleteId(null);
                        onDeleteList(list);
                      }}
                      className="flex-1 rounded-md bg-red-600 px-2 py-1.5 text-xs text-white hover:bg-red-500"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    aria-label={`Reordenar ${list.name} — segure e arraste, ou use as setas`}
                    onPointerDown={() => handleHandlePointerDown(list.id)}
                    onKeyDown={(event) => handleHandleKeyDown(event, list.id)}
                    style={{ touchAction: "none" }}
                    className="mt-1 shrink-0 cursor-grab touch-none rounded-md p-1 text-mist-500 hover:bg-ink-700 hover:text-mist-100 active:cursor-grabbing"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
                      <circle cx="9" cy="6" r="1.4" fill="currentColor" />
                      <circle cx="9" cy="12" r="1.4" fill="currentColor" />
                      <circle cx="9" cy="18" r="1.4" fill="currentColor" />
                      <circle cx="15" cy="6" r="1.4" fill="currentColor" />
                      <circle cx="15" cy="12" r="1.4" fill="currentColor" />
                      <circle cx="15" cy="18" r="1.4" fill="currentColor" />
                    </svg>
                  </button>

                  <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectList(list.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className="truncate text-sm font-medium text-mist-50">{list.name}</p>
                      {list.description && (
                        <p className="truncate text-xs text-mist-400">{list.description}</p>
                      )}
                      <p className="mt-1 text-xs text-mist-400">
                        {list.watchedCount}/{list.totalCount} assistidos
                      </p>
                    </button>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        aria-label={`Editar ${list.name}`}
                        onClick={() => onEditList(list)}
                        className="rounded-full p-1.5 text-mist-400 hover:bg-ink-700 hover:text-mist-50"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
                          <path
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        aria-label={`Excluir ${list.name}`}
                        onClick={() => setConfirmingDeleteId(list.id)}
                        className="rounded-full p-1.5 text-mist-400 hover:bg-red-600 hover:text-white"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
                          <path
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-.8 12.1a1 1 0 0 1-1 .9H8.8a1 1 0 0 1-1-.9L7 7"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-ink-700 p-3">
          <Button className="w-full" onClick={onCreateList}>
            Nova lista
          </Button>
        </div>
      </div>
    </>
  );
}
