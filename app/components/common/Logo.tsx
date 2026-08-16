interface LogoProps {
  size?: "sm" | "lg" | "xl";
}

const ICON_SIZE: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "h-7 w-7",
  lg: "h-10 w-10",
  xl: "h-24 w-24",
};

const TEXT_SIZE: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "text-lg",
  lg: "text-2xl",
  xl: "text-7xl",
};

const GAP_SIZE: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "gap-2.5",
  lg: "gap-2.5",
  xl: "gap-5",
};

/** Placeholder até o logo definitivo ser fornecido. */
export function Logo({ size = "lg" }: LogoProps) {
  return (
    <div className={`flex items-center ${GAP_SIZE[size]}`}>
      <svg viewBox="0 0 48 48" aria-hidden="true" className={ICON_SIZE[size]}>
        <rect x="6" y="18" width="36" height="24" rx="3" fill="var(--color-ink-600)" />
        <path
          d="M6 18 L11 8 L18 8 L14 18 Z M18 18 L23 8 L30 8 L26 18 Z M30 18 L35 8 L42 8 L38 18 Z"
          fill="var(--color-brand-500)"
        />
        <rect x="6" y="16" width="36" height="4" fill="var(--color-brand-600)" />
      </svg>
      <span className={`font-brand tracking-wide text-mist-50 ${TEXT_SIZE[size]}`}>AUTISMO CINEMA</span>
    </div>
  );
}
