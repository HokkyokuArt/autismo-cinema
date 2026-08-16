import { useEffect, useState } from "react";
import { DEFAULT_SORT, type SortCriterion, type SortFieldKey } from "~/models/movieSort";
import { Dialog } from "~/components/common/Dialog";
import { Button } from "~/components/common/Button";
import { SORT_FIELDS, directionLabel, sortFieldConfig } from "~/utils/movieSort";

interface SortMoviesDialogProps {
  open: boolean;
  onClose: () => void;
  activeCriteria: SortCriterion[];
  onApply: (criteria: SortCriterion[]) => void;
}

/**
 * Ordenação com múltiplos critérios (o segundo desempata o primeiro, etc).
 * Trabalha sobre um rascunho local — só afeta a ordenação ativa ao "Aplicar".
 */
export function SortMoviesDialog({ open, onClose, activeCriteria, onApply }: SortMoviesDialogProps) {
  const [draft, setDraft] = useState<SortCriterion[]>(activeCriteria);

  useEffect(() => {
    if (open) setDraft(activeCriteria);
  }, [open, activeCriteria]);

  function updateField(index: number, field: SortFieldKey) {
    setDraft((current) => current.map((c, i) => (i === index ? { ...c, field } : c)));
  }

  function updateDirection(index: number, direction: "asc" | "desc") {
    setDraft((current) => current.map((c, i) => (i === index ? { ...c, direction } : c)));
  }

  function removeCriterion(index: number) {
    setDraft((current) => current.filter((_, i) => i !== index));
  }

  function addCriterion() {
    const usedKeys = new Set(draft.map((c) => c.field));
    const nextField = SORT_FIELDS.find((field) => !usedKeys.has(field.key));
    if (!nextField) return;
    setDraft((current) => [...current, { field: nextField.key, direction: "asc" }]);
  }

  function handleApply() {
    onApply(draft);
    onClose();
  }

  function handleReset() {
    setDraft(DEFAULT_SORT);
  }

  return (
    <Dialog open={open} onClose={onClose} title="Ordenar filmes" size="md">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-mist-400">
          O primeiro critério manda; os seguintes só desempatam. Ex.: últimos vistos, depois ordem alfabética.
        </p>

        <div className="flex flex-col gap-3">
          {draft.map((criterion, index) => {
            const field = sortFieldConfig(criterion.field);
            const usedElsewhere = new Set(draft.filter((_, i) => i !== index).map((c) => c.field));
            return (
              <div key={index} className="flex items-center gap-2">
                <span className="w-5 shrink-0 text-center text-xs text-mist-400">{index + 1}º</span>
                <select
                  value={criterion.field}
                  onChange={(event) => updateField(index, event.target.value as SortFieldKey)}
                  className="flex-1 rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-mist-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {SORT_FIELDS.filter((f) => f.key === criterion.field || !usedElsewhere.has(f.key)).map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.label}
                    </option>
                  ))}
                </select>

                <select
                  value={criterion.direction}
                  onChange={(event) => updateDirection(index, event.target.value as "asc" | "desc")}
                  className="w-44 shrink-0 rounded-lg border border-ink-600 bg-ink-800 px-2 py-2 text-sm text-mist-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="asc">{directionLabel(field.kind, "asc")}</option>
                  <option value="desc">{directionLabel(field.kind, "desc")}</option>
                </select>

                {draft.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCriterion(index)}
                    aria-label="Remover critério"
                    className="shrink-0 rounded-full p-1.5 text-mist-400 hover:bg-ink-700 hover:text-mist-50"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
                      <path
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        d="M6 6l12 12M18 6L6 18"
                      />
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {draft.length < SORT_FIELDS.length && (
          <Button type="button" variant="ghost" className="w-full" onClick={addCriterion}>
            + Adicionar critério de ordenação
          </Button>
        )}

        <div className="flex gap-3 border-t border-ink-700 pt-4">
          <Button type="button" variant="ghost" className="flex-1" onClick={handleReset}>
            Restaurar padrão
          </Button>
          <Button type="button" className="flex-1" onClick={handleApply}>
            Aplicar
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
