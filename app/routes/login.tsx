import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router";
import { useAuth } from "~/contexts/AuthContext";
import { AuthError } from "~/services/authService";
import { isValidEmail } from "~/utils/validation";
import { Logo } from "~/components/common/Logo";
import { Button } from "~/components/common/Button";
import { FormField } from "~/components/common/FormField";
import { PosterWall } from "~/components/auth/PosterWall";
import { CameraLoader } from "~/components/auth/CameraLoader";
import { useIsDesktopViewport } from "~/hooks/useIsDesktopViewport";
import { useSettings } from "~/hooks/useSettings";
import type { Route } from "./+types/login";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Entrar — Autismo Cinema" }];
}

type Mode = "login" | "register";

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export default function LoginPage() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isDesktop = useIsDesktopViewport();
  const [isWallReady, setIsWallReady] = useState(false);
  // Só espera o mural de pôsteres no desktop — no mobile ele nem é montado, então não há o que esperar.
  const showLoader = isDesktop && !isWallReady;
  // Tela de entrada (desktop): começa em tela cheia com o logo + botão "Entrar"; ao clicar, o
  // formulário desliza da direita "empurrando" até sobrar 66% pro mural. No mobile isso nem existe.
  const [hasEntered, setHasEntered] = useState(false);
  const { settings, updateSettings } = useSettings();
  // Switch "Animação" no mobile: liga/desliga o mural de pôsteres atrás do form — e já usa (e
  // grava) a mesma preferência de animação do resto do sistema, não é só um estado local da tela
  // de login. "full" não existe em touch (precisa de hover), então aqui é só ligado/desligado.
  const isAnimationOn = settings.animationLevel !== "off";
  function handleToggleAnimation(nextOn: boolean) {
    updateSettings({ animationLevel: nextOn ? "basic" : "off" });
    // Desligou: reseta, pra que religar mostre o loading de novo (o PosterWall desmonta e,
    // ao remontar, busca/pré-carrega os pôsteres do zero).
    if (!nextOn) setIsWallReady(false);
  }
  // Mobile: enquanto o mural ainda não carregou os pôsteres, mantém o fundo simples (sem
  // trocar pro mural no meio do carregamento) e mostra um loading em cima do switch.
  const isMobileWallLoading = isAnimationOn && !isDesktop && !isWallReady;

  if (user) {
    return <Navigate to="/filmes" replace />;
  }

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setFieldErrors({});
    setFormError(null);
  }

  function validate(): FieldErrors {
    const errors: FieldErrors = {};

    if (mode === "register" && name.trim().length === 0) {
      errors.name = "Informe seu nome.";
    }
    if (!isValidEmail(email)) {
      errors.email = "Informe um e-mail válido.";
    }
    if (password.length < 6) {
      errors.password = "A senha deve ter pelo menos 6 caracteres.";
    }
    if (mode === "register" && confirmPassword !== password) {
      errors.confirmPassword = "As senhas não coincidem.";
    }

    return errors;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      navigate("/filmes", { replace: true });
    } catch (error) {
      setFormError(error instanceof AuthError ? error.message : "Algo deu errado. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const formCard = (
    <div className="relative w-full max-w-sm animate-[fadeInUp_0.4s_ease-out]">
      <div className="mb-8 flex justify-center lg:hidden">
        <Logo layout="column" />
      </div>

      <h1 className="mb-6 text-center font-display text-2xl tracking-wide text-mist-50">
        {mode === "login" ? "Login" : "Registrar-se"}
      </h1>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {formError && (
          <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {formError}
          </p>
        )}

        {mode === "register" && (
          <FormField
            label="Nome"
            name="name"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            error={fieldErrors.name}
          />
        )}

        <FormField
          label="E-mail"
          type="email"
          name="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={fieldErrors.email}
        />

        <FormField
          label="Senha"
          type="password"
          name="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldErrors.password}
        />

        {mode === "register" && (
          <FormField
            label="Confirmar senha"
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            error={fieldErrors.confirmPassword}
          />
        )}

        <Button type="submit" isLoading={isSubmitting} className="mt-2 w-full">
          {mode === "login" ? "Entrar" : "Criar conta"}
        </Button>

        <p className="text-center text-sm text-mist-400">
          {mode === "login" ? (
            <>
              Não possui conta?{" "}
              <button
                type="button"
                onClick={() => switchMode("register")}
                className="font-medium text-brand-400 hover:text-brand-300 hover:underline"
              >
                Registrar-se.
              </button>
            </>
          ) : (
            <>
              Já possui uma conta?{" "}
              <button
                type="button"
                onClick={() => switchMode("login")}
                className="font-medium text-brand-400 hover:text-brand-300 hover:underline"
              >
                Entrar.
              </button>
            </>
          )}
        </p>
      </form>
    </div>
  );

  const decorGradient = (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          "radial-gradient(60% 50% at 50% 0%, var(--color-ink-600) 0%, transparent 70%), var(--color-ink-950)",
      }}
    />
  );

  return (
    <>
      {showLoader && <CameraLoader />}
      <main className="relative min-h-dvh overflow-hidden bg-ink-950">
        {/* Fundo full-bleed (mural de pôsteres), desktop only — layer fixo que nunca redimensiona
            nem remonta por causa da animação de entrada; só os painéis por cima se movem, como se
            a tela fosse uma janela que deixa ver o mural continuando atrás sem interrupção. */}
        <div className="pointer-events-none absolute inset-0 hidden lg:block">
          {decorGradient}
          {isDesktop && <PosterWall onReady={() => setIsWallReady(true)} />}
          {/* Véu escuro por cima do mural — sem ele o texto do form (sem moldura própria)
              fica difícil de ler sobre os pôsteres passando atrás. */}
          <div aria-hidden="true" className="absolute inset-0 bg-ink-950/75 backdrop-blur-[5px]" />
        </div>

        {/* Véu escuro só durante a "briga" dos painéis — reforça a sensação de impacto. */}
        {hasEntered && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 hidden bg-black lg:block"
            style={{ animation: "loginImpactFlash 2s ease-out forwards" }}
          />
        )}

        {/* Desktop: "janela" da esquerda — 100% da tela antes de entrar (logo + botão
            centralizados). Ao clicar em Entrar, ao invés de encolher direto pros 66% finais, ela
            recua em ondas (bate, dá espaço, volta a encostar) até o empurrão final assentar. */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 hidden w-full flex-col items-center justify-center overflow-hidden lg:flex"
          style={hasEntered ? { animation: "loginPanelLeft 2s ease-out forwards" } : undefined}
        >
          <div className="relative z-10 flex flex-col items-center px-8 text-center">
            <Logo size="xl" layout="column" />
          </div>

          <div
            className={
              "pointer-events-auto absolute inset-x-0 bottom-20 flex justify-center transition-all duration-[250ms] ease-in " +
              (hasEntered ? "-translate-x-32 opacity-0" : "translate-x-0 opacity-100")
            }
          >
            <Button className="px-10 py-3 text-base" onClick={() => setHasEntered(true)}>
              Entrar
            </Button>
          </div>
        </div>

        {/* Desktop: painel do formulário — a caixa "bate" vindo da direita em ondas (sobe, recua
            um pouco, tenta de novo) até um empurrão final que passa um pouco dos 34% definitivos e
            volta, encaixando exatamente na proporção final. O conteúdo do form fica num wrapper
            interno de largura fixa (34vw) ancorado na borda direita, pra nunca espremer/reformatar
            durante a animação — só é progressivamente revelado conforme a caixa de fora cresce. */}
        <div
          className="absolute inset-y-0 right-0 hidden w-0 overflow-hidden lg:block"
          style={hasEntered ? { animation: "loginPanelRight 2s ease-out forwards" } : undefined}
        >
          {decorGradient}
          <div className="absolute inset-y-0 right-0 flex w-[34vw] items-center justify-center px-4">
            {formCard}
          </div>
        </div>

        {/* Mobile: vai direto pro formulário — sem tela de entrada, sem a animação de "briga" dos
            painéis do desktop. O mural de pôsteres é opcional aqui (switch "Animação" no rodapé,
            ligado à mesma preferência global) — com ele desligado, cai de volta pro fundo escuro
            com o brilho roxo no topo. */}
        <div className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden px-4 py-10 lg:hidden">
          {decorGradient}

          {isAnimationOn && !isDesktop && (
            <PosterWall onReady={() => setIsWallReady(true)} laneCount={5} />
          )}

          {/* Só troca pro véu do mural depois que os pôsteres realmente carregaram — antes
              disso continua só no fundo simples (decorGradient), sem o mural aparecer pela
              metade nem o véu escurecendo algo que ainda nem tem imagem. */}
          {isAnimationOn && !isDesktop && isWallReady && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-ink-950/75 backdrop-blur-[3px]"
            />
          )}

          {formCard}

          <div className="absolute inset-x-0 bottom-6 flex justify-center px-4">
            <label className="flex items-center gap-2.5 text-sm text-mist-200">
              Animação
              <button
                type="button"
                role="switch"
                aria-checked={isAnimationOn}
                onClick={() => handleToggleAnimation(!isAnimationOn)}
                className={
                  "relative h-6 w-11 shrink-0 rounded-full transition-colors " +
                  (isAnimationOn ? "bg-brand-600" : "bg-ink-700")
                }
              >
                <span
                  aria-hidden="true"
                  className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform"
                  style={{ transform: isAnimationOn ? "translateX(20px)" : "translateX(0)" }}
                />
                {isMobileWallLoading && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 flex items-center justify-center rounded-full bg-ink-950/45"
                  >
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  </span>
                )}
              </button>
            </label>
          </div>
        </div>
      </main>
    </>
  );
}
