import { useEffect, useMemo, useState } from "react";
import type { Movie } from "~/models/movie";
import { EMPTY_ADVANCED_FILTERS, type AdvancedMovieFilters } from "~/models/movieFilters";
import { useToast } from "~/contexts/ToastContext";
import { Dialog } from "~/components/common/Dialog";
import { Button } from "~/components/common/Button";
import { FormField } from "~/components/common/FormField";
import { MovieDetails } from "~/components/movies/MovieDetails";
import { RouletteWheel } from "~/components/roulette/RouletteWheel";
import { Fireworks } from "~/components/roulette/Fireworks";
import { AdvancedFiltersDialog } from "~/dialogs/AdvancedFiltersDialog";
import { computeFilterBounds, matchesAdvancedFilters } from "~/utils/movieFilters";

interface RouletteDialogProps {
  open: boolean;
  onClose: () => void;
  movies: Movie[];
  /** Se vier preenchido (ex.: seleção manual na grade), esses filmes viram o pool inicial no lugar do padrão. */
  initialPoolIds?: string[];
}

type Step = "setup" | "wheel" | "celebrating" | "result";

const ROULETTE_DEFAULT_FILTERS: AdvancedMovieFilters = { ...EMPTY_ADVANCED_FILTERS, watched: "unwatched" };

const STEP_TITLES: Record<Step, string> = {
  setup: "Roleta de filmes",
  wheel: "Girando a roleta…",
  celebrating: "Filme sorteado!",
  result: "Filme sorteado!",
};

/**
 * Ao contrário do giro (que é a própria mecânica da roleta e sempre anima por
 * completo), os fogos são um floreio comemorativo — respeitam a configuração de
 * animações e o prefers-reduced-motion, pulando direto pro resultado se desativados.
 */
function shouldShowFireworks(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return false;
  return document.documentElement.dataset.animationLevel !== "off";
}

/**
 * Roleta (seção 24-27 do plano): configura o pool (filtros avançados +
 * inclusão manual independente dos filtros, sem duplicar), sorteia o
 * vencedor antes do giro, gira com física via `RouletteWheel` e mostra o
 * resultado com "Rodar novamente"/"Fechar". Nunca marca como assistido.
 */
