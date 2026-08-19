import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { AuthApiError, authApiRequest } from "@/lib/api";
import {
  clearStoredSession,
  loadStoredSession,
  storeSession,
} from "@/lib/auth-storage";

export interface AuthUser {
  id: number;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  provider: string;
  authMethods: {
    password: boolean;
    apple: boolean;
  };
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  signIn: (token: string, user: AuthUser) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { token: savedToken, user: savedUser } =
          await loadStoredSession();

        if (savedToken && savedUser) {
          const parsedUser = JSON.parse(savedUser) as AuthUser;
          parsedUser.authMethods ??= { password: false, apple: false };
          setToken(savedToken);
          setUser(parsedUser);
          setAuthTokenGetter(() => savedToken);

          try {
            const currentUser = await authApiRequest<AuthUser>(
              "/api/auth/me",
              {},
              savedToken,
            );
            setUser(currentUser);
            await storeSession(savedToken, currentUser);
          } catch (error) {
            if (error instanceof AuthApiError && error.status === 401) {
              setToken(null);
              setUser(null);
              setAuthTokenGetter(null);
              await clearStoredSession();
            }
          }
        }
      } catch {
        await clearStoredSession().catch(() => undefined);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const signIn = useCallback(async (newToken: string, newUser: AuthUser) => {
    setToken(newToken);
    setUser(newUser);
    setAuthTokenGetter(() => newToken);
    await storeSession(newToken, newUser);
  }, []);

  const signOut = useCallback(async () => {
    setToken(null);
    setUser(null);
    setAuthTokenGetter(null);
    await clearStoredSession();
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
