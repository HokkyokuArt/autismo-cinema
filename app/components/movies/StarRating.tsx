const STAR_COUNT = 5;

/** Path de estrela (Heroicons, viewBox 20x20). */
const STAR_PATH =
  "M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z";

interface StarRatingProps {
  /** Nota na escala 0–10 (ex.: IMDb). */
  ratingOutOfTen: number;
  className?: string;
}

/** 5 estrelas (com meias-estrelas) representando uma nota 0–10. Nota exata some no tooltip. */
export function StarRating({ ratingOutOfTen, className = "" }: StarRatingProps) {
  const starsExact = Math.max(0, Math.min(STAR_COUNT, ratingOutOfTen / 2));
  const roundedHalf = Math.round(starsExact * 2) / 2;

  return (
    <div
      className={`flex items-center gap-0.5 ${className}`}
      title={`IMDb ${ratingOutOfTen.toFixed(1)}`}
    >
      {Array.from({ length: STAR_COUNT }, (_, index) => {
        const fillPercent = Math.max(0, Math.min(1, roundedHalf - index)) * 100;
        return (
          <span key={index} className="relative inline-block h-4 w-4 shrink-0">
            <svg viewBox="0 0 20 20" className="absolute inset-0 h-full w-full text-mist-400/40">
              <path fill="currentColor" d={STAR_PATH} />
            </svg>
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fillPercent}%` }}>
              <svg viewBox="0 0 20 20" className="h-4 w-4 text-marquee">
                <path fill="currentColor" d={STAR_PATH} />
              </svg>
            </span>
          </span>
        );
      })}
    </div>
  );
}
