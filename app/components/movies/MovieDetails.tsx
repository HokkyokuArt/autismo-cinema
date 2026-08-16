import { useEffect, useState } from "react";
import type { MovieInfo, StreamingPlatform } from "~/models/movie";
import { PosterImage } from "~/components/movies/PosterImage";
import { StarRating } from "~/components/movies/StarRating";
import { platformVisualFor } from "~/utils/streamingPlatforms";

interface MovieDetailsProps {
  info: MovieInfo;
  /** Presentes juntos habilitam o botão de marcar assistido/não assistido. */
  watched?: boolean;
  onToggleWatched?: () => void;
  /** Classes extras no container raiz — ex.: `h-full` pra esticar o poster num layout maior. */
  className?: string;
}

/** Ícone oficial da plataforma (via TMDB); cai pro selo com sigla se não tiver ou falhar ao carregar. */
function PlatformIcon({ platform }: { platform: StreamingPlatform }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [platform.logoUrl]);

  if (platform.logoUrl && !failed) {
    return (
      <img
        src={platform.logoUrl}
        alt={platform.name}
        onError={() => setFailed(true)}
        className="h-12 w-12 rounded-xl bg-white object-contain p-1"
      />
    );
  }

  const visual = platformVisualFor(platform.name);
  return (
    <span
      className="flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white"
      style={{ backgroundColor: visual.color }}
    >
      {visual.badge}
    </span>
  );
}

/**
 * Poster grande + informações do filme. Reutilizável — usado tanto no
 * dialog de visualização quanto (futuramente) no resultado da roleta.
 */
export function MovieDetails({ info, watched = false, onToggleWatched, className = "" }: MovieDetailsProps) {
  const description = info.synopsis || info.shortDescription;
  const availablePlatforms = info.streamingPlatforms?.filter((platform) => platform.url) ?? [];

  return (
    <div className={"flex flex-col gap-6 sm:flex-row sm:items-stretch " + className}>
      <div className="mx-auto w-40 shrink-0 sm:mx-0 sm:w-auto">
        <PosterImage src={info.posterUrl} alt={info.title} fullHeight />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-2xl leading-tight text-mist-50">{info.title}</h3>
            {info.originalTitle && <p className="text-sm text-mist-400 italic">{info.originalTitle}</p>}
          </div>

          {onToggleWatched && (
            <button
              type="button"
              onClick={onToggleWatched}
              className={
                "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors " +
                (watched
                  ? "bg-brand-600 text-white hover:bg-brand-500"
                  : "bg-ink-800 text-mist-300 hover:bg-ink-700")
              }
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 shrink-0">
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {watched ? "Assistido" : "Marcar como assistido"}
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm text-mist-300">
          {info.releaseYear && <span>{info.releaseYear}</span>}
          {info.runtimeMinutes != null && <span>{info.runtimeMinutes} min</span>}
          {info.imdbRating != null && <StarRating ratingOutOfTen={info.imdbRating} />}
        </div>

        {info.genres && info.genres.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {info.genres.map((genre) => (
              <span key={genre} className="rounded-full bg-ink-800 px-2.5 py-1 text-xs text-mist-300">
                {genre}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-1 text-sm text-mist-300">
          {info.director && (
            <p>
              <span className="text-mist-400">Direção:</span> {info.director}
            </p>
          )}
          {info.cast && info.cast.length > 0 && (
            <p>
              <span className="text-mist-400">Elenco:</span> {info.cast.join(", ")}
            </p>
          )}
        </div>

        {description && <p className="text-sm leading-relaxed text-mist-200">{description}</p>}

        {info.imdbUrl && (
          <a
            href={info.imdbUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-fit items-center gap-1 text-sm font-medium text-brand-300 underline hover:text-brand-200"
          >
            Ver no IMDb
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 shrink-0">
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 17 17 7M9 7h8v8"
              />
            </svg>
          </a>
        )}

        {availablePlatforms.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-mist-200">Onde assistir</p>
            <div className="flex flex-wrap gap-4">
              {availablePlatforms.map((platform) => (
                <a
                  key={platform.name}
                  href={platform.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex flex-col items-center gap-1.5 text-center hover:opacity-80"
                >
                  <PlatformIcon platform={platform} />
                  <span className="max-w-16 truncate text-xs text-mist-300">{platform.name}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
