import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";

interface AutocompleteChipsFieldProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  getSuggestions: (query: string, selected: string[]) => string[];
}

interface MenuRect {
  top: number;
  left: number;
  width: number;
}

/**
 * Campo de filtro com múltiplos valores (chips), só por autocomplete — não dá
 * pra filtrar por texto livre, só selecionando um valor já existente nos
 * filmes cadastrados. Sair do campo sem selecionar descarta o texto digitado.
 * O menu de sugestões é renderizado via portal (posição fixa) pra não ser
 * cortado pelo scroll do dialog — dentro do próprio `<dialog>` quando houver
 * um ancestral, já que a "top layer" nativa do `<dialog>` sempre fica acima
 * de qualquer coisa portada direto pro `document.body`.
 */
export function AutocompleteChipsField({ label, values, onChange, getSuggestions }: AutocompleteChipsFieldProps) {
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [menuRect, setMenuRect] = useState<MenuRect | null>(null);
  const [portalTarget, setPortalTarget] = useState<Element | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(
    () => getSuggestions(inputValue, values),
    [getSuggestions, inputValue, values],
  );

  useEffect(() => {
    if (isFocused && suggestions.length > 0 && boxRef.current) {
      const rect = boxRef.current.getBoundingClientRect();
      setMenuRect({ top: rect.bottom + 4, left: rect.left, width: rect.width });
      setPortalTarget(boxRef.current.closest("dialog") ?? document.body);
    } else {
      setMenuRect(null);
    }
  }, [isFocused, suggestions]);

  function addValue(value: string) {
    if (values.some((existing) => existing.toLowerCase() === value.toLowerCase())) {
      setInputValue("");
      return;
    }
    onChange([...values, value]);
    setInputValue("");
  }

  function removeValue(value: string) {
    onChange(values.filter((existing) => existing !== value));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      if (suggestions.length > 0) addValue(suggestions[0]);
    } else if (event.key === "Backspace" && inputValue.length === 0 && values.length > 0) {
      removeValue(values[values.length - 1]);
    }
  }

  function handleBlur() {
    setTimeout(() => {
      setIsFocused(false);
      setInputValue("");
    }, 120);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-mist-200">{label}</label>

      <div
        ref={boxRef}
        className="flex flex-wrap items-center gap-1.5 rounded-lg border border-ink-600 bg-ink-800 px-2 py-1.5 focus-within:ring-2 focus-within:ring-brand-500"
      >
        {values.map((value) => (
          <span
            key={value}
            className="flex items-center gap-1 rounded-full bg-brand-600/20 px-2.5 py-1 text-xs text-brand-200"
          >
            {value}
            <button
              type="button"
              onClick={() => removeValue(value)}
              aria-label={`Remover ${value}`}
              className="text-brand-300 hover:text-white"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3 w-3">
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  d="M6 6l12 12M18 6L6 18"
                />
              </svg>
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          placeholder={values.length === 0 ? "Digite para buscar…" : ""}
          className="min-w-24 flex-1 bg-transparent py-0.5 text-sm text-mist-50 placeholder:text-mist-400 focus:outline-none"
        />
        {values.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            aria-label={`Limpar ${label}`}
            className="ml-auto shrink-0 text-mist-400 hover:text-mist-100"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                d="M6 6l12 12M18 6L6 18"
              />
            </svg>
          </button>
        )}
      </div>

      {menuRect &&
        portalTarget &&
        suggestions.length > 0 &&
        createPortal(
          <div
            style={{ position: "fixed", top: menuRect.top, left: menuRect.left, width: menuRect.width }}
            className="z-50 max-h-48 overflow-y-auto rounded-lg border border-ink-700 bg-ink-900 p-1 shadow-xl"
          >
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => addValue(suggestion)}
                className="block w-full truncate rounded-md px-2.5 py-1.5 text-left text-sm text-mist-100 hover:bg-ink-800"
              >
                {suggestion}
              </button>
            ))}
          </div>,
          portalTarget,
        )}
    </div>
  );
}
