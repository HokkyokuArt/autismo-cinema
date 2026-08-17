import { useEffect, useRef, useState } from "react";
import type { AppSettings } from "~/models/settings";
import type { MovieList } from "~/models/movieList";
import type { TutorialPartId, TutorialProgress } from "~/models/tutorial";
import { TUTORIAL_PARTS } from "~/models/tutorial";
import { Dialog } from "~/components/common/Dialog";
import { Button } from "~/components/common/Button";
import { TextareaField } from "~/components/common/TextareaField";
import { AnimationLevelToggle } from "~/components/common/AnimationLevelToggle";
import { GridSizeControl } from "~/components/movies/GridSizeControl";
import { Logo } from "~/components/common/Logo";
import { useToast } from "~/contexts/ToastContext";
import {
  applyBackup,
  copyBackupToClipboard,
  downloadBackupFile,
  validateBackup,
  type BackupEnvelope,
  type BackupSummary,
  type ImportMode,
} from "~/storage/backup";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (partial: Partial<AppSettings>) => void;
  lists: MovieList[];
  tutorialProgress: TutorialProgress;
  onStartTutorialPart: (partId: TutorialPartId) => void;
  onStartTutorialFull: () => void;
}

type SettingsTab = "layout" | "backup" | "tutoriais" | "sobre";

const TABS: { value: SettingsTab; label: string }[] = [
  { value: "layout", label: "Layout" },
  { value: "backup", label: "Backup" },
  { value: "tutoriais", label: "Tutoriais" },
  { value: "sobre", label: "Sobre" },
];