export function RouletteDialog({ open, onClose, movies, initialPoolIds }: RouletteDialogProps) {
  const { showToast } = useToast();
  const [step, setStep] = useState<Step>("setup");
  const [poolIds, setPoolIds] = useState<string[]>([]);
  // Filmes adicionados manualmente (ou pela seleção na grade) — sobrevivem a uma nova
  // aplicação de filtro, que só substitui a parte do pool vinda do próprio filtro.
  const [manualIds, setManualIds] = useState<string[]>([]);
  const [rouletteFilters, setRouletteFilters] = useState<AdvancedMovieFilters>(ROULETTE_DEFAULT_FILTERS);
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const [manualQuery, setManualQuery] = useState("");
  const [winnerId, setWinnerId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep("setup");
    setRouletteFilters(ROULETTE_DEFAULT_FILTERS);
    setManualQuery("");
    setWinnerId(null);
    if (initialPoolIds && initialPoolIds.length > 0) {
      // Veio de uma seleção manual na grade — trata como inclusão manual, então
      // sobrevive caso o usuário aplique um filtro avançado em seguida.
      setPoolIds(initialPoolIds);
      setManualIds(initialPoolIds);
    } else {
      // Por padrão a roleta já vem com todos os filmes não assistidos — o usuário só
      // precisa apertar "Girar roleta". Filtro avançado e inclusão manual são exceções
      // pra restringir ou adicionar filmes específicos por cima desse padrão.
      setPoolIds(movies.filter((movie) => matchesAdvancedFilters(movie, ROULETTE_DEFAULT_FILTERS)).map((movie) => movie.id));
      setManualIds([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const bounds = useMemo(() => computeFilterBounds(movies), [movies]);

  const pool = useMemo(
    () => poolIds.map((id) => movies.find((movie) => movie.id === id)).filter((movie): movie is Movie => !!movie),
    [poolIds, movies],
  );

  const manualSuggestions = useMemo(() => {
    const query = manualQuery.trim().toLowerCase();
    if (!query) return [];
    return movies
      .filter((movie) => !poolIds.includes(movie.id))
      .filter((movie) => movie.info.title.toLowerCase().includes(query))
      .slice(0, 8);
  }, [movies, poolIds, manualQuery]);

  function handleApplyFilters(filters: AdvancedMovieFilters) {
    setRouletteFilters(filters);
    // O filtro SUBSTITUI a parte do pool que ele mesmo define — senão, reaplicar um
    // filtro mais restritivo nunca teria efeito visível sobre um pool já cheio.
    // As inclusões manuais (ou vindas da seleção na grade) sempre sobrevivem por cima.
    const matched = movies.filter((movie) => matchesAdvancedFilters(movie, filters)).map((movie) => movie.id);
    setPoolIds(Array.from(new Set([...matched, ...manualIds])));
    setIsAdvancedFiltersOpen(false);
    showToast(`Roleta ajustada: ${matched.length} filme(s) do filtro.`);
  }

  function addManualMovie(movie: Movie) {
    setManualIds((current) => Array.from(new Set([...current, movie.id])));
    setPoolIds((current) => Array.from(new Set([...current, movie.id])));
    setManualQuery("");
  }

  function removeFromPool(id: string) {
    setPoolIds((current) => current.filter((existing) => existing !== id));
    setManualIds((current) => current.filter((existing) => existing !== id));
  }

  function clearPool() {
    setPoolIds([]);
    setManualIds([]);
  }

  function pickWinnerAndSpin() {
    if (pool.length < 2) return;
    const winner = pool[Math.floor(Math.random() * pool.length)];
    setWinnerId(winner.id);
    setStep("wheel");
  }

  const winnerMovie = pool.find((movie) => movie.id === winnerId) ?? null;

  return (
    <>
      <Dialog open={open} onClose={onClose} title={STEP_TITLES[step]} size="full">
        {step === "setup" && (
          <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
            <p className="text-sm text-mist-400">
              Por padrão a roleta sorteia entre os filmes ainda não assistidos. Filtre pra restringir, ou adicione
              filmes específicos manualmente — a inclusão manual funciona independente dos filtros.
            </p>

            <Button variant="ghost" className="w-full" onClick={() => setIsAdvancedFiltersOpen(true)}>
              Filtrar e adicionar filmes
            </Button>

            <FormField
              label="Adicionar filme manualmente"
              placeholder="Buscar por título…"
              value={manualQuery}
              onChange={(event) => setManualQuery(event.target.value)}
            >
              {manualSuggestions.length > 0 && (
                <div className="absolute top-full right-0 left-0 z-20 mt-1 max-h-48 overflow-y-auto rounded-lg border border-ink-700 bg-ink-900 p-1 shadow-xl">
                  {manualSuggestions.map((movie) => (
                    <button
                      key={movie.id}
                      type="button"
                      onClick={() => addManualMovie(movie)}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm text-mist-100 hover:bg-ink-800"
                    >
                      <span className="truncate">{movie.info.title}</span>
                      {movie.watched && <span className="ml-auto shrink-0 text-xs text-mist-400">assistido</span>}
                    </button>
                  ))}
                </div>
              )}
            </FormField>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium text-mist-200">Candidatos ({pool.length})</p>
                {pool.length > 0 && (
                  <button
                    type="button"
                    onClick={clearPool}
                    className="text-xs text-mist-400 underline-offset-2 hover:text-mist-100 hover:underline"
                  >
                    Remover todos
                  </button>
                )}
              </div>
              {pool.length === 0 ? (
                <p className="text-sm text-mist-400">Nenhum filme adicionado ainda.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {pool.map((movie) => (
                    <span
                      key={movie.id}
                      className="flex items-center gap-1.5 rounded-full bg-ink-800 py-1 pr-1.5 pl-3 text-xs text-mist-200"
                    >
                      {movie.info.title}
                      <button
                        type="button"
                        onClick={() => removeFromPool(movie.id)}
                        aria-label={`Remover ${movie.info.title}`}
                        className="rounded-full p-0.5 text-mist-400 hover:bg-ink-700 hover:text-mist-50"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3 w-3">
                          <path
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            d="M6 6l12 12M18 6L6 18"
                          />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {pool.length === 1 && (
                <p className="mt-2 text-xs text-mist-400">Adicione pelo menos mais um filme para poder girar.</p>
              )}
            </div>

            <div className="flex gap-3 border-t border-ink-700 pt-4">
              <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="button" className="flex-1" disabled={pool.length < 2} onClick={pickWinnerAndSpin}>
                Girar roleta
              </Button>
            </div>
          </div>
        )}

        {(step === "wheel" || step === "celebrating") && winnerId && (
          // overflow-hidden aqui é essencial: o disco rotacionando (transform) tem uma
          // caixa delimitadora "visual" maior que seu tamanho real em certos ângulos, e
          // sem isso o container overflow-y-auto do Dialog fica achando que tem overflow
          // a cada frame do giro — um scroll que pisca/aparece e some o tempo todo.
          // O mesmo <RouletteWheel> continua montado entre "wheel" e "celebrating" —
          // trocar de instância reiniciaria a rotação final que os fogos comemoram.
          <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
            <RouletteWheel
              movies={pool}
              winnerId={winnerId}
              onSpinComplete={() => setStep(shouldShowFireworks() ? "celebrating" : "result")}
            />
            {step === "celebrating" && <Fireworks onComplete={() => setStep("result")} />}
          </div>
        )}

        {step === "result" && winnerMovie && (
          <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-6">
            <div className="min-h-0 flex-1">
              <MovieDetails info={winnerMovie.info} className="h-full" />
            </div>
            <div className="flex gap-3 border-t border-ink-700 pt-4">
              <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
                Fechar
              </Button>
              <Button type="button" className="flex-1" onClick={pickWinnerAndSpin}>
                Rodar novamente
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      <AdvancedFiltersDialog
        open={isAdvancedFiltersOpen}
        onClose={() => setIsAdvancedFiltersOpen(false)}
        movies={movies}
        activeFilters={rouletteFilters}
        bounds={bounds}
        onApply={handleApplyFilters}
      />
    </>
  );
}
