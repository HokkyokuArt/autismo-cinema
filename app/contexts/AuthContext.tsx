import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AppUser } from "~/models/user";
import { authService } from "~/services/authService";
import { useSessionTimeout } from "~/hooks/useSessionTimeout";

interface AuthContextValue {
  user: AppUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateEmail: (newEmail: string) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  updateAvatarUrl: (avatarUrl: string | undefined) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Leitura do storage é síncrona e o app roda em modo SPA (sem SSR),
  // então o estado inicial já reflete a sessão ativa desde o primeiro render.
  const [user, setUser] = useState<AppUser | null>(() => authService.getCurrentUser());

  const login = useCallback(async (email: string, password: string) => {
    const loggedInUser = await authService.login(email, password);
    authService.startSession(loggedInUser.id);
    setUser(loggedInUser);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const newUser = await authService.register(name, email, password);
    authService.startSession(newUser.id);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  // Sem useCallback/[] aqui de propósito: precisam sempre do `user` mais
  // recente (o id muda de identidade a cada login), não de um closure preso
  // ao primeiro render.
  async function updateEmail(newEmail: string) {
    if (!user) throw new Error("Nenhum usuário autenticado.");
    const updated = await authService.updateEmail(user.id, newEmail);
    setUser(updated);
  }

  async function updatePassword(currentPassword: string, newPassword: string) {
    if (!user) throw new Error("Nenhum usuário autenticado.");
    const updated = await authService.updatePassword(user.id, currentPassword, newPassword);
    setUser(updated);
  }

  function updateAvatarUrl(avatarUrl: string | undefined) {
    if (!user) throw new Error("Nenhum usuário autenticado.");
    const updated = authService.updateAvatarUrl(user.id, avatarUrl);
    setUser(updated);
  }

  useSessionTimeout({
    enabled: user !== null,
    onExpire: () => setUser(null),
  });

  const value = useMemo<AuthContextValue>(
    () => ({ user, login, register, logout, updateEmail, updatePassword, updateAvatarUrl }),
    [user, login, register, logout, updateEmail, updatePassword, updateAvatarUrl],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider.");
  }
  return context;
}
