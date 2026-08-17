import { useEffect, useState, type ReactNode } from "react";
import type { TutorialPartId, TutorialProgress } from "~/models/tutorial";
import { tutorialRepository } from "~/storage/repositories/tutorialRepository";
import { TutorialOverlay, type TutorialStepView } from "~/components/tutorial/TutorialOverlay";

export type TutorialEventId =
  | "list-created"
  | "movie-added"
  | "drawer-closed"
  | "speed-dial-opened"
  | "context-menu-opened"
  | "movie-selected"
  | "roulette-opened"
  | "roulette-spinning"
  | "roulette-closed";

export type TutorialDialogId = "list-form" | "movie-form-search" | "roulette-setup" | "roulette-result";

interface TutorialStep {
  id: string;
  part: TutorialPartId;
  target?: string;
  /** Ver `TutorialStepView.fallbackTarget` — reaproveitado quando `target` some do DOM. */
  fallbackTarget?: string;
  title?: string;
  message: ReactNode;
  cta?: string;
  awaitClickTarget?: boolean;
  awaitEvent?: TutorialEventId;
  matches?: (payload: unknown) => boolean;
  insideDialog?: TutorialDialogId;
  onEnter?: () => void;
}

interface BuildStepsParams {
  hasLists: boolean;
  openListsDrawerForCreateList: () => void;
}

