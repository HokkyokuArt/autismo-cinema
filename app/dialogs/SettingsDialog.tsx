import { useRef, useState } from "react";
import type { AppSettings } from "~/models/settings";
import { Dialog } from "~/components/common/Dialog";
import { Button } from "~/components/common/Button";
import { TextareaField } from "~/components/common/TextareaField";
import { AnimationLevelToggle } from "~/components/common/AnimationLevelToggle";
import { GridSizeControl } from "~/components/movies/GridSizeControl";
import { useToast } from "~/contexts/ToastContext";
import {
  applyBackup,
  copyBackupToClipboard,
  downloadBackupFile,
  validateBackup,
  type BackupEnvelope,
  type BackupSummary,
} from "~/storage/backup";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (partial: Partial<AppSettings>) => void;
}

type SettingsTab = "layout" | "backup";

const TABS: { value: SettingsTab; label: string }[] = [
  { value: "layout", label: "Layout" },
  { value: "backup", label: "Backup" },
];

export function SettingsDialog({ open, onClose, settings, onUpdateSettings }: SettingsDialogProps) {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>("layout");
  const [pasteText, setPasteText] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<{ backup: BackupEnvelope; summary: BackupSummary } | null>(null);

  function handleExportFile() {
    downloadBackupFile();
    showToast("Backup exportado para arquivo.");
  }

  async function handleExportClipboard() {
    try {
      await copyBackupToClipboard();
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
    applyBackup(pendingImport.backup);
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
                  {pendingImport.summary.people} pessoa(s) e {pendingImport.summary.ratings} avaliação(ões). Importar
                  vai <strong>substituir todos os seus dados atuais</strong> — essa ação não pode ser desfeita.
                </p>
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
                <div className="mb-4 flex flex-wrap gap-2">
                  <Button variant="ghost" onClick={handleExportFile}>
                    Exportar para arquivo
                  </Button>
                  <Button variant="ghost" onClick={handleExportClipboard}>
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
      </div>
    </Dialog>
  );
}
