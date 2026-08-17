/** Cada parte é um pedaço pequeno e independente do tutorial — dá pra refazer uma por vez. */
export type TutorialPartId =
  | "welcome"
  | "create-list"
  | "find-lists"
  | "add-movie-guided"
  | "add-movie-free"
  | "filters"
  | "movie-actions"
  | "roulette"
  | "wrap-up";

export interface TutorialProgress {
  completedParts: TutorialPartId[];
  /** true = usuário pulou o tutorial em algum momento; não dispara mais sozinho. */
  dismissed: boolean;
}

export const TUTORIAL_PART_ORDER: TutorialPartId[] = [
  "welcome",
  "create-list",
  "find-lists",
  "add-movie-guided",
  "add-movie-free",
  "filters",
  "movie-actions",
  "roulette",
  "wrap-up",
];

export const TUTORIAL_PARTS: { id: TutorialPartId; label: string; description: string }[] = [
  { id: "welcome", label: "Boas-vindas", description: "A introdução rápida ao app." },
  { id: "create-list", label: "Criar lista", description: "Como criar sua primeira lista de filmes." },
  { id: "find-lists", label: "Encontrar suas listas", description: "Onde ficam e como trocar de lista." },
  {
    id: "add-movie-guided",
    label: "Adicionar filme (guiado)",
    description: "Busca por título e cadastro pela API, passo a passo.",
  },
  { id: "add-movie-free", label: "Adicionar filme (livre)", description: "A mesma coisa, agora por sua conta." },
  { id: "filters", label: "Filtros", description: "Busca, filtros avançados e ordenação." },
  {
    id: "movie-actions",
    label: "Ações do filme",
    description: "Selecionar vários, marcar como assistido, editar e excluir.",
  },
  { id: "roulette", label: "Roleta", description: "Como sortear um filme pra assistir." },
  { id: "wrap-up", label: "Configurações e extras", description: "Onde encontrar o resto do app." },
];
