import type { ReactNode } from "react";

interface TutorialHintBannerProps {
  children: ReactNode;
}

/**
 * Aviso do tutorial encaixado dentro do próprio conteúdo de um dialog nativo
 * (`<dialog>`). Esses dialogs vivem na "top layer" do navegador — nada fora
 * deles (nem o overlay escurecido do tutorial) consegue aparecer por cima —
 * então a orientação entra como um bloco normal no fluxo do formulário.
 */
export function TutorialHintBanner({ children }: TutorialHintBannerProps) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-brand-500/40 bg-brand-500/10 px-3 py-2.5 text-sm text-brand-100">
      <span aria-hidden="true" className="mt-0.5 shrink-0">
        🎬
      </span>
      <p className="leading-relaxed">{children}</p>
    </div>
  );
}
