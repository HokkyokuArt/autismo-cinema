import type { OmdbResponse } from "~/api/types";

const OMDB_BASE_URL = "https://www.omdbapi.com/";

/** Só a nota IMDb — TMDB não fornece isso. Falha aqui nunca deve travar o cadastro. */
async function getRatingByImdbId(imdbId: string): Promise<number | undefined> {
  const apiKey = import.meta.env.VITE_OMDB_API_KEY;
  if (!apiKey) return undefined;

  try {
    const url = new URL(OMDB_BASE_URL);
    url.searchParams.set("i", imdbId);
    url.searchParams.set("apikey", apiKey);

    const response = await fetch(url);
    if (!response.ok) return undefined;

    const data = (await response.json()) as OmdbResponse;
    if (data.Response === "False" || !data.imdbRating || data.imdbRating === "N/A") {
      return undefined;
    }

    const rating = Number(data.imdbRating);
    return Number.isFinite(rating) ? rating : undefined;
  } catch {
    return undefined;
  }
}

export const omdbClient = { getRatingByImdbId };
