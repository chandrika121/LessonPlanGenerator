import React, { createContext, useEffect, useMemo, useState } from "react";
import { authenticateUser, getProfile } from "../services/auth";
import type { AuthContextValue, AuthUser } from "../types/auth";

const AUTH_STORAGE_KEY = "lms:auth-session";

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        setUser(JSON.parse(saved) as AuthUser);
      }
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } finally {
      setIsReady(true);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role: user?.role ?? null,
      isAuthenticated: Boolean(user),
      isReady,
      async login(email: string, password: string) {
        const authenticated = await authenticateUser(email, password);
        setUser(authenticated);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authenticated));
        return authenticated;
      },
      async refreshUser() {
        if (!user?.id || !user.schoolId) return;
        const nextUser = await getProfile(user.id, user.schoolId);
        setUser(nextUser);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextUser));
      },
      logout() {
        setUser(null);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      },
    }),
    [isReady, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
