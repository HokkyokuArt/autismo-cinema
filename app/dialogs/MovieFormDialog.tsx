import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type { Movie, MovieInfo, MovieSource } from "~/models/movie";
import type { MovieList } from "~/models/movieList";
import { movieProvider, MovieProviderError, type MovieSearchResult } from "~/api/movieProvider";
import { findDuplicateMovie } from "~/utils/movieDuplicates";
import {
  EMPTY_MOVIE_FORM,
  formStateToMovieInfo,
  movieInfoToFormState,
  type MovieFormState,
} from "~/utils/movieForm";
import { Dialog } from "~/components/common/Dialog";
import { Button } from "~/components/common/Button";
import { FormField } from "~/components/common/FormField";
import { TextareaField } from "~/components/common/TextareaField";
import { PosterImage } from "~/components/movies/PosterImage";

const SEARCH_DEBOUNCE_MS = 400;

type Step = "search" | "form";

interface MovieFormDialogProps {
  open: boolean;
  onClose: () => void;
  /** Cadastro/edição na lista atual — a página decide add vs. update e checa duplicatas. */
  onSubmit: (data: { info: MovieInfo; source: MovieSource }) => void;
  /** Chamado uma vez por lista extra marcada em "também adicionar em". */
  onAddToList: (targetListId: string, info: MovieInfo, source: MovieSource) => void;
  /** Presente = editando este filme; ausente = cadastrando um novo. */
  movie?: Movie;
  /** Demais listas, oferecidas como "também adicionar em". */
  otherLists: MovieList[];
  /** Filmes já na lista atual — usado pra ocultar/marcar resultados de busca já adicionados. */
  existingMovies: Movie[];
}

