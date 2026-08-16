import { useEffect, useMemo, useRef, useState } from "react";
import { useIsCoarsePointer } from "~/hooks/useIsCoarsePointer";
import { Navigate, useNavigate } from "react-router";
import { useAuth } from "~/contexts/AuthContext";
import { useToast } from "~/contexts/ToastContext";
import { useMovies } from "~/hooks/useMovies";
import { useLists } from "~/hooks/useLists";
import { useSettings } from "~/hooks/useSettings";
import { useMovieFilters } from "~/hooks/useMovieFilters";
import { useMovieSort } from "~/hooks/useMovieSort";
import type { Movie, MovieInfo, MovieSource } from "~/models/movie";
import type { MovieList, MovieListWithStats } from "~/models/movieList";
import { findDuplicateMovie } from "~/utils/movieDuplicates";
import { sortMovies } from "~/utils/movieSort";
import { TopBar } from "~/components/layout/TopBar";
import { MovieGrid } from "~/components/movies/MovieGrid";
import { PosterSpotlight } from "~/components/movies/PosterSpotlight";
import { Fireworks } from "~/components/common/Fireworks";
import { MovieFilterBar } from "~/components/filters/MovieFilterBar";
import { FilterChips } from "~/components/filters/FilterChips";
import { EmptyState } from "~/components/common/EmptyState";
import { Button } from "~/components/common/Button";
import { MovieFormDialog } from "~/dialogs/MovieFormDialog";
import { MovieViewDialog } from "~/dialogs/MovieViewDialog";
import { AdvancedFiltersDialog } from "~/dialogs/AdvancedFiltersDialog";
import { SortMoviesDialog } from "~/dialogs/SortMoviesDialog";
import { SettingsDialog } from "~/dialogs/SettingsDialog";
import { EditProfileDialog } from "~/dialogs/EditProfileDialog";
import { RouletteDialog } from "~/dialogs/RouletteDialog";
import { ListFormDialog } from "~/dialogs/ListFormDialog";
import { DuplicateMovieDialog } from "~/dialogs/DuplicateMovieDialog";
import { ListsDrawer } from "~/components/lists/ListsDrawer";
import { SpeedDial, SpeedDialAction } from "~/components/common/SpeedDial";
import { RouletteIcon } from "~/components/common/RouletteIcon";
import type { Route } from "./+types/filmes";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Filmes — Autismo Cinema" }];
}

/** Easter egg: precisa completar isso antes do Ctrl+F liberar o modo luz apagada. */
const KONAMI_SEQUENCE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
  "Enter",
];

interface PendingConflict {
  targetListId: string;
  info: MovieInfo;
  source: MovieSource;
  existingMovie: Movie;
  /** Presente quando o conflito veio de uma edição (não de um cadastro/cópia novo). */
  editingMovieId?: string;
}