function buildSteps({ hasLists, openListsDrawerForCreateList }: BuildStepsParams): TutorialStep[] {
  return [
    {
      id: "welcome",
      part: "welcome",
      title: "Bem-vindo(a) ao Autismo Cinema! 🎬",
      message:
        "Vou te mostrar o básico em uns passos rápidos — sem enrolação, prometo. Dá pra pular quando quiser, não vou ficar de cara feia.",
      cta: "Bora lá!",
    },
    {
      id: "create-list-button",
      part: "create-list",
      target: "create-list-button",
      message:
        'Toda sessão de cinema decente começa com uma lista. Toca aí pra criar a primeira — o nome fica com você ("Filmes com a galera" é um clássico).',
      awaitClickTarget: true,
      onEnter: () => {
        if (hasLists) openListsDrawerForCreateList();
      },
    },
    {
      id: "create-list-dialog",
      part: "create-list",
      insideDialog: "list-form",
      message: 'Dá um nome (e uma descrição, se quiser) e manda ver em "Criar lista".',
      awaitEvent: "list-created",
    },
    {
      id: "open-lists-button",
      part: "find-lists",
      target: "open-lists-button",
      message:
        "Lista criada! Esse ícone aqui guarda todas as suas listas — é pra onde você volta pra trocar de sessão. Toca pra abrir.",
      awaitClickTarget: true,
    },
    {
      id: "lists-drawer-panel",
      part: "find-lists",
      target: "lists-drawer-panel",
      message:
        "Aqui estão suas listas: dá pra criar, editar, reordenar (segura o ícone de pontinhos e arrasta) e trocar a atual. Fecha quando quiser seguir em frente.",
      awaitEvent: "drawer-closed",
    },
    {
      id: "speed-dial-hold",
      part: "add-movie-guided",
      target: "speed-dial-main",
      message:
        "Bora adicionar um filme! Esse botão roxo é seu canivete suíço: toque rápido chama a roleta, mas se você SEGURAR ele um instante, um painel de opções aparece. Segura aí, sem pressa. 😌",
      awaitEvent: "speed-dial-opened",
    },
    {
      id: "speed-dial-add-action",
      part: "add-movie-guided",
      target: "speed-dial-add-movie",
      fallbackTarget: "speed-dial-main",
      message: 'Isso aí! Agora escolhe "Adicionar filme". (Painel fechou sozinho? Segura o botão roxo de novo.)',
      awaitClickTarget: true,
    },
    {
      id: "movie-search-guided",
      part: "add-movie-guided",
      insideDialog: "movie-form-search",
      message:
        'Digite "Inception" na busca e escolhe o resultado certo. (Sim, o filme dos sonhos dentro de sonhos — aqui é só uma camada, prometo.) Se um dia a busca não achar um filme, tem um botão "Adicionar manualmente" logo ali embaixo pra cadastrar você mesmo.',
      awaitEvent: "movie-added",
      // TMDB costuma devolver o título localizado (ex.: "A Origem") com o original
      // ("Inception") só em `originalTitle` — checa os dois pra não travar o passo.
      matches: (payload) => {
        const { title, originalTitle } = (payload as { title?: string; originalTitle?: string }) ?? {};
        return [title, originalTitle].some((value) => value?.toLowerCase().includes("inception"));
      },
    },
    {
      id: "speed-dial-hold-2",
      part: "add-movie-free",
      target: "speed-dial-main",
      message: "Mandou bem! Um filme já tá na lista. Bora de novo — segura o botão roxo mais uma vez.",
      awaitEvent: "speed-dial-opened",
    },
    {
      id: "speed-dial-add-action-2",
      part: "add-movie-free",
      target: "speed-dial-add-movie",
      fallbackTarget: "speed-dial-main",
      message: '"Adicionar filme" de novo. (Painel fechou sozinho? Segura o botão roxo de novo.)',
      awaitClickTarget: true,
    },
    {
      id: "movie-search-free",
      part: "add-movie-free",
      insideDialog: "movie-form-search",
      message:
        "Agora é livre: busca o filme que você quiser (ou cadastra manualmente). Precisamos de pelo menos 2 filmes na lista pra roleta fazer sentido daqui a pouco.",
      awaitEvent: "movie-added",
    },
    {
      id: "filters-overview",
      part: "filters",
      target: "filter-bar",
      message:
        "Aqui em cima: busca rápida por título, filtros avançados (gênero, nota, ano, plataforma...) e ordenação. Não precisa decorar agora, só saber que existe.",
      cta: "Entendi",
    },
    {
      id: "long-press-card",
      part: "movie-actions",
      target: "movie-card-first",
      message:
        'Segura (aquele toque longo, "long press") um pôster pra abrir o menu rápido dele: visualizar, selecionar, editar, marcar como assistido, copiar pra outra lista e excluir.',
      awaitEvent: "context-menu-opened",
    },
    {
      id: "context-menu-watched",
      part: "movie-actions",
      target: "context-menu-toggle-watched",
      message: "Marca esse aqui como assistido — dá pra desmarcar depois, e as notas do grupo continuam guardadas.",
      awaitClickTarget: true,
    },
    {
      id: "context-menu-edit-delete-info",
      part: "movie-actions",
      message:
        'De bônus: "Editar" corrige qualquer informação depois, e "Excluir" some com o filme (com um "Desfazer" rapidinho, caso mude de ideia).',
      cta: "Entendi",
    },
    {
      id: "speed-dial-hold-select",
      part: "movie-actions",
      target: "speed-dial-main",
      message: "Pra selecionar vários filmes de uma vez, segura o botão roxo mais uma vez.",
      awaitEvent: "speed-dial-opened",
    },
    {
      id: "speed-dial-select-action",
      part: "movie-actions",
      target: "speed-dial-select-action",
      fallbackTarget: "speed-dial-main",
      message: 'Escolhe "Selecionar filmes". (Painel fechou sozinho? Segura o botão roxo de novo.)',
      awaitClickTarget: true,
    },
    {
      id: "select-a-card",
      part: "movie-actions",
      target: "movie-card-first",
      message:
        "Toca em um ou mais pôsteres pra selecionar. Ali em cima aparece uma barra com ações em lote: marcar assistido, copiar pra outra lista, roletar só os selecionados, excluir...",
      awaitEvent: "movie-selected",
    },
    {
      id: "exit-selection",
      part: "movie-actions",
      target: "selection-cancel-button",
      message: 'Terminou a demonstração? Toca em "Cancelar" pra sair do modo seleção sem alterar nada.',
      awaitClickTarget: true,
    },
    {
      id: "roulette-open",
      part: "roulette",
      target: "speed-dial-main",
      message:
        "Chegou a hora da roleta! Dessa vez é toque RÁPIDO (sem segurar) no mesmo botão roxo — ele já sabe diferenciar.",
      awaitEvent: "roulette-opened",
    },
    {
      id: "roulette-setup",
      part: "roulette",
      insideDialog: "roulette-setup",
      message:
        'Já vem pronta com os filmes não assistidos. Dá pra filtrar ou adicionar filmes manualmente, mas por agora é só apertar "Girar roleta".',
      awaitEvent: "roulette-spinning",
    },
    {
      id: "roulette-result",
      part: "roulette",
      insideDialog: "roulette-result",
      message:
        '"Rodar novamente" gira de novo (sem compromisso), "Fechar" encerra por aqui — os dois fazem exatamente o que dizem.',
      awaitEvent: "roulette-closed",
    },
    {
      id: "settings-mention",
      part: "wrap-up",
      target: "settings-gear-button",
      message:
        "Só um adendo antes de eu sumir: essa engrenagem guarda os ajustes finos — tamanho da grade, animações, backup e, claro, os tutoriais. Não precisa ir lá agora. Quando quiser rever qualquer parte desse tour, é só ir em Configurações → Tutoriais. Bom filme! 🍿",
      cta: "Fechar tutorial",
    },
  ];
}

