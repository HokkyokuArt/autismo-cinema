import { useId, useState, type InputHTMLAttributes, type ReactNode } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  /** Conteúdo extra dentro do mesmo wrapper relativo do input (ex.: dropdown de sugestões). */
  children?: ReactNode;
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2 12s3.75-7 10-7 10 7 10 7-3.75 7-10 7-10-7-10-7Z"
      />
      <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.24 4.24M9.4 5.3A10.4 10.4 0 0 1 12 5c6.25 0 10 7 10 7a15.3 15.3 0 0 1-3.24 4.05M6.5 6.5C4.06 8.05 2 12 2 12a15.3 15.3 0 0 0 6.11 6.36"
      />
    </svg>
  );
}

/**
 * Input com label flutuante: quando vazio e sem foco, o label ocupa o lugar do texto
 * (como um placeholder); ao focar ou preencher, ele encolhe e sobe pro topo do campo.
 * Pra type="password", mostra um botão dentro do campo pra alternar entre texto oculto
 * e visível — sem isso o usuário não tem como conferir o que digitou antes de enviar.
 */
export function FormField({
  label,
  error,
  id,
  className = "",
  type = "text",
  children,
  placeholder,
  value,
  defaultValue,
  onFocus,
  onBlur,
  ...rest
}: FormFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isPassword = type === "password";
  const hasValue =
    value !== undefined ? String(value).length > 0 : defaultValue !== undefined ? String(defaultValue).length > 0 : false;
  const isFloating = isFocused || hasValue;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative">
        <input
          id={inputId}
          type={isPassword && showPassword ? "text" : type}
          value={value}
          defaultValue={defaultValue}
          // Só mostra o placeholder de verdade (ex.: "Ex.: Interestelar") quando o campo já
          // está focado — do contrário ele ficaria embaixo do label flutuante em repouso.
          placeholder={isFocused ? placeholder : undefined}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          className={
            "w-full rounded-lg border bg-ink-800 px-3 pt-5 pb-1.5 text-sm text-mist-50 " +
            "focus:outline-none focus:ring-2 focus:ring-brand-500 " +
            (isPassword ? "pr-10 " : "") +
            (error ? "border-red-500" : "border-ink-600") +
            ` ${className}`
          }
          {...rest}
        />
        <label
          htmlFor={inputId}
          className={
            "pointer-events-none absolute left-3 origin-left transition-all duration-150 " +
            (error ? "text-red-400 " : "text-mist-400 ") +
            (isFloating ? "top-1.5 text-[11px]" : "top-1/2 -translate-y-1/2 text-sm")
          }
        >
          {label}
        </label>
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            className="absolute top-1/2 right-2.5 -translate-y-1/2 text-mist-400 hover:text-mist-100"
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
        {children}
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
