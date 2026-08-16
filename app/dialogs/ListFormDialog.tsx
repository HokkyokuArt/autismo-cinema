import { useEffect, useRef, useState, type FormEvent } from "react";
import type { MovieList } from "~/models/movieList";
import { Dialog } from "~/components/common/Dialog";
import { Button } from "~/components/common/Button";
import { FormField } from "~/components/common/FormField";
import { TextareaField } from "~/components/common/TextareaField";

interface ListFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (list: MovieList) => void;
  /** Presente = editando esta lista; ausente = criando uma nova. */
  list?: MovieList;
}

export function ListFormDialog({ open, onClose, onSave, list }: ListFormDialogProps) {
  const isEditing = list != null;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const initialNameRef = useRef("");
  const initialDescriptionRef = useRef("");

  useEffect(() => {
    if (!open) return;
    const initialName = list?.name ?? "";
    const initialDescription = list?.description ?? "";
    setName(initialName);
    setDescription(initialDescription);
    setNameError(null);
    initialNameRef.current = initialName;
    initialDescriptionRef.current = initialDescription;
  }, [open, list]);

  const isDirty = name !== initialNameRef.current || description !== initialDescriptionRef.current;

  function handleSave(event: FormEvent) {
    event.preventDefault();

    if (name.trim().length === 0) {
      setNameError("Informe o nome da lista.");
      return;
    }

    const now = new Date().toISOString();
    onSave(
      list
        ? { ...list, name: name.trim(), description: description.trim() || undefined, updatedAt: now }
        : {
            id: crypto.randomUUID(),
            name: name.trim(),
            description: description.trim() || undefined,
            createdAt: now,
            updatedAt: now,
          },
    );
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} title={isEditing ? "Editar lista" : "Nova lista"} isDirty={isDirty}>
      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <FormField
          label="Nome*"
          placeholder="Ex.: Filmes com os amigos"
          value={name}
          onChange={(event) => setName(event.target.value)}
          error={nameError ?? undefined}
          autoFocus
        />
        <TextareaField
          label="Descrição (opcional)"
          rows={2}
          placeholder="Uma frase curta sobre essa lista"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <Button type="submit" className="w-full">
          {isEditing ? "Salvar alterações" : "Criar lista"}
        </Button>
      </form>
    </Dialog>
  );
}
