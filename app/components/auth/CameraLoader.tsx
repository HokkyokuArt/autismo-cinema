/**
 * Tela de carregamento da tela de login — uma camerazinha de cinema com a lente
 * "respirando" (íris abrindo/fechando) e a lucezinha de gravação piscando,
 * enquanto o mural de pôsteres pré-carrega as imagens ao fundo.
 */
export function CameraLoader() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-ink-950">
      <div className="relative h-20 w-32 [animation:cameraBounce_1.2s_ease-in-out_infinite]">
        <svg viewBox="0 0 120 76" aria-hidden="true" className="h-full w-full">
          <rect x="4" y="20" width="80" height="50" rx="10" fill="var(--color-ink-600)" />
          <path d="M84 34 L114 20 L114 70 L84 56 Z" fill="var(--color-ink-600)" />
          <rect x="18" y="6" width="28" height="16" rx="4" fill="var(--color-ink-600)" />
          <circle cx="44" cy="45" r="20" fill="var(--color-ink-900)" />
          <circle
            cx="44"
            cy="45"
            r="14"
            fill="var(--color-brand-600)"
            style={{ transformOrigin: "44px 45px", animation: "cameraLensPulse 1.2s ease-in-out infinite" }}
          />
          <circle cx="44" cy="45" r="6" fill="var(--color-brand-400)" />
        </svg>
        <span
          aria-hidden="true"
          className="absolute top-1 right-3 h-3 w-3 rounded-full bg-red-500 [animation:cameraRecBlink_1s_ease-in-out_infinite]"
        />
      </div>
      <p className="text-sm text-mist-400">Preparando a sessão…</p>
    </div>
  );
}
