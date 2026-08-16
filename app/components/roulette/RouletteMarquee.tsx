import { useEffect, useRef } from "react";
import gsap from "gsap";

interface RouletteMarqueeProps {
  title: string;
}

/**
 * Visor estilo painel de cinema: mostra o filme atualmente sob o ponteiro da
 * roleta, trocando o texto com um efeito de "rolo" — cada título novo entra
 * de baixo pra cima, como um marcador giratório. `killTweensOf` garante que
 * trocas rápidas (giro veloz) não empilhem animações — sempre reage à
 * posição real mais recente da roda, mesmo que o título mude várias vezes
 * antes da animação anterior terminar.
 */
export function RouletteMarquee({ title }: RouletteMarqueeProps) {
  const textRef = useRef<HTMLParagraphElement>(null);
  const lastTitleRef = useRef(title);

  useEffect(() => {
    const el = textRef.current;
    if (!el || title === lastTitleRef.current) return;
    lastTitleRef.current = title;

    gsap.killTweensOf(el);
    gsap.fromTo(el, { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.22, ease: "power2.out" });
  }, [title]);

  return (
    <div className="flex w-full flex-col items-center gap-2 sm:w-52 sm:shrink-0">
      <span className="text-xs font-medium tracking-widest text-mist-400 uppercase">Selecionado</span>
      <div className="relative flex h-14 w-full items-center justify-center overflow-hidden rounded-lg border border-ink-600 bg-ink-900/80 px-3 shadow-[inset_0_2px_6px_rgba(0,0,0,0.5)]">
        <p ref={textRef} className="text-marquee font-display truncate text-center text-lg">
          {title}
        </p>
      </div>
    </div>
  );
}
