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

  return (
    <>
      {showLoader && <CameraLoader />}
      <main className="relative flex min-h-dvh overflow-hidden bg-ink-950">
      {/* Esquerda: mural de pôsteres 3D + logo grande — só em telas largas (desktop). */}
      <div className="relative hidden w-1/2 items-center justify-center overflow-hidden lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, var(--color-ink-600) 0%, transparent 70%), var(--color-ink-950)",
          }}
        />
        {isDesktop && <PosterWall onReady={() => setIsWallReady(true)} />}
        <div className="relative z-10 flex flex-col items-center px-8 text-center">
          <Logo size="xl" />
        </div>
      </div>

      {/* Direita: formulário — largura cheia no mobile, metade da tela no desktop. */}
      <div className="relative flex w-full items-center justify-center overflow-hidden px-4 py-10 lg:w-1/2">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, var(--color-ink-600) 0%, transparent 70%), var(--color-ink-950)",
          }}
        />

        <div className="relative w-full max-w-sm animate-[fadeInUp_0.4s_ease-out] rounded-2xl border border-ink-700 bg-ink-900/90 p-8 shadow-2xl backdrop-blur lg:border-none lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo />
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
      </div>
      </main>
    </>
  );
}
