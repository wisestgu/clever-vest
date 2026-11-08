import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, getToken, setToken, setUnauthorizedHandler } from './api';
import type { User } from './types';

interface AuthState {
  user: User | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  demo: () => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  const clear = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    if (!getToken()) return;
    const { user } = await api<{ user: User }>('/auth/me');
    setUser(user);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(clear);
    refresh()
      .catch(clear)
      .finally(() => setReady(true));
  }, [refresh, clear]);

  const accept = ({ token, user }: { token: string; user: User }) => {
    setToken(token);
    setUser(user);
  };

  const value = useMemo<AuthState>(
    () => ({
      user,
      ready,
      refresh,
      signIn: async (email, password) => accept(await api('/auth/login', { body: { email, password } })),
      signUp: async (name, email, password) => accept(await api('/auth/signup', { body: { name, email, password } })),
      demo: async () => accept(await api('/auth/demo', { method: 'POST' })),
      signOut: async () => {
        await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
        clear();
      },
    }),
    [user, ready, refresh, clear],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth outside AuthProvider');
  return v;
}
