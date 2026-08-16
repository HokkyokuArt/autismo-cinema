import { useEffect, useState } from "react";

const QUERY = "(pointer: coarse)";

function readMatch(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(QUERY).matches;
}

/** Detecta dispositivos sem mouse (touch) — animação "full" depende de hover, então não faz sentido lá. */
export function useIsCoarsePointer(): boolean {
  const [isCoarse, setIsCoarse] = useState(readMatch);

  useEffect(() => {
    const mediaQuery = window.matchMedia(QUERY);
    function handleChange(event: MediaQueryListEvent) {
      setIsCoarse(event.matches);
    }
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isCoarse;
}
