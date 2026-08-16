import type { Movie } from "~/models/movie";
import type { AnimationLevel, GridSize } from "~/models/settings";
import type { MovieList } from "~/models/movieList";
import { MovieCard } from "~/components/movies/MovieCard";

const GRID_CLASSES: Record<GridSize, string> = {
  small: "grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10",
  medium: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
  large: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
};

interface MovieGridProps {
  movies: Movie[];
  size: GridSize;
  animationLevel: AnimationLevel;
  otherLists: MovieList[];
  selectionMode: boolean;
  selectedMovieIds: Set<string>;
  onToggleSelect: (movie: Movie) => void;
  onEnterSelectionMode: (movie: Movie) => void;
  onView?: (movie: Movie) => void;
  onEdit: (movie: Movie) => void;
  onDelete: (movie: Movie) => void;
  onCopyToList: (movie: Movie, targetListId: string) => void;
  onToggleWatched: (movie: Movie) => void;
}

export function MovieGrid({
  movies,
  size,
  animationLevel,
  otherLists,
  selectionMode,
  selectedMovieIds,
  onToggleSelect,
  onEnterSelectionMode,
  onView,
  onEdit,
  onDelete,
  onCopyToList,
  onToggleWatched,
}: MovieGridProps) {
  return (
    <div className={`grid gap-4 p-4 sm:p-6 ${GRID_CLASSES[size]}`}>
      {movies.map((movie) => (
        <MovieCard
          key={movie.id}
          movie={movie}
          otherLists={otherLists}
          selectionMode={selectionMode}
          selected={selectedMovieIds.has(movie.id)}
          animationLevel={animationLevel}
          onToggleSelect={onToggleSelect}
          onEnterSelectionMode={onEnterSelectionMode}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onCopyToList={onCopyToList}
          onToggleWatched={onToggleWatched}
        />
      ))}
    </div>
  );
}
