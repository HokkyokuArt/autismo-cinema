import type { Movie } from "~/models/movie";
import { Dialog } from "~/components/common/Dialog";
import { MovieDetails } from "~/components/movies/MovieDetails";

interface MovieViewDialogProps {
  open: boolean;
  onClose: () => void;
  movie: Movie | null;
  onToggleWatched: (movie: Movie) => void;
}

export function MovieViewDialog({ open, onClose, movie, onToggleWatched }: MovieViewDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={movie?.info.title ?? "Filme"} size="xl" hideTitle>
      {movie && (
        <MovieDetails
          info={movie.info}
          watched={movie.watched}
          onToggleWatched={() => onToggleWatched(movie)}
        />
      )}
    </Dialog>
  );
}
