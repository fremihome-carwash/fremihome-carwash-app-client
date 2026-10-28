import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiUrl } from "@/lib/query-client";

const TOKEN_KEY = "client_token";

export interface AuthUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  companyId?: string | null;
  createdAt?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; phone?: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function readJsonOrThrow(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

async function postLogin(email: string, password: string) {
  const baseUrl = getApiUrl();
  const url = new URL("/api/auth/login", baseUrl);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return (await readJsonOrThrow(res)) as { token: string; user: AuthUser };
}

async function postRegisterClient(data: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}) {
  const baseUrl = getApiUrl();
  const url = new URL("/api/auth/register-client", baseUrl);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return (await readJsonOrThrow(res)) as { token: string; user: AuthUser };
}

async function fetchMe(token: string) {
  const baseUrl = getApiUrl();
  const url = new URL("/api/auth/me", baseUrl);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return (await readJsonOrThrow(res)) as AuthUser;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(TOKEN_KEY);
        if (!stored) return;
        const me = await fetchMe(stored);
        if (cancelled) return;
        setToken(stored);
        setUser(me);
      } catch {
        await AsyncStorage.removeItem(TOKEN_KEY);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await postLogin(email, password);
    if (result.user.role !== "client") {
      throw new Error("Esta aplicación es solo para clientes.");
    }
    await AsyncStorage.setItem(TOKEN_KEY, result.token);
    setToken(result.token);
    setUser(result.user);
  }, []);

  const register = useCallback(async (data: { name: string; email: string; password: string; phone?: string }) => {
    const result = await postRegisterClient(data);
    await AsyncStorage.setItem(TOKEN_KEY, result.token);
    setToken(result.token);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, token, loading, login, register, logout }),
    [user, token, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