export function SettingsDialog({
  open,
  onClose,
  settings,
  onUpdateSettings,
  lists,
  tutorialProgress,
  onStartTutorialPart,
  onStartTutorialFull,
}: SettingsDialogProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>("layout");
  const [pasteText, setPasteText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>("merge");
  const [pendingImport, setPendingImport] = useState<{ backup: BackupEnvelope; summary: BackupSummary } | null>(null);
  const [selectedListIds, setSelectedListIds] = useState<Set<string>>(() => new Set(lists.map((list) => list.id)));

  // Toda vez que o diálogo abre, recomeça com todas as listas marcadas — não deixa uma
  // seleção parcial de uma sessão anterior escondida sem o usuário perceber.
  useEffect(() => {
    if (open) setSelectedListIds(new Set(lists.map((list) => list.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const allSelected = lists.length > 0 && selectedListIds.size === lists.length;

  function toggleList(listId: string) {
    setSelectedListIds((current) => {
      const next = new Set(current);
      if (next.has(listId)) next.delete(listId);
      else next.add(listId);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedListIds(allSelected ? new Set() : new Set(lists.map((list) => list.id)));
  }

  function exportOptions() {
    // Só filtra de verdade quando faltar pelo menos uma lista marcada — com tudo
    // selecionado, exporta do jeito que já era (sem passar listIds pra função).
    return allSelected ? undefined : { listIds: Array.from(selectedListIds) };
  }

  function handleExportFile() {
    downloadBackupFile(exportOptions());
    showToast("Backup exportado para arquivo.");
  }

  async function handleExportClipboard() {
    try {
      await copyBackupToClipboard(exportOptions());
      showToast("Backup copiado pra área de transferência (Ctrl+V pra colar em qualquer lugar).");
    } catch {
      showToast(
        "Não foi possível copiar. Seu navegador pode estar bloqueando o acesso à área de transferência aqui.",
        "error",
      );
    }
  }

  function runValidation(text: string) {
    const result = validateBackup(text);
    if (!result.ok) {
      setImportError(result.error);
      showToast(result.error, "error");
      return;
    }
    setImportError(null);
    setPendingImport(result);
  }

  function handleFileChosen(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    file
      .text()
      .then(runValidation)
      .catch(() => {
        setImportError("Não foi possível ler o arquivo selecionado.");
        showToast("Não foi possível ler o arquivo selecionado.", "error");
      });
  }

  function handleConfirmImport() {
    if (!pendingImport) return;
    applyBackup(pendingImport.backup, importMode);
    setPendingImport(null);
    setPasteText("");
    showToast("Backup importado! Recarregando…");
    setTimeout(() => window.location.reload(), 700);
  }

  return (
    <Dialog open={open} onClose={onClose} title="Configurações">
      <div className="flex flex-col gap-5">
        <div role="tablist" aria-label="Seções de configurações" className="flex gap-4 border-b border-ink-700">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={
                "-mb-px border-b-2 px-1 pb-2 text-sm font-medium transition-colors " +
                (activeTab === tab.value
                  ? "border-brand-500 text-mist-50"
                  : "border-transparent text-mist-400 hover:text-mist-100")
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "layout" && (
          <div className="flex flex-col gap-6">
            <div>
              <p className="mb-2 text-sm font-medium text-mist-100">Tamanho da grade</p>
              <GridSizeControl value={settings.gridSize} onChange={(gridSize) => onUpdateSettings({ gridSize })} />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-mist-100">Animações</p>
              <p className="mb-2 text-xs text-mist-400">
                Básicas: transições e efeitos que a interface já tem hoje (cards, dialogs, menus). Completas:
                adiciona spotlight, inclinação 3D e verniz nos pôsteres ao passar o mouse.
              </p>
              <AnimationLevelToggle
                value={settings.animationLevel}
                onChange={(animationLevel) => onUpdateSettings({ animationLevel })}
              />
            </div>
          </div>
        )}

        {activeTab === "backup" && (
          <div>
            <p className="mb-3 text-xs text-mist-400">
              Filmes, listas, pessoas, avaliações e essas preferências — não inclui seu login/senha.
            </p>

            {pendingImport ? (
              <div className="rounded-lg border border-amber-600/50 bg-ink-800 p-3">
                <p className="mb-3 text-sm text-mist-100">
                  Esse backup tem {pendingImport.summary.movies} filme(s), {pendingImport.summary.lists} lista(s),{" "}
                  {pendingImport.summary.people} pessoa(s) e {pendingImport.summary.ratings} avaliação(ões).
                </p>

                <p className="mb-1.5 text-xs font-medium text-mist-300">Ao importar</p>
                <div role="radiogroup" aria-label="Modo de importação" className="mb-3 flex flex-col gap-2">
                  <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-ink-700 p-2.5 has-[:checked]:border-brand-500 has-[:checked]:bg-ink-900">
                    <input
                      type="radio"
                      name="import-mode"
                      className="mt-0.5"
                      checked={importMode === "merge"}
                      onChange={() => setImportMode("merge")}
                    />
                    <span className="text-sm text-mist-100">
                      <strong>Mesclar</strong> — adiciona o que só existe no backup e atualiza o que já existe aqui;
                      não apaga o resto do que você já tem.
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-ink-700 p-2.5 has-[:checked]:border-brand-500 has-[:checked]:bg-ink-900">
                    <input
                      type="radio"
                      name="import-mode"
                      className="mt-0.5"
                      checked={importMode === "overwrite"}
                      onChange={() => setImportMode("overwrite")}
                    />
                    <span className="text-sm text-mist-100">
                      <strong>Sobrescrever tudo</strong> — substitui todos os seus dados atuais pelos do backup. Essa
                      ação não pode ser desfeita.
                    </span>
                  </label>
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" className="flex-1" onClick={() => setPendingImport(null)}>
                    Cancelar
                  </Button>
                  <Button className="flex-1" onClick={handleConfirmImport}>
                    Confirmar e importar
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="mb-1.5 text-xs font-medium text-mist-300">Exportar</p>

                {lists.length > 0 && (
                  <div className="mb-3 rounded-lg border border-ink-700">
                    <label className="flex cursor-pointer items-center gap-2.5 border-b border-ink-700 px-3 py-2">
                      <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} />
                      <span className="text-xs font-medium text-mist-200">
                        {allSelected ? "Desmarcar todas" : "Selecionar todas"}
                      </span>
                    </label>
                    <div className="max-h-40 overflow-y-auto">
                      {lists.map((list) => (
                        <label
                          key={list.id}
                          className="flex cursor-pointer items-center gap-2.5 px-3 py-2 text-sm text-mist-100 hover:bg-ink-800"
                        >
                          <input
                            type="checkbox"
                            checked={selectedListIds.has(list.id)}
                            onChange={() => toggleList(list.id)}
                          />
                          <span className="truncate">{list.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-4 flex flex-wrap gap-2">
                  <Button variant="ghost" disabled={selectedListIds.size === 0} onClick={handleExportFile}>
                    Exportar para arquivo
                  </Button>
                  <Button variant="ghost" disabled={selectedListIds.size === 0} onClick={handleExportClipboard}>
                    Copiar (Ctrl+C)
                  </Button>
                </div>

                <p className="mb-1.5 text-xs font-medium text-mist-300">Importar</p>
                <div className="mb-3 flex flex-wrap gap-2">
                  <Button variant="ghost" onClick={() => fileInputRef.current?.click()}>
                    Importar de arquivo
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json"
                    className="hidden"
                    onChange={handleFileChosen}
                  />
                </div>

                <TextareaField
                  label="Ou cole o backup aqui (Ctrl+V)"
                  rows={4}
                  value={pasteText}
                  onChange={(event) => {
                    setPasteText(event.target.value);
                    setImportError(null);
                  }}
                />
                <div className="mt-2 flex justify-end">
                  <Button variant="ghost" disabled={!pasteText.trim()} onClick={() => runValidation(pasteText)}>
                    Importar colado
                  </Button>
                </div>

                {importError && (
                  <p role="alert" className="mt-2 text-xs text-red-400">
                    {importError}
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "tutoriais" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-mist-400">
                Refaça o tour completo do início ou só a parte que quiser relembrar.
              </p>
              <Button
                variant="ghost"
                className="shrink-0 px-3 py-1.5 text-xs"
                onClick={() => {
                  onClose();
                  onStartTutorialFull();
                }}
              >
                Refazer tudo
              </Button>
            </div>

            <ul className="flex flex-col gap-2">
              {TUTORIAL_PARTS.map((part) => {
                const isDone = tutorialProgress.completedParts.includes(part.id);
                return (
                  <li
                    key={part.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-ink-700 p-3"
                  >
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 text-sm font-medium text-mist-50">
                        {part.label}
                        {isDone && (
                          <span className="text-xs font-normal text-emerald-400" aria-label="Concluído">
                            ✓
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-mist-400">{part.description}</p>
                    </div>
                    <Button
                      variant="ghost"
                      className="shrink-0 px-3 py-1.5 text-xs"
                      onClick={() => {
                        onClose();
                        onStartTutorialPart(part.id);
                      }}
                    >
                      Refazer
                    </Button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {activeTab === "sobre" && (
          <div className="flex flex-col gap-4">
            <Logo size="sm" />
            <div>
              <p className="mb-1 text-sm font-medium text-mist-100">O que é isso aqui</p>
              <p className="text-sm text-mist-300">
                Autismo Cinema é o catálogo de filmes do grupo: cada lista guarda os filmes de um contexto diferente
                (com os amigos, com a família etc.), com quem já assistiu o quê, e uma roleta pra ajudar a decidir o
                que ver quando ninguém consegue escolher.
              </p>
            </div>
            <div>
              <p className="mb-1 text-sm font-medium text-mist-100">Sobre</p>
              <p className="text-sm text-mist-300">
                Feito e mantido por Artico, pra organizar e tornar mais divertida a sessão de cinema do grupo.
              </p>
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
}
