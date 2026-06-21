import * as SecureStore from "expo-secure-store";
import { useRouter, useSegments } from "expo-router";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { login as apiLogin } from "@/lib/api";
import type { AuthUser } from "@/lib/types";

const TOKEN_KEY = "leetrack_token";
const USER_KEY = "leetrack_user";

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadStoredAuth() {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  const userRaw = await SecureStore.getItemAsync(USER_KEY);
  const user = userRaw ? (JSON.parse(userRaw) as AuthUser) : null;
  return { token, user };
}

async function persistAuth(token: string | null, user: AuthUser | null) {
  if (token && user) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    return;
  }

  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth()
      .then(({ token: storedToken, user: storedUser }) => {
        setToken(storedToken);
        setUser(storedUser);
      })
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const response = await apiLogin(email.trim().toLowerCase(), password);
    await persistAuth(response.token, response.user);
    setToken(response.token);
    setUser(response.user);
  }, []);

  const signOut = useCallback(async () => {
    await persistAuth(null, null);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ token, user, loading, signIn, signOut }),
    [token, user, loading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function AuthGate({ children }: { children: ReactNode }) {
  const { token, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const onAuthScreen = segments[0] === "login" || segments[0] === "signup";

    if (!token && !onAuthScreen) {
      router.replace("/login");
      return;
    }

    if (token && onAuthScreen) {
      router.replace("/");
    }
  }, [token, loading, segments, router]);

  return <>{children}</>;
}