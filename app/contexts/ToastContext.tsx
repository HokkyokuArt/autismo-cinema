import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

type ToastVariant = "success" | "error" | "info";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  action?: ToastAction;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant, action?: ToastAction) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 4000;

const VARIANT_CLASSES: Record<ToastVariant, string> = {
  success: "border-brand-600 bg-ink-900/95 text-mist-50",
  error: "border-red-700 bg-red-950/90 text-red-200",
  info: "border-ink-600 bg-ink-800/95 text-mist-100",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutsRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timeoutId = timeoutsRef.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = "success", action?: ToastAction) => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current, { id, message, variant, action }]);
      const timeoutId = setTimeout(() => dismissToast(id), TOAST_DURATION_MS);
      timeoutsRef.current.set(id, timeoutId);
    },
    [dismissToast],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={
              "pointer-events-auto w-full max-w-sm rounded-lg border px-4 py-3 text-sm shadow-xl " +
              VARIANT_CLASSES[toast.variant]
            }
          >
            <div className="flex items-start justify-between gap-3">
              <span>{toast.message}</span>
              <div className="flex shrink-0 items-center gap-3">
                {toast.action && (
                  <button
                    type="button"
                    onClick={() => {
                      toast.action?.onClick();
                      dismissToast(toast.id);
                    }}
                    className="font-medium text-brand-300 hover:text-brand-200"
                  >
                    {toast.action.label}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  aria-label="Fechar aviso"
                  className="text-mist-400 hover:text-mist-50"
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
              </div>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast deve ser usado dentro de um ToastProvider.");
  }
  return context;
}