export default function FilmesPage() {
  const { user, logout, updateEmail, updatePassword, updateAvatarUrl } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    movies: allMovies,
    addMovie,
    updateMovie,
    removeMovie,
    toggleWatched,
    refresh: refreshMovies,
  } = useMovies();
  const { lists, addList, updateList, removeList, reorderLists } = useLists();
  const { settings, updateSettings } = useSettings();

  const [isMovieFormOpen, setIsMovieFormOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [viewingMovieId, setViewingMovieId] = useState<string | null>(null);
  const [isListFormOpen, setIsListFormOpen] = useState(false);
  const [editingList, setEditingList] = useState<MovieList | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMovieIds, setSelectedMovieIds] = useState<Set<string>>(new Set());
  const [isBulkCopyChoosing, setIsBulkCopyChoosing] = useState(false);
  const [isBulkDeleteConfirming, setIsBulkDeleteConfirming] = useState(false);
  const [conflictQueue, setConflictQueue] = useState<PendingConflict[]>([]);
  const [isSpeedDialOpen, setIsSpeedDialOpen] = useState(false);
  const [isRouletteOpen, setIsRouletteOpen] = useState(false);
  const [rouletteInitialIds, setRouletteInitialIds] = useState<string[] | undefined>(undefined);
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [isSortDialogOpen, setIsSortDialogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  // Luzes do holofote: acesas por padrão (sem sombreado) — apagar é um easter egg (Ctrl+F).
  const [lightsOn, setLightsOn] = useState(true);
  // Ctrl+F só libera o modo luz apagada depois do Konami code — até lá fica bloqueado.
  const [nightModeUnlocked, setNightModeUnlocked] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);
  const konamiProgressRef = useRef(0);

  // "Completas" depende de hover (spotlight, tilt 3D) — não existe em touch, então nem em
  // dispositivos onde isso ficou salvo antes (ex.: testado no desktop, aberto depois no celular).
  const isCoarsePointer = useIsCoarsePointer();
  const effectiveAnimationLevel =
    isCoarsePointer && settings.animationLevel === "full" ? "basic" : settings.animationLevel;

  const currentConflict = conflictQueue[0] ?? null;

  const activeListId =
    settings.activeListId && lists.some((list) => list.id === settings.activeListId)
      ? settings.activeListId
      : lists[0]?.id;

  useEffect(() => {
    if (activeListId && activeListId !== settings.activeListId) {
      updateSettings({ activeListId });
    }
  }, [activeListId, settings.activeListId, updateSettings]);

  useEffect(() => {
    document.documentElement.dataset.animationLevel = effectiveAnimationLevel;
  }, [effectiveAnimationLevel]);

  useEffect(() => {
    if (!isSelectionMode) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        toggleSelectionMode();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isSelectionMode]);

  // Easter egg: precisa completar o Konami code pra liberar o Ctrl+F — antes disso, cada
  // tecla errada reinicia o progresso do zero. Só conta em animações "full".
  useEffect(() => {
    if (effectiveAnimationLevel !== "full" || nightModeUnlocked) return;
    function handleKeyDown(event: KeyboardEvent) {
      const pressed = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      const expected = KONAMI_SEQUENCE[konamiProgressRef.current];

      if (pressed === expected) {
        konamiProgressRef.current += 1;
        if (konamiProgressRef.current === KONAMI_SEQUENCE.length) {
          konamiProgressRef.current = 0;
          setNightModeUnlocked(true);
          setShowFireworks(true);
        }
      } else {
        konamiProgressRef.current = pressed === KONAMI_SEQUENCE[0] ? 1 : 0;
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [effectiveAnimationLevel, nightModeUnlocked]);

  // Ctrl+F apaga/acende as luzes do holofote — só depois de liberado pelo Konami code acima.
  useEffect(() => {
    if (effectiveAnimationLevel !== "full" || !nightModeUnlocked) return;
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        setLightsOn((current) => !current);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [effectiveAnimationLevel, nightModeUnlocked]);

  const listsWithStats: MovieListWithStats[] = useMemo(
    () =>
      lists.map((list) => {
        const listMovies = allMovies.filter((movie) => movie.listId === list.id);
        return {
          ...list,
          totalCount: listMovies.length,
          watchedCount: listMovies.filter((movie) => movie.watched).length,
        };
      }),
    [lists, allMovies],
  );

  const activeMovies = useMemo(
    () => (activeListId ? allMovies.filter((movie) => movie.listId === activeListId) : []),
    [allMovies, activeListId],
  );

  const otherLists = useMemo(
    () => lists.filter((list) => list.id !== activeListId),
    [lists, activeListId],
  );

  const viewingMovie = useMemo(
    () => allMovies.find((movie) => movie.id === viewingMovieId) ?? null,
    [allMovies, viewingMovieId],
  );

  const movieFilters = useMovieFilters(activeMovies);
  const movieSort = useMovieSort();

  const sortedMovies = useMemo(
    () => sortMovies(movieFilters.filteredMovies, movieSort.criteria),
    [movieFilters.filteredMovies, movieSort.criteria],
  );

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  function listNameFor(listId: string): string {
    return lists.find((list) => list.id === listId)?.name ?? "outra lista";
  }

  function dequeueConflict() {
    setConflictQueue((queue) => queue.slice(1));
  }

  /** Tenta adicionar em `targetListId`; se já existir um filme igual, enfileira o conflito. Retorna true se adicionou de cara. */
  function queueAddition(targetListId: string, info: MovieInfo, source: MovieSource): boolean {
    const targetMovies = allMovies.filter((movie) => movie.listId === targetListId);
    const existing = findDuplicateMovie(targetMovies, { imdbId: info.imdbId, title: info.title });

    if (existing) {
      setConflictQueue((queue) => [...queue, { targetListId, info, source, existingMovie: existing }]);
      return false;
    }

    const now = new Date().toISOString();
    addMovie({
      id: crypto.randomUUID(),
      listId: targetListId,
      info,
      source,
      watched: false,
      createdAt: now,
      updatedAt: now,
    });
    return true;
  }

  /** Igual à de cima, mas pra edição — compara com os outros filmes da mesma lista, exceto ele mesmo. */
  function queueEdit(target: Movie, info: MovieInfo, source: MovieSource): boolean {
    const listMovies = allMovies.filter((movie) => movie.listId === target.listId);
    const existing = findDuplicateMovie(listMovies, { imdbId: info.imdbId, title: info.title }, target.id);

    if (existing) {
      setConflictQueue((queue) => [
        ...queue,
        { targetListId: target.listId, info, source, existingMovie: existing, editingMovieId: target.id },
      ]);
      return false;
    }

    updateMovie({ ...target, info, source, updatedAt: new Date().toISOString() });
    return true;
  }

  function resolveOverwrite() {
    if (!currentConflict) return;
    const now = new Date().toISOString();
    updateMovie({
      ...currentConflict.existingMovie,
      info: currentConflict.info,
      source: currentConflict.source,
      updatedAt: now,
    });
    if (currentConflict.editingMovieId) {
      removeMovie(currentConflict.editingMovieId);
    }
    showToast(`"${currentConflict.info.title}" sobrescrito.`);
    dequeueConflict();
  }

  function resolveAddAnyway() {
    if (!currentConflict) return;
    const now = new Date().toISOString();
    if (currentConflict.editingMovieId) {
      const original = allMovies.find((movie) => movie.id === currentConflict.editingMovieId);
      if (original) {
        updateMovie({ ...original, info: currentConflict.info, source: currentConflict.source, updatedAt: now });
      }
      showToast(`"${currentConflict.info.title}" atualizado.`);
    } else {
      addMovie({
        id: crypto.randomUUID(),
        listId: currentConflict.targetListId,
        info: currentConflict.info,
        source: currentConflict.source,
        watched: false,
        createdAt: now,
        updatedAt: now,
      });
      showToast(`"${currentConflict.info.title}" adicionado mesmo assim.`);
    }
    dequeueConflict();
  }

  function resolveEditExisting() {
    if (!currentConflict) return;
    const existingMovie = currentConflict.existingMovie;
    dequeueConflict();
    setEditingMovie(existingMovie);
    setIsMovieFormOpen(true);
  }

  function resolveCancel() {
    dequeueConflict();
  }

  function openAddMovie() {
    setEditingMovie(null);
    setIsMovieFormOpen(true);
  }

  function openEditMovie(movie: Movie) {
    setEditingMovie(movie);
    setIsMovieFormOpen(true);
  }

  function openViewMovie(movie: Movie) {
    setViewingMovieId(movie.id);
  }

  function handleToggleWatched(movie: Movie) {
    toggleWatched(movie.id);
    showToast(movie.watched ? `"${movie.info.title}" marcado como não assistido.` : `"${movie.info.title}" marcado como assistido.`);
  }

  function closeMovieForm() {
    setIsMovieFormOpen(false);
    setEditingMovie(null);
  }

  function handleDeleteMovie(movie: Movie) {
    removeMovie(movie.id);
    showToast(`"${movie.info.title}" excluído.`, "info", {
      label: "Desfazer",
      onClick: () => addMovie(movie),
    });
  }

  function handleCopyToList(movie: Movie, targetListId: string) {
    const wasAdded = queueAddition(targetListId, movie.info, movie.source);
    if (wasAdded) {
      showToast(`"${movie.info.title}" copiado para "${listNameFor(targetListId)}".`);
    }
  }

  function toggleSelectionMode() {
    setIsSelectionMode((current) => !current);
    setSelectedMovieIds(new Set());
    setIsBulkCopyChoosing(false);
    setIsBulkDeleteConfirming(false);
  }

  function enterSelectionModeWithMovie(movie: Movie) {
    setIsSelectionMode(true);
    setSelectedMovieIds(new Set([movie.id]));
    setIsBulkCopyChoosing(false);
    setIsBulkDeleteConfirming(false);
  }

  function toggleMovieSelected(movie: Movie) {
    setSelectedMovieIds((current) => {
      const next = new Set(current);
      if (next.has(movie.id)) {
        next.delete(movie.id);
      } else {
        next.add(movie.id);
      }
      return next;
    });
  }

  function handleBulkCopyToList(targetListId: string) {
    const selected = activeMovies.filter((movie) => selectedMovieIds.has(movie.id));
    const addedCount = selected.filter((movie) => queueAddition(targetListId, movie.info, movie.source)).length;
    const conflictCount = selected.length - addedCount;
    const listName = listNameFor(targetListId);

    if (addedCount > 0) {
      showToast(`${addedCount} filme(s) copiado(s) para "${listName}".`);
    }
    if (conflictCount > 0) {
      showToast(`${conflictCount} filme(s) já existem em "${listName}" — revise um a um.`, "info");
    }

    setIsBulkCopyChoosing(false);
    setIsSelectionMode(false);
    setSelectedMovieIds(new Set());
  }

  function handleBulkMarkWatched() {
    const selected = activeMovies.filter((movie) => selectedMovieIds.has(movie.id) && !movie.watched);
    const now = new Date().toISOString();
    selected.forEach((movie) => updateMovie({ ...movie, watched: true, watchedAt: now, updatedAt: now }));
    showToast(`${selected.length} filme(s) marcado(s) como assistido.`);

    setIsSelectionMode(false);
    setSelectedMovieIds(new Set());
  }

  function handleBulkMarkUnwatched() {
    const selected = activeMovies.filter((movie) => selectedMovieIds.has(movie.id) && movie.watched);
    const now = new Date().toISOString();
    selected.forEach((movie) => updateMovie({ ...movie, watched: false, watchedAt: undefined, updatedAt: now }));
    showToast(`${selected.length} filme(s) marcado(s) como não assistido.`, "info");

    setIsSelectionMode(false);
    setSelectedMovieIds(new Set());
  }

  function handleRouletteFromSelection() {
    setRouletteInitialIds(Array.from(selectedMovieIds));
    setIsSelectionMode(false);
    setSelectedMovieIds(new Set());
    setIsRouletteOpen(true);
  }

  function handleBulkDelete() {
    const selected = activeMovies.filter((movie) => selectedMovieIds.has(movie.id));
    selected.forEach((movie) => removeMovie(movie.id));
    showToast(`${selected.length} filme(s) excluído(s).`, "info", {
      label: "Desfazer",
      onClick: () => selected.forEach((movie) => addMovie(movie)),
    });

    setIsBulkDeleteConfirming(false);
    setIsSelectionMode(false);
    setSelectedMovieIds(new Set());
  }

  function openCreateList() {
    setEditingList(null);
    setIsDrawerOpen(false);
    setIsListFormOpen(true);
  }

  function openEditList(list: MovieList) {
    setEditingList(list);
    setIsDrawerOpen(false);
    setIsListFormOpen(true);
  }

  function closeListForm() {
    setIsListFormOpen(false);
    setEditingList(null);
  }

  function handleSaveList(list: MovieList) {
    if (editingList) {
      updateList(list);
      showToast(`Lista "${list.name}" atualizada.`);
    } else {
      addList(list);
      updateSettings({ activeListId: list.id });
      showToast(`Lista "${list.name}" criada.`);
    }
  }

  function handleDeleteList(list: MovieList) {
    removeList(list.id);
    refreshMovies();
    showToast(`Lista "${list.name}" excluída.`, "info");
  }

  function handleSelectList(listId: string) {
    updateSettings({ activeListId: listId });
    setIsDrawerOpen(false);
  }

  // Sem nenhuma lista ainda, o conteúdo principal vira um onboarding (mais abaixo) — mas
  // TopBar, Configurações e menu do usuário continuam acessíveis normalmente, já que nada
  // ali depende de existir uma lista.
  const activeList = listsWithStats.find((list) => list.id === activeListId);

  return (
    <div className="min-h-dvh">
      {effectiveAnimationLevel === "full" && <PosterSpotlight lightsOn={lightsOn} />}
      {showFireworks && <Fireworks onDone={() => setShowFireworks(false)} />}

      <div className="sticky top-0 z-30 border-b border-ink-700 bg-ink-950/75 backdrop-blur-md">
        <TopBar
          user={user}
          listName={activeList?.name}
          onLogout={handleLogout}
          onOpenLists={() => setIsDrawerOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenProfile={() => setIsEditProfileOpen(true)}
        />

        {activeMovies.length > 0 && (
          <div className="pb-4">
            <MovieFilterBar
              simpleQueryInput={movieFilters.simpleQueryInput}
              onSimpleQueryChange={movieFilters.setSimpleQueryInput}
              isAdvancedActive={movieFilters.isAdvancedActive}
              isFiltering={movieFilters.isFiltering}
              onOpenAdvanced={() => setIsAdvancedFiltersOpen(true)}
              onClearAll={movieFilters.clearAll}
              isSortActive={!movieSort.isDefaultSort}
              onOpenSort={() => setIsSortDialogOpen(true)}
            />
            <FilterChips
              filters={movieFilters.advancedFilters}
              bounds={movieFilters.bounds}
              onRemove={movieFilters.clearAdvancedField}
            />

            {isSelectionMode && (
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4 sm:px-6">
                <span className="text-sm text-mist-300">
                  {selectedMovieIds.size} selecionado{selectedMovieIds.size === 1 ? "" : "s"}
                </span>
                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                  <Button
                    className="px-3 py-1.5"
                    disabled={selectedMovieIds.size === 0}
                    onClick={handleRouletteFromSelection}
                  >
                    Roletar selecionados
                  </Button>
                  {otherLists.length > 0 && (
                    <div className="relative">
                      <Button
                        className="px-3 py-1.5"
                        disabled={selectedMovieIds.size === 0}
                        onClick={() => setIsBulkCopyChoosing((current) => !current)}
                      >
                        Copiar para lista
                      </Button>
                      {isBulkCopyChoosing && (
                        <div className="absolute right-0 z-20 mt-1 w-48 rounded-lg border border-ink-700 bg-ink-900 p-2 shadow-xl">
                          {otherLists.map((list) => (
                            <button
                              key={list.id}
                              type="button"
                              onClick={() => handleBulkCopyToList(list.id)}
                              className="block w-full truncate rounded-md px-2 py-1.5 text-left text-sm text-mist-100 hover:bg-ink-800"
                            >
                              {list.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    className="px-3 py-1.5"
                    disabled={selectedMovieIds.size === 0}
                    onClick={handleBulkMarkWatched}
                  >
                    Marcar como assistido
                  </Button>
                  <Button
                    variant="ghost"
                    className="px-3 py-1.5"
                    disabled={selectedMovieIds.size === 0}
                    onClick={handleBulkMarkUnwatched}
                  >
                    Marcar como não assistido
                  </Button>
                  <div className="relative">
                    <button
                      type="button"
                      disabled={selectedMovieIds.size === 0}
                      onClick={() => setIsBulkDeleteConfirming((current) => !current)}
                      className="rounded-lg px-3 py-1.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-600/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Excluir
                    </button>
                    {isBulkDeleteConfirming && (
                      <div className="absolute right-0 z-20 mt-1 w-56 rounded-lg border border-ink-700 bg-ink-900 p-3 shadow-xl">
                        <p className="mb-2 text-sm text-mist-200">
                          Excluir {selectedMovieIds.size} filme{selectedMovieIds.size === 1 ? "" : "s"} selecionado
                          {selectedMovieIds.size === 1 ? "" : "s"}?
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setIsBulkDeleteConfirming(false)}
                            className="flex-1 rounded-md px-2 py-1.5 text-center text-sm text-mist-300 hover:bg-ink-800"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={handleBulkDelete}
                            className="flex-1 rounded-md bg-red-600/90 px-2 py-1.5 text-center text-sm text-white hover:bg-red-500"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <Button variant="ghost" className="px-3 py-1.5" onClick={toggleSelectionMode}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <main>
        {lists.length === 0 ? (
          <EmptyState
            title="Crie sua primeira lista para começar."
            description='Ex.: "Filmes com os amigos" ou "Filmes com a namorada" — cada lista tem seus próprios filmes.'
            action={
              <Button className="px-4" onClick={openCreateList}>
                Criar lista
              </Button>
            }
          />
        ) : activeMovies.length === 0 ? (
          <EmptyState
            title="Ainda não temos nenhum filme por aqui."
            description="Cadastre o primeiro filme para começar a organizar as sessões do grupo."
            action={
              <Button className="px-4" onClick={openAddMovie}>
                Adicionar primeiro filme
              </Button>
            }
          />
        ) : sortedMovies.length === 0 ? (
          <EmptyState
            title="Nenhum filme encontrado com esses filtros."
            description="Tente ajustar ou limpar os filtros aplicados."
            action={
              <Button variant="ghost" className="px-4" onClick={movieFilters.clearAll}>
                Limpar filtros
              </Button>
            }
          />
        ) : (
          <MovieGrid
            movies={sortedMovies}
            size={settings.gridSize}
            animationLevel={effectiveAnimationLevel}
            otherLists={otherLists}
            selectionMode={isSelectionMode}
            selectedMovieIds={selectedMovieIds}
            onToggleSelect={toggleMovieSelected}
            onEnterSelectionMode={enterSelectionModeWithMovie}
            onView={openViewMovie}
            onEdit={openEditMovie}
            onDelete={handleDeleteMovie}
            onCopyToList={handleCopyToList}
            onToggleWatched={handleToggleWatched}
          />
        )}
      </main>

      {!isSelectionMode && (
        <SpeedDial
          open={isSpeedDialOpen}
          onOpenChange={setIsSpeedDialOpen}
          onMainAction={() => {
            setRouletteInitialIds(undefined);
            setIsRouletteOpen(true);
          }}
          mainIcon={<RouletteIcon className="h-full w-full" />}
          mainLabel="Sortear filme na roleta"
        >
          <div className="flex flex-col gap-1">
            <SpeedDialAction
              label="Adicionar filme"
              icon={
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
                  <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
                  <path d="M8 5v14M16 5v14" stroke="currentColor" strokeWidth="2" />
                </svg>
              }
              onClick={() => {
                setIsSpeedDialOpen(false);
                openAddMovie();
              }}
            />
            <SpeedDialAction
              label="Selecionar filmes"
              icon={
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
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
              }
              onClick={() => {
                setIsSpeedDialOpen(false);
                toggleSelectionMode();
              }}
            />
          </div>
        </SpeedDial>
      )}

      <MovieFormDialog
        open={isMovieFormOpen}
        onClose={closeMovieForm}
        onSubmit={({ info, source }) => {
          if (editingMovie) {
            if (queueEdit(editingMovie, info, source)) {
              showToast(`"${info.title}" atualizado.`);
            }
          } else if (queueAddition(activeListId, info, source)) {
            showToast(`"${info.title}" adicionado.`);
          }
        }}
        onAddToList={(targetListId, info, source) => {
          if (queueAddition(targetListId, info, source)) {
            showToast(`"${info.title}" também adicionado em "${listNameFor(targetListId)}".`);
          }
        }}
        movie={editingMovie ?? undefined}
        otherLists={otherLists}
        existingMovies={activeMovies}
      />

      <MovieViewDialog
        open={viewingMovie != null}
        onClose={() => setViewingMovieId(null)}
        movie={viewingMovie}
        onToggleWatched={handleToggleWatched}
      />

      <AdvancedFiltersDialog
        open={isAdvancedFiltersOpen}
        onClose={() => setIsAdvancedFiltersOpen(false)}
        movies={activeMovies}
        activeFilters={movieFilters.advancedFilters}
        bounds={movieFilters.bounds}
        onApply={movieFilters.applyAdvancedFilters}
      />

      <SortMoviesDialog
        open={isSortDialogOpen}
        onClose={() => setIsSortDialogOpen(false)}
        activeCriteria={movieSort.criteria}
        onApply={movieSort.applySort}
      />

      <SettingsDialog
        open={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
      />

      <EditProfileDialog
        open={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        user={user}
        onUpdateEmail={updateEmail}
        onUpdatePassword={updatePassword}
        onUpdateAvatarUrl={updateAvatarUrl}
        onSuccess={(message) => showToast(message)}
      />

      <RouletteDialog
        open={isRouletteOpen}
        onClose={() => setIsRouletteOpen(false)}
        movies={activeMovies}
        initialPoolIds={rouletteInitialIds}
      />

      <DuplicateMovieDialog
        open={currentConflict != null}
        existingMovie={currentConflict?.existingMovie ?? null}
        onOverwrite={resolveOverwrite}
        onAddAnyway={resolveAddAnyway}
        onEditExisting={resolveEditExisting}
        onCancel={resolveCancel}
      />

      <ListFormDialog
        open={isListFormOpen}
        onClose={closeListForm}
        onSave={handleSaveList}
        list={editingList ?? undefined}
      />

      <ListsDrawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        lists={listsWithStats}
        activeListId={activeListId}
        onSelectList={handleSelectList}
        onCreateList={openCreateList}
        onEditList={openEditList}
        onDeleteList={handleDeleteList}
        onReorderLists={reorderLists}
      />
    </div>
  );
}
