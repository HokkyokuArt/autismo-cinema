import type { Movie } from "~/models/movie";
import type { MovieList } from "~/models/movieList";
import type { Person } from "~/models/person";
import type { Rating } from "~/models/rating";
import type { AppSettings } from "~/models/settings";
import { listsRepository } from "~/storage/repositories/listsRepository";
import { moviesRepository } from "~/storage/repositories/moviesRepository";
import { peopleRepository } from "~/storage/repositories/peopleRepository";
import { ratingsRepository } from "~/storage/repositories/ratingsRepository";
import { settingsRepository } from "~/storage/repositories/settingsRepository";

const BACKUP_APP_ID = "autismo-cinema";
/**
 * Versão do FORMATO do backup — independente do `schemaVersion` interno do storageService
 * (que hoje é sempre 1 e não é usado pra migração nenhuma). Sobe só quando o formato do
 * JSON exportado muda de um jeito que quebraria a leitura por uma versão anterior do app.
 */
const BACKUP_FORMAT_VERSION = 1;

export interface BackupData {
  movies: Movie[];
  lists: MovieList[];
  people: Person[];
  ratings: Rating[];
  settings: AppSettings;
}

export interface BackupEnvelope {
  appId: string;
  version: number;
  exportedAt: string;
  data: BackupData;
}

export interface BackupSummary {
  movies: number;
  lists: number;
  people: number;
  ratings: number;
}

export type BackupValidationResult =
  | { ok: true; backup: BackupEnvelope; summary: BackupSummary }
  | { ok: false; error: string };

export interface BuildBackupOptions {
  /** Se informado, exporta só essas listas (e os filmes/avaliações que pertencem a elas). */
  listIds?: string[];
}

/**
 * Reúne só os dados do "acervo" do grupo (filmes, listas, pessoas, avaliações e
 * preferências). Propositalmente NÃO inclui `users` (senha com hash + salt — dado de
 * conta, não faz sentido importar em outro dispositivo) nem `session` (efêmera, expira
 * sozinha e é específica de cada login).
 */
export function buildBackup(options: BuildBackupOptions = {}): BackupEnvelope {
  const allLists = listsRepository.getAll();
  const allMovies = moviesRepository.getAll();
  const allRatings = ratingsRepository.getAll();

  const lists = options.listIds ? allLists.filter((list) => options.listIds!.includes(list.id)) : allLists;
  const listIds = new Set(lists.map((list) => list.id));
  const movies = options.listIds ? allMovies.filter((movie) => listIds.has(movie.listId)) : allMovies;
  const movieIds = new Set(movies.map((movie) => movie.id));
  // Pessoas não são filtradas — são só nomes reutilizados nas avaliações, não fazem
  // sentido "pertencer" a uma lista, então continuam todas indo no backup.
  const ratings = options.listIds ? allRatings.filter((rating) => movieIds.has(rating.movieId)) : allRatings;

  return {
    appId: BACKUP_APP_ID,
    version: BACKUP_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      movies,
      lists,
      people: peopleRepository.getAll(),
      ratings,
      settings: settingsRepository.get(),
    },
  };
}