export function MovieFormDialog({
  open,
  onClose,
  onSubmit,
  onAddToList,
  movie,
  otherLists,
  existingMovies,
}: MovieFormDialogProps) {
  const isEditing = movie != null;
  const [step, setStep] = useState<Step>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MovieSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showAlreadyAdded, setShowAlreadyAdded] = useState(false);
  /** Guarda os objetos inteiros (não só o tmdbId) — sobrevive a trocas de consulta,
   * já que os resultados de uma busca anterior somem de `results` quando a busca muda. */
  const [selectedResults, setSelectedResults] = useState<MovieSearchResult[]>([]);
  /** Fila dos selecionados ainda por vir (o atual já está carregado no formulário). */
  const [batchQueue, setBatchQueue] = useState<MovieSearchResult[]>([]);
  const [batchTotal, setBatchTotal] = useState(0);

  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const [formState, setFormState] = useState<MovieFormState>(EMPTY_MOVIE_FORM);
  const [formSource, setFormSource] = useState<MovieSource>("manual");
  const [titleError, setTitleError] = useState<string | null>(null);
  const [extraListIds, setExtraListIds] = useState<string[]>([]);
  const initialFormStateRef = useRef<MovieFormState>(EMPTY_MOVIE_FORM);
  /** Guarda os dados crus da API (com logoUrl das plataformas) até o momento de salvar. */
  const fetchedInfoRef = useRef<MovieInfo | null>(null);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setResults([]);
    setSearchError(null);
    setDetailsError(null);
    setTitleError(null);
    setExtraListIds([]);
    setShowAlreadyAdded(false);
    setSelectedResults([]);
    setBatchQueue([]);
    setBatchTotal(0);

    if (movie) {
      setStep("form");
      const initial = movieInfoToFormState(movie.info);
      setFormState(initial);
      setFormSource(movie.source);
      initialFormStateRef.current = initial;
      fetchedInfoRef.current = movie.info;
    } else {
      setStep("search");
      setFormState(EMPTY_MOVIE_FORM);
      setFormSource("manual");
      initialFormStateRef.current = EMPTY_MOVIE_FORM;
      fetchedInfoRef.current = null;
    }
  }, [open, movie]);

  const isDirty =
    extraListIds.length > 0 ||
    JSON.stringify(formState) !== JSON.stringify(initialFormStateRef.current);

  useEffect(() => {
    if (step !== "search" || query.trim().length === 0) {
      setResults([]);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    const timeoutId = setTimeout(async () => {
      try {
        const found = await movieProvider.searchMovies(query);
        setResults(found);
      } catch (error) {
        setResults([]);
        setSearchError(
          error instanceof MovieProviderError ? error.message : "Algo deu errado na busca.",
        );
      } finally {
        setIsSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [query, step]);

  const alreadyAddedIds = useMemo(() => {
    const ids = new Set<number>();
    for (const result of results) {
      if (findDuplicateMovie(existingMovies, { title: result.title })) {
        ids.add(result.tmdbId);
      }
    }
    return ids;
  }, [results, existingMovies]);

  const visibleResults = showAlreadyAdded
    ? results
    : results.filter((result) => !alreadyAddedIds.has(result.tmdbId));
  const hiddenAlreadyAddedCount = showAlreadyAdded ? 0 : alreadyAddedIds.size;
  const allVisibleSelected =
    visibleResults.length > 0 &&
    visibleResults.every((result) => selectedResults.some((selected) => selected.tmdbId === result.tmdbId));

  function toggleResultSelected(result: MovieSearchResult) {
    setSelectedResults((current) =>
      current.some((selected) => selected.tmdbId === result.tmdbId)
        ? current.filter((selected) => selected.tmdbId !== result.tmdbId)
        : [...current, result],
    );
  }

  function toggleSelectAllVisible() {
    setSelectedResults((current) => {
      if (allVisibleSelected) {
        const visibleIds = new Set(visibleResults.map((result) => result.tmdbId));
        return current.filter((selected) => !visibleIds.has(selected.tmdbId));
      }
      const currentIds = new Set(current.map((selected) => selected.tmdbId));
      return [...current, ...visibleResults.filter((result) => !currentIds.has(result.tmdbId))];
    });
  }

  async function loadResultIntoForm(result: MovieSearchResult) {
    setIsLoadingDetails(true);
    setDetailsError(null);
    try {
      const info = await movieProvider.getMovieDetails(result.tmdbId);
      setFormState(movieInfoToFormState(info));
      setFormSource("api");
      setStep("form");
      fetchedInfoRef.current = info;
    } catch (error) {
      setDetailsError(
        error instanceof MovieProviderError ? error.message : "Algo deu errado ao carregar o filme.",
      );
    } finally {
      setIsLoadingDetails(false);
    }
  }

  function handleStartBatch() {
    if (selectedResults.length === 0) return;

    const [first, ...rest] = selectedResults;
    setBatchQueue(rest);
    setBatchTotal(selectedResults.length);
    setSelectedResults([]);
    loadResultIntoForm(first);
  }

  function handleStartManual() {
    setBatchQueue([]);
    setBatchTotal(0);
    setFormState(EMPTY_MOVIE_FORM);
    setFormSource("manual");
    setStep("form");
    fetchedInfoRef.current = null;
  }

  function handleBackToSearch() {
    setBatchQueue([]);
    setBatchTotal(0);
    setStep("search");
  }

  function updateField<K extends keyof MovieFormState>(key: K, value: MovieFormState[K]) {
    setFormState((current) => ({ ...current, [key]: value }));
  }

  function handleSave(event: FormEvent) {
    event.preventDefault();

    if (formState.title.trim().length === 0) {
      setTitleError("Informe o título do filme.");
      return;
    }

    const info = formStateToMovieInfo(formState, fetchedInfoRef.current?.streamingPlatforms);

    onSubmit({ info, source: formSource });

    extraListIds.forEach((targetListId) => {
      onAddToList(targetListId, info, formSource);
    });

    // Em lote: em vez de fechar, carrega o próximo selecionado no formulário.
    if (batchQueue.length > 0) {
      const [next, ...rest] = batchQueue;
      setBatchQueue(rest);
      setExtraListIds([]);
      setTitleError(null);
      loadResultIntoForm(next);
      return;
    }

    setBatchTotal(0);
    onClose();
  }

  function toggleExtraList(targetListId: string, checked: boolean) {
    setExtraListIds((current) =>
      checked ? [...current, targetListId] : current.filter((id) => id !== targetListId),
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={isEditing ? "Editar filme" : "Adicionar filme"}
      size="xl"
      isDirty={isDirty}
    >
      {step === "search" && (
        <div className="flex flex-col gap-4">
          <FormField
            label="Buscar filme"
            placeholder="Ex.: Interestelar"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoFocus
          />

          {isLoadingDetails && <p className="text-sm text-mist-400">Carregando detalhes…</p>}
          {detailsError && (
            <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {detailsError}
            </p>
          )}
          {searchError && (
            <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {searchError}
            </p>
          )}
          {isSearching && <p className="text-sm text-mist-400">Buscando…</p>}

          {!isSearching && query.trim().length > 0 && results.length === 0 && !searchError && (
            <p className="text-sm text-mist-400">Nenhum filme encontrado para "{query}".</p>
          )}

          {alreadyAddedIds.size > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <label className="flex items-center gap-2 text-xs text-mist-400">
                <input
                  type="checkbox"
                  checked={showAlreadyAdded}
                  onChange={(event) => setShowAlreadyAdded(event.target.checked)}
                  className="h-3.5 w-3.5 rounded border-ink-600 bg-ink-800 text-brand-600 focus:ring-brand-500"
                />
                Mostrar filmes já adicionados na lista
              </label>
              {hiddenAlreadyAddedCount > 0 && (
                <p className="text-xs text-mist-400">
                  {hiddenAlreadyAddedCount} filme{hiddenAlreadyAddedCount === 1 ? "" : "s"} já adicionado
                  {hiddenAlreadyAddedCount === 1 ? "" : "s"} {hiddenAlreadyAddedCount === 1 ? "está" : "estão"} oculto
                  {hiddenAlreadyAddedCount === 1 ? "" : "s"}.
                </p>
              )}
            </div>
          )}

          {visibleResults.length > 0 && (
            <label className="flex items-center gap-2 text-xs text-mist-400">
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={toggleSelectAllVisible}
                className="h-3.5 w-3.5 rounded border-ink-600 bg-ink-800 text-brand-600 focus:ring-brand-500"
              />
              {allVisibleSelected ? "Desmarcar todos" : "Selecionar todos"}
            </label>
          )}

          <ul className="flex max-h-[65vh] flex-col gap-2 overflow-y-auto">
            {visibleResults.map((result) => {
              const isSelected = selectedResults.some((selected) => selected.tmdbId === result.tmdbId);
              return (
                <li key={result.tmdbId}>
                  <button
                    type="button"
                    onClick={() => toggleResultSelected(result)}
                    disabled={isLoadingDetails}
                    className={
                      "flex w-full items-center gap-3 rounded-lg border p-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60 " +
                      (isSelected
                        ? "border-brand-500 bg-brand-500/10"
                        : "border-ink-700 hover:border-brand-500 hover:bg-ink-800")
                    }
                  >
                    <div className="w-12 shrink-0">
                      <PosterImage src={result.posterUrl} alt={result.title} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-mist-50">{result.title}</p>
                      {result.originalTitle && (
                        <p className="truncate text-xs text-mist-400 italic">{result.originalTitle}</p>
                      )}
                      {result.releaseYear && (
                        <p className="text-xs text-mist-400">{result.releaseYear}</p>
                      )}
                      {alreadyAddedIds.has(result.tmdbId) && (
                        <p className="text-xs text-brand-300">Já na lista</p>
                      )}
                    </div>
                    {isSelected && (
                      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 shrink-0 text-brand-400">
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
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="flex gap-3 border-t border-ink-700 pt-4">
            <Button type="button" className="flex-1" disabled={isLoadingDetails} onClick={handleStartManual}>
              Adicionar manualmente
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={selectedResults.length === 0 || isLoadingDetails}
              onClick={handleStartBatch}
            >
              {selectedResults.length > 0 ? `Adicionar (${selectedResults.length})` : "Adicionar selecionados"}
            </Button>
          </div>
        </div>
      )}

      {step === "form" && (
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          {batchTotal > 0 && (
            <p className="rounded-lg bg-brand-500/10 px-3 py-2 text-xs text-brand-300">
              Filme {batchTotal - batchQueue.length} de {batchTotal} selecionados.
            </p>
          )}

          {formSource === "api" && !isEditing && (
            <p className="rounded-lg bg-brand-500/10 px-3 py-2 text-xs text-brand-300">
              Preenchido automaticamente — revise antes de salvar.
            </p>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Título*"
                  value={formState.title}
                  onChange={(event) => updateField("title", event.target.value)}
                  error={titleError ?? undefined}
                />
                <FormField
                  label="Título original"
                  value={formState.originalTitle}
                  onChange={(event) => updateField("originalTitle", event.target.value)}
                />
              </div>
              <div className="flex items-end gap-3">
                <div className="w-20 shrink-0">
                  <PosterImage
                    src={formState.posterUrl || undefined}
                    alt={formState.title || "Pôster"}
                  />
                </div>
                <div className="flex-1">
                  <FormField
                    label="URL do pôster"
                    value={formState.posterUrl}
                    onChange={(event) => updateField("posterUrl", event.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Ano"
                  type="number"
                  value={formState.releaseYear}
                  onChange={(event) => updateField("releaseYear", event.target.value)}
                />
                <FormField
                  label="Duração (min)"
                  type="number"
                  value={formState.runtimeMinutes}
                  onChange={(event) => updateField("runtimeMinutes", event.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  label="Nota IMDb"
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={formState.imdbRating}
                  onChange={(event) => updateField("imdbRating", event.target.value)}
                />
                <FormField
                  label="Link do IMDb"
                  value={formState.imdbUrl}
                  onChange={(event) => updateField("imdbUrl", event.target.value)}
                />
              </div>

              <FormField
                label="Diretor"
                value={formState.director}
                onChange={(event) => updateField("director", event.target.value)}
              />
              <FormField
                label="Gêneros (separados por vírgula)"
                value={formState.genres}
                onChange={(event) => updateField("genres", event.target.value)}
              />
              <FormField
                label="Elenco (separado por vírgula)"
                value={formState.cast}
                onChange={(event) => updateField("cast", event.target.value)}
              />
              <FormField
                label="Onde assistir (plataformas, separadas por vírgula)"
                value={formState.streamingPlatforms}
                onChange={(event) => updateField("streamingPlatforms", event.target.value)}
              />
            </div>

            <div className="flex flex-col gap-4">
              <TextareaField
                label="Descrição curta"
                rows={3}
                value={formState.shortDescription}
                onChange={(event) => updateField("shortDescription", event.target.value)}
              />
              <TextareaField
                label="Sinopse completa"
                rows={16}
                value={formState.synopsis}
                onChange={(event) => updateField("synopsis", event.target.value)}
              />
            </div>
          </div>

          {otherLists.length > 0 && (
            <div className="rounded-lg border border-ink-700 p-3">
              <p className="mb-2 text-sm font-medium text-mist-200">Também adicionar em:</p>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {otherLists.map((list) => (
                  <label key={list.id} className="flex items-center gap-2 text-sm text-mist-100">
                    <input
                      type="checkbox"
                      checked={extraListIds.includes(list.id)}
                      onChange={(event) => toggleExtraList(list.id, event.target.checked)}
                      className="h-4 w-4 rounded border-ink-600 bg-ink-800 text-brand-600 focus:ring-brand-500"
                    />
                    {list.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 border-t border-ink-700 pt-4">
            {!isEditing && (
              <Button type="button" variant="ghost" className="flex-1" onClick={handleBackToSearch}>
                Voltar
              </Button>
            )}
            <Button type="submit" className="flex-1">
              {isEditing
                ? "Salvar alterações"
                : batchQueue.length > 0
                  ? "Salvar e ir para o próximo"
                  : "Salvar filme"}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
