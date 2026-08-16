import { useEffect, useRef, useState } from "react";
import type { AppUser } from "~/models/user";
import { UserAvatar } from "~/components/common/UserAvatar";

interface UserMenuProps {
  user: AppUser;
  onOpenProfile: () => void;
  onLogout: () => void;
}

/** Avatar + nome que abre um menu (editar usuário / sair) — "Sair" não fica mais solto na topbar. */
export function UserMenu({ user, onOpenProfile, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu do usuário"
        className="flex items-center gap-2 rounded-full py-1 pr-2 pl-1 hover:bg-ink-700"
      >
        <UserAvatar name={user.name} avatarUrl={user.avatarUrl} seed={user.id} size={28} />
        <span className="hidden text-sm text-mist-200 sm:inline">{user.name}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-ink-700 bg-ink-900 p-1.5 shadow-xl"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onOpenProfile();
            }}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-mist-100 hover:bg-ink-800"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 shrink-0">
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"
              />
            </svg>
            Editar usuário
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-red-400 hover:bg-red-600/20"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 shrink-0">
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
              />
            </svg>
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
