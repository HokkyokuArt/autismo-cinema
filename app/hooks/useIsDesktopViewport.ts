import { useEffect, useState } from "react";

/** Mesmo ponto de corte do `lg:` do Tailwind — usado pra decidir se vale a pena montar o mural de pôsteres. */
const QUERY = "(min-width: 1024px)";

function readMatch(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia(QUERY).matches;
}

export function useIsDesktopViewport(): boolean {
  const [isDesktop, setIsDesktop] = useState(readMatch);

  useEffect(() => {
    const mediaQuery = window.matchMedia(QUERY);
    function handleChange(event: MediaQueryListEvent) {
      setIsDesktop(event.matches);
    }
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isDesktop;
}
