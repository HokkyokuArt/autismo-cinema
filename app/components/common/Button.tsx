import { forwardRef, type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", isLoading = false, disabled, children, className = "", ...rest },
  ref,
) {
  const base =
    "inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium " +
    "transition-colors duration-150 focus-visible:outline focus-visible:outline-2 " +
    "focus-visible:outline-offset-2 focus-visible:outline-brand-400 disabled:cursor-not-allowed disabled:opacity-60";

  const variants = {
    primary: "bg-brand-600 text-white hover:bg-brand-500 active:bg-brand-700",
    ghost: "bg-transparent text-mist-200 hover:bg-ink-700",
  };

  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={`${base} ${variants[variant]} ${className}`}
      {...rest}
    >
      {isLoading ? "Aguarde…" : children}
    </button>
  );
});
