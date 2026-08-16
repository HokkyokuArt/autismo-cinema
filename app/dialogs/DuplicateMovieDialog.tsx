import type { Movie } from "~/models/movie";
import { Dialog } from "~/components/common/Dialog";
import { Button } from "~/components/common/Button";
import { PosterImage } from "~/components/movies/PosterImage";

interface DuplicateMovieDialogProps {
  open: boolean;
  existingMovie: Movie | null;
  onOverwrite: () => void;
  onAddAnyway: () => void;
  onEditExisting: () => void;
  onCancel: () => void;
}

export function DuplicateMovieDialog({
  open,
  existingMovie,
  onOverwrite,
  onAddAnyway,
  onEditExisting,
  onCancel,
}: DuplicateMovieDialogProps) {
  return (
    <Dialog open={open} onClose={onCancel} title="Esse filme já existe nesta lista">
      {existingMovie && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-lg border border-ink-700 p-3">
            <div className="w-14 shrink-0">
              <PosterImage src={existingMovie.info.posterUrl} alt={existingMovie.info.title} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-mist-50">{existingMovie.info.title}</p>
              {existingMovie.info.releaseYear && (
                <p className="text-xs text-mist-400">{existingMovie.info.releaseYear}</p>
              )}
            </div>
          </div>

          <p className="text-sm text-mist-300">O que você quer fazer?</p>

          <div className="flex flex-col gap-2">
            <Button className="w-full" onClick={onOverwrite}>
              Sobrescrever o filme existente
            </Button>
            <Button variant="ghost" className="w-full" onClick={onAddAnyway}>
              Adicionar mesmo assim (cria outro registro)
            </Button>
            <Button variant="ghost" className="w-full" onClick={onEditExisting}>
              Editar o filme existente
            </Button>
            <Button variant="ghost" className="w-full" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
