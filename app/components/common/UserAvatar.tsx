import { useEffect, useState } from "react";

/** Paleta vibrante pro avatar-com-inicial — escolhida deterministicamente pelo `seed`. */
const VIBRANT_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#a855f7",
  "#d946ef",
  "#ec4899",
];

function colorForSeed(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return VIBRANT_COLORS[Math.abs(hash) % VIBRANT_COLORS.length];
}

interface UserAvatarProps {
  name: string;
  avatarUrl?: string;
  /** Identificador estável (ex.: id do usuário) usado só pra escolher a cor do fallback. */
  seed: string;
  size?: number;
}

/** Avatar redondo, recortado sem distorcer (object-cover, 1:1) — ou inicial do nome com cor vibrante fixa. */
export function UserAvatar({ name, avatarUrl, seed, size = 32 }: UserAvatarProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [avatarUrl]);

  const showFallback = !avatarUrl || failed;

  if (showFallback) {
    const initial = name.trim().charAt(0).toUpperCase() || "?";
    return (
      <span
        aria-hidden="true"
        className="flex aspect-square shrink-0 items-center justify-center rounded-full font-display text-white"
        style={{ width: size, height: size, backgroundColor: colorForSeed(seed), fontSize: size * 0.45 }}
      >
        {initial}
      </span>
    );
  }

  return (
    <img
      src={avatarUrl}
      alt=""
      onError={() => setFailed(true)}
      className="aspect-square shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  );
}