interface Engine {
  steps: TutorialStep[] | null;
  index: number;
}

interface UseTutorialFlowParams {
  userId: string | undefined;
  hasLists: boolean;
  animationsEnabled: boolean;
  openListsDrawerForCreateList: () => void;
}

interface UseTutorialFlowResult {
  overlay: ReactNode;
  isActive: boolean;
  progress: TutorialProgress;
  notify: (event: TutorialEventId, payload?: unknown) => void;
  startFull: () => void;
  startPart: (partId: TutorialPartId) => void;
  skip: () => void;
  hintFor: (dialogId: TutorialDialogId) => ReactNode | undefined;
}

export function useTutorialFlow({
  userId,
  hasLists,
  animationsEnabled,
  openListsDrawerForCreateList,
}: UseTutorialFlowParams): UseTutorialFlowResult {
  const [engine, setEngine] = useState<Engine>({ steps: null, index: 0 });
  const [progress, setProgress] = useState<TutorialProgress>(() =>
    userId ? tutorialRepository.get(userId) : { completedParts: [], dismissed: false },
  );

  const currentStep = engine.steps ? engine.steps[engine.index] : null;

  // Dispara sozinho na primeira vez que esse usuário loga (nunca existiu progresso salvo pra ele).
  useEffect(() => {
    if (!userId) return;
    if (tutorialRepository.isUnseen(userId)) {
      setEngine({ steps: buildSteps({ hasLists, openListsDrawerForCreateList }), index: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  function finishRun(finishedStep: TutorialStep) {
    if (!userId) return;
    const nextProgress = tutorialRepository.markPartDone(userId, finishedStep.part);
    setProgress(nextProgress);
  }

  function advance() {
    setEngine((prev) => {
      if (!prev.steps) return prev;
      const step = prev.steps[prev.index];
      const isLastOfRun =
        prev.index === prev.steps.length - 1 || prev.steps[prev.index + 1].part !== step.part;
      if (isLastOfRun) finishRun(step);
      const nextIndex = prev.index + 1;
      if (nextIndex >= prev.steps.length) return { steps: null, index: 0 };
      return { steps: prev.steps, index: nextIndex };
    });
  }

  function notify(event: TutorialEventId, payload?: unknown) {
    if (!currentStep || currentStep.awaitEvent !== event) return;
    if (currentStep.matches && !currentStep.matches(payload)) return;
    advance();
  }

  function startFull() {
    setEngine({ steps: buildSteps({ hasLists, openListsDrawerForCreateList }), index: 0 });
  }

  function startPart(partId: TutorialPartId) {
    const partSteps = buildSteps({ hasLists, openListsDrawerForCreateList }).filter((step) => step.part === partId);
    if (partSteps.length === 0) return;
    setEngine({ steps: partSteps, index: 0 });
  }

  function skip() {
    setEngine({ steps: null, index: 0 });
    if (!userId) return;
    const nextProgress = tutorialRepository.dismiss(userId);
    setProgress(nextProgress);
  }

  // Efeito colateral do passo atual (ex.: abrir a gaveta de listas quando "criar lista" é
  // refeito com listas já existentes) — roda só quando o passo muda de fato, não a cada render.
  useEffect(() => {
    currentStep?.onEnter?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep?.id]);

  // Passos "clique no alvo": qualquer clique dentro do elemento certo avança o tutorial.
  useEffect(() => {
    if (!currentStep?.awaitClickTarget || !currentStep.target) return;
    const targetSelector = `[data-tutorial="${currentStep.target}"]`;
    function handleClick(event: MouseEvent) {
      const clickedInsideTarget = (event.target as Element | null)?.closest?.(targetSelector);
      if (clickedInsideTarget) advance();
    }
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep?.id, currentStep?.target]);

  function hintFor(dialogId: TutorialDialogId): ReactNode | undefined {
    return currentStep?.insideDialog === dialogId ? currentStep.message : undefined;
  }

  const overlay =
    currentStep && !currentStep.insideDialog ? (
      <TutorialOverlay
        step={{
          target: currentStep.target,
          fallbackTarget: currentStep.fallbackTarget,
          title: currentStep.title,
          message: currentStep.message,
          cta: currentStep.cta,
          onAdvance: currentStep.cta ? advance : undefined,
        } satisfies TutorialStepView}
        onSkip={skip}
        animationsEnabled={animationsEnabled}
      />
    ) : null;

  return { overlay, isActive: currentStep != null, progress, notify, startFull, startPart, skip, hintFor };
}
