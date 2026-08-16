import { useEffect, useState } from "react";

interface PosterImageProps {
  src?: string;
  alt: string;
  watched?: boolean;
  /** Ao invés do quadro 2:3 fixo, estica pra ocupar toda a altura do pai (uso no dialog de visualização). */
  fullHeight?: boolean;
}

export function PosterImage({ src, alt, watched = false, fullHeight = false }: PosterImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  const showFallback = !src || failed;

  return (
    <div
      className={
        "relative overflow-hidden rounded-lg bg-ink-800 " +
        (fullHeight ? "aspect-[2/3] w-full sm:aspect-auto sm:h-full sm:w-fit " : "aspect-[2/3] w-full ") +
        (watched ? "grayscale" : "")
      }
    >
      {showFallback ? (
        <div className="flex h-full w-full items-center justify-center p-4 text-center">
          <span className="font-display text-base leading-snug text-mist-200">{alt}</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className={"h-full w-full object-cover " + (fullHeight ? "sm:w-auto" : "")}
        />
      )}
    </div>
  );
}