export function serializeBackup(options?: BuildBackupOptions): string {
  return JSON.stringify(buildBackup(options), null, 2);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Validação estrutural (não campo a campo): confirma que é um backup deste app, numa
 * versão que sabemos ler, e que cada seção tem o formato e os campos mínimos que o resto
 * do app depende pra não quebrar em runtime — sem exigir todo campo opcional presente.
 */
export function validateBackup(rawText: string): BackupValidationResult {
  const text = rawText.trim();
  if (!text) {
    return { ok: false, error: "Não há nada pra importar — o conteúdo está vazio." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "O conteúdo não é um JSON válido. Confira se foi copiado/selecionado por inteiro, sem cortes." };
  }

  if (!isPlainObject(parsed)) {
    return { ok: false, error: "O JSON precisa ser um objeto — isso não parece um backup do Autismo Cinema." };
  }

  if (parsed.appId !== BACKUP_APP_ID) {
    return { ok: false, error: "Este arquivo não é um backup do Autismo Cinema." };
  }

  if (typeof parsed.version !== "number") {
    return { ok: false, error: "Backup sem número de versão — o arquivo está corrompido ou incompleto." };
  }
  if (parsed.version > BACKUP_FORMAT_VERSION) {
    return {
      ok: false,
      error:
        `Este backup foi feito numa versão mais nova do app (formato v${parsed.version}) do que a que você está ` +
        `usando (v${BACKUP_FORMAT_VERSION}). Atualize o app antes de importar.`,
    };
  }

  if (!isPlainObject(parsed.data)) {
    return { ok: false, error: "Backup sem a seção de dados — o arquivo está corrompido ou incompleto." };
  }
  const data = parsed.data;

  const movies = data.movies;
  if (
    !Array.isArray(movies) ||
    !movies.every((movie) => isPlainObject(movie) && typeof movie.id === "string" && isPlainObject(movie.info))
  ) {
    return { ok: false, error: "Os dados de filmes do backup estão num formato inválido ou corrompido." };
  }

  const lists = data.lists;
  if (
    !Array.isArray(lists) ||
    !lists.every((list) => isPlainObject(list) && typeof list.id === "string" && typeof list.name === "string")
  ) {
    return { ok: false, error: "Os dados de listas do backup estão num formato inválido ou corrompido." };
  }

  const people = data.people;
  if (
    !Array.isArray(people) ||
    !people.every((person) => isPlainObject(person) && typeof person.id === "string" && typeof person.name === "string")
  ) {
    return { ok: false, error: "Os dados de pessoas do backup estão num formato inválido ou corrompido." };
  }

  const ratings = data.ratings;
  if (
    !Array.isArray(ratings) ||
    !ratings.every(
      (rating) =>
        isPlainObject(rating) &&
        typeof rating.id === "string" &&
        typeof rating.movieId === "string" &&
        typeof rating.personId === "string",
    )
  ) {
    return { ok: false, error: "Os dados de avaliações do backup estão num formato inválido ou corrompido." };
  }

  const settings = data.settings;
  if (!isPlainObject(settings) || typeof settings.gridSize !== "string" || typeof settings.animationLevel !== "string") {
    return { ok: false, error: "Os dados de configurações do backup estão num formato inválido ou corrompido." };
  }

  return {
    ok: true,
    backup: parsed as unknown as BackupEnvelope,
    summary: { movies: movies.length, lists: lists.length, people: people.length, ratings: ratings.length },
  };
}

export type ImportMode = "overwrite" | "merge";

/** Uma lista final por id — o item do backup (`incoming`) vence quando o id já existia. */
function mergeById<T extends { id: string }>(existing: T[], incoming: T[]): T[] {
  const byId = new Map(existing.map((item) => [item.id, item]));
  for (const item of incoming) byId.set(item.id, item);
  return Array.from(byId.values());
}

/**
 * "overwrite" substitui TODO o acervo local pelo conteúdo do backup — destrutivo e
 * irreversível. "merge" preserva o que já existe: ids que só estão no backup são
 * adicionados, ids que já existem localmente são atualizados com a versão do backup,
 * e o que só existe localmente (fora do backup) não é tocado.
 */
export function applyBackup(backup: BackupEnvelope, mode: ImportMode = "overwrite"): void {
  if (mode === "overwrite") {
    listsRepository.replaceAll(backup.data.lists);
    moviesRepository.replaceAll(backup.data.movies);
    peopleRepository.replaceAll(backup.data.people);
    ratingsRepository.replaceAll(backup.data.ratings);
  } else {
    listsRepository.replaceAll(mergeById(listsRepository.getAll(), backup.data.lists));
    moviesRepository.replaceAll(mergeById(moviesRepository.getAll(), backup.data.movies));
    peopleRepository.replaceAll(mergeById(peopleRepository.getAll(), backup.data.people));
    ratingsRepository.replaceAll(mergeById(ratingsRepository.getAll(), backup.data.ratings));
  }
  settingsRepository.update(backup.data.settings);
}

export function downloadBackupFile(options?: BuildBackupOptions): void {
  const json = serializeBackup(options);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0, 10);
  const link = document.createElement("a");
  link.href = url;
  link.download = `autismo-cinema-backup-${stamp}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function copyBackupToClipboard(options?: BuildBackupOptions): Promise<void> {
  await navigator.clipboard.writeText(serializeBackup(options));
}
