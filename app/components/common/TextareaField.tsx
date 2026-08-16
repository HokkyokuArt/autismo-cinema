import { useId, useState, type TextareaHTMLAttributes } from "react";

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
}

/** Mesmo comportamento de label flutuante do FormField, adaptado pra caixa multi-linha. */
export function TextareaField({
  label,
  hint,
  id,
  className = "",
  placeholder,
  value,
  defaultValue,
  onFocus,
  onBlur,
  ...rest
}: TextareaFieldProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const hintId = `${textareaId}-hint`;
  const [isFocused, setIsFocused] = useState(false);

  const hasValue =
    value !== undefined ? String(value).length > 0 : defaultValue !== undefined ? String(defaultValue).length > 0 : false;
  const isFloating = isFocused || hasValue;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative">
        <textarea
          id={textareaId}
          value={value}
          defaultValue={defaultValue}
          placeholder={isFocused ? placeholder : undefined}
          aria-describedby={hint ? hintId : undefined}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          className={
            "w-full rounded-lg border border-ink-600 bg-ink-800 px-3 pt-5 pb-1.5 text-sm text-mist-50 " +
            `focus:outline-none focus:ring-2 focus:ring-brand-500 ${className}`
          }
          {...rest}
        />
        <label
          htmlFor={textareaId}
          className={
            "pointer-events-none absolute left-3 origin-left transition-all duration-150 text-mist-400 " +
            (isFloating ? "top-1.5 text-[11px]" : "top-2.5 text-sm")
          }
        >
          {label}
        </label>
      </div>
      {hint && (
        <p id={hintId} className="text-xs text-mist-400">
          {hint}
        </p>
      )}
    </div>
  );
}
