"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api, type AuthResponse, type SessionUser } from "./api";
import { deletePendingItemsForUser } from "./offlineDb";

const TOKEN_KEY = "desapega.token";
const USER_KEY = "desapega.user";

interface AuthContextValue {
  user: SessionUser | null;
  token: string | null;
  /** true enquanto o localStorage ainda não foi lido (evita flicker) */
  loading: boolean;
  signIn: (auth: AuthResponse) => void;
  signOut: () => void;
  /** Rebusca /auth/me e atualiza o usuário em memória + localStorage. */
  refreshUser: () => Promise<SessionUser | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser) as SessionUser);
    }
    setLoading(false);
  }, []);

  const signIn = useCallback((auth: AuthResponse) => {
    localStorage.setItem(TOKEN_KEY, auth.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
    setToken(auth.accessToken);
    setUser(auth.user);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // Evita que a próxima conta usada neste aparelho veja/flushe rascunhos
    // offline (e o JWT armazenado junto) de quem acabou de sair.
    if (user) {
      void deletePendingItemsForUser(user.id).catch(() => {});
    }
    setToken(null);
    setUser(null);
  }, [user]);

  const refreshUser = useCallback(async () => {
    const current = localStorage.getItem(TOKEN_KEY);
    if (!current) return null;
    try {
      const freshUser = await api.getMe(current);
      localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
      setUser(freshUser);
      return freshUser;
    } catch {
      return null;
    }
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, signIn, signOut, refreshUser }),
    [user, token, loading, signIn, signOut, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  }
  return ctx;
}

/**
 * Substitui o antigo "LoginPrompt": em vez de mostrar uma tela intermediária,
 * manda direto para /login com ?returnUrl= assim que fica claro que não há sessão.
 */
export function useAuthRedirect(): {
  user: SessionUser | null;
  token: string | null;
  ready: boolean;
} {
  const { user, token, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (loading || (user && token)) return;
    const qs = searchParams.toString();
    const returnUrl = `${pathname}${qs ? `?${qs}` : ""}`;
    router.replace(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
  }, [loading, user, token, pathname, searchParams, router]);

  return { user, token, ready: !loading && Boolean(user && token) };
}

/** URL de retorno segura: só aceita caminhos internos (evita open redirect). */
export function safeReturnUrl(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

/**
 * Destino após login/cadastro:
 * - Sem `returnUrl` (clicou em "Entrar"): home `/`
 * - Com `returnUrl` (veio de ação protegida): volta para esse destino
 */
export function postAuthDestination(
  returnUrlParam: string | null | undefined,
): string {
  if (!returnUrlParam) return "/";
  return safeReturnUrl(returnUrlParam);
}
