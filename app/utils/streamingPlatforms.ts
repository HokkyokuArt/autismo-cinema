/**
 * TMDB/JustWatch não fornecem link direto por título — mapeamos para a home
 * oficial de cada plataforma conhecida. Fora do mapa, mostramos só o nome.
 */
const OFFICIAL_URLS: Record<string, string> = {
  Netflix: "https://www.netflix.com",
  "Amazon Prime Video": "https://www.primevideo.com",
  "Disney Plus": "https://www.disneyplus.com",
  "Disney+": "https://www.disneyplus.com",
  Max: "https://www.max.com",
  "HBO Max": "https://www.max.com",
  "Apple TV": "https://tv.apple.com",
  "Apple TV Plus": "https://tv.apple.com",
  Globoplay: "https://globoplay.globo.com",
  "Paramount Plus": "https://www.paramountplus.com",
  "Paramount+": "https://www.paramountplus.com",
  "Star Plus": "https://www.starplus.com",
  "Star+": "https://www.starplus.com",
  "Claro video": "https://www.clarovideo.com",
  Looke: "https://www.looke.com.br",
  "Telecine Play": "https://www.telecineplay.com.br",
  YouTube: "https://www.youtube.com",
  "Google Play Movies": "https://play.google.com/store/movies",
};

export function officialUrlFor(providerName: string): string | undefined {
  return OFFICIAL_URLS[providerName];
}

export interface PlatformVisual {
  /** Cor de marca aproximada, usada de fundo no selo do ícone. */
  color: string;
  /** Sigla curta mostrada dentro do selo, já que não usamos logos de terceiros. */
  badge: string;
}

/** Sem licença pra usar os logos oficiais — selo colorido com sigla no lugar. */
const PLATFORM_VISUALS: Record<string, PlatformVisual> = {
  Netflix: { color: "#E50914", badge: "N" },
  "Amazon Prime Video": { color: "#00A8E1", badge: "P" },
  "Disney Plus": { color: "#113CCF", badge: "D+" },
  "Disney+": { color: "#113CCF", badge: "D+" },
  Max: { color: "#7B2CBF", badge: "M" },
  "HBO Max": { color: "#7B2CBF", badge: "M" },
  "Apple TV": { color: "#1d1d1f", badge: "TV" },
  "Apple TV Plus": { color: "#1d1d1f", badge: "TV" },
  Globoplay: { color: "#FF3366", badge: "G" },
  "Paramount Plus": { color: "#0064FF", badge: "P+" },
  "Paramount+": { color: "#0064FF", badge: "P+" },
  "Star Plus": { color: "#0F0F0F", badge: "S+" },
  "Star+": { color: "#0F0F0F", badge: "S+" },
  "Claro video": { color: "#DA291C", badge: "C" },
  Looke: { color: "#F5A623", badge: "L" },
  "Telecine Play": { color: "#000000", badge: "T" },
  YouTube: { color: "#FF0000", badge: "▶" },
  "Google Play Movies": { color: "#00B871", badge: "▶" },
};

const DEFAULT_VISUAL: PlatformVisual = { color: "#52525b", badge: "?" };

export function platformVisualFor(providerName: string): PlatformVisual {
  return (
    PLATFORM_VISUALS[providerName] ?? {
      ...DEFAULT_VISUAL,
      badge: providerName.trim().charAt(0).toUpperCase() || "?",
    }
  );
}
