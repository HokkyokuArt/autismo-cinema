interface LogoProps {
  size?: "sm" | "lg" | "xl";
  /** "row" (padrão): ícone ao lado do texto, altura igual a 1em (acompanha a fonte do título).
   *  "column": ícone bem grande empilhado acima do texto — usado na tela de login. */
  layout?: "row" | "column";
}

const TEXT_SIZE: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "text-lg",
  // lg = tela de login no mobile — precisa caber numa tela estreita, por isso bem menor que o xl.
  lg: "text-2xl",
  // xl (tela de login no desktop): +30% sobre o padrão Tailwind (text-7xl), depois +50% em cima disso.
  xl: "text-[8.775rem]",
};

const GAP_SIZE_ROW: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "gap-2.5",
  lg: "gap-2.5",
  xl: "gap-5",
};

const GAP_SIZE_COLUMN: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "gap-2",
  lg: "gap-4",
  xl: "gap-6",
};

/** Só usado em layout="column" — no "row" o ícone acompanha a altura da fonte (1em). */
const ICON_HEIGHT_COLUMN: Record<NonNullable<LogoProps["size"]>, string> = {
  sm: "h-12",
  lg: "h-14",
  xl: "h-48",
};

export function Logo({ size = "lg", layout = "row" }: LogoProps) {
  const isColumn = layout === "column";
  const gap = isColumn ? GAP_SIZE_COLUMN[size] : GAP_SIZE_ROW[size];

  return (
    <div className={`flex items-center ${isColumn ? "flex-col" : ""} ${gap} ${TEXT_SIZE[size]}`}>
      <img
        src="/icon.png"
        alt=""
        aria-hidden="true"
        className={`w-auto object-contain ${isColumn ? ICON_HEIGHT_COLUMN[size] : "h-[1em]"}`}
      />
      <span className="font-brand text-center whitespace-nowrap tracking-wide text-mist-50">AUTISMO CINEMA</span>
    </div>
  );
}
