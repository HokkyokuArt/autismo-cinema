import { useCallback, useEffect, useRef } from "react";
import { authService } from "~/services/authService";

const ACTIVITY_EVENTS = ["click", "keydown", "pointerdown", "scroll"] as const;
/** Não recalcula a sessão a cada interação — só no máximo uma vez por janela. */
const EXTEND_THROTTLE_MS = 30_000;

interface UseSessionTimeoutOptions {
  enabled: boolean;
  onExpire: () => void;
}

export function useSessionTimeout({ enabled, onExpire }: UseSessionTimeoutOptions): void {
  const lastExtendAtRef = useRef(0);
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const scheduleExpiryCheck = useCallback(() => {
    clearTimeout(timeoutIdRef.current);
    const session = authService.getActiveSession();
    if (!session) {
      onExpireRef.current();
      return;
    }
    const msUntilExpiry = session.expiresAt - Date.now();
    timeoutIdRef.current = setTimeout(() => {
      authService.logout();
      onExpireRef.current();
    }, Math.max(msUntilExpiry, 0));
  }, []);

  useEffect(() => {
    if (!enabled) return;

    scheduleExpiryCheck();

    function handleActivity() {
      const now = Date.now();
      if (now - lastExtendAtRef.current < EXTEND_THROTTLE_MS) return;
      lastExtendAtRef.current = now;
      authService.extendSession();
      scheduleExpiryCheck();
    }

    ACTIVITY_EVENTS.forEach((eventName) =>
      document.addEventListener(eventName, handleActivity, { passive: true }),
    );

    return () => {
      ACTIVITY_EVENTS.forEach((eventName) =>
        document.removeEventListener(eventName, handleActivity),
      );
      clearTimeout(timeoutIdRef.current);
    };
  }, [enabled, scheduleExpiryCheck]);
}
