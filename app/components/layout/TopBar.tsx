import type { AppUser } from "~/models/user";
import { Logo } from "~/components/common/Logo";
import { UserMenu } from "~/components/layout/UserMenu";

interface TopBarProps {
  user: AppUser;
  listName?: string;
  onLogout: () => void;
  onOpenLists: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
}

export function TopBar({ user, listName, onLogout, onOpenLists, onOpenSettings, onOpenProfile }: TopBarProps) {
  return (
    <header className="flex items-center justify-between border-b border-ink-700 px-4 py-3 sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          onClick={onOpenLists}
          aria-label="Abrir minhas listas"
          className="shrink-0 rounded-full p-2 text-mist-300 hover:bg-ink-700 hover:text-mist-50"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
            <path
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <div className="flex min-w-0 items-center gap-2">
          <div className="flex min-w-0 flex-col justify-center">
            <Logo size="sm" />
            {/* Mobile: nome da lista embaixo do título, pra não espremer o logo na mesma linha. */}
            {listName && <span className="truncate text-xs text-mist-400 sm:hidden">{listName}</span>}
          </div>

          {/* Desktop: volta a ficar do lado do título, como sempre foi ("título / lista"). */}
          {listName && (
            <span className="hidden min-w-0 items-center gap-1.5 truncate text-sm text-mist-400 sm:flex">
              <span aria-hidden="true" className="shrink-0">
                /
              </span>
              <span className="truncate">{listName}</span>
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenSettings}
          title="Configurações"
          aria-label="Abrir configurações"
          className="rounded-full p-2 text-mist-300 hover:bg-ink-700 hover:text-mist-50"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
            <path
              fill="currentColor"
              d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7.4-3.5a7.4 7.4 0 0 0-.1-1.2l1.9-1.5-1.9-3.3-2.3.7a7.6 7.6 0 0 0-2-1.2l-.4-2.4H9.4l-.4 2.4a7.6 7.6 0 0 0-2 1.2l-2.3-.7-1.9 3.3 1.9 1.5a7.4 7.4 0 0 0 0 2.4l-1.9 1.5 1.9 3.3 2.3-.7c.6.5 1.3.9 2 1.2l.4 2.4h5.2l.4-2.4c.7-.3 1.4-.7 2-1.2l2.3.7 1.9-3.3-1.9-1.5c.1-.4.1-.8.1-1.2Z"
            />
          </svg>
        </button>

        <UserMenu user={user} onOpenProfile={onOpenProfile} onLogout={onLogout} />
      </div>
    </header>
  );
}
