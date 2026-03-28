import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { api } from "../services/api";
import type { AuthResponse, User } from "../types";

type LoginData = {
  email: string;
  password: string;
};

type RegisterData = {
  name: string;
  email: string;
  password: string;
};

type LogoutReason = "manual" | "expired";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: (reason?: LogoutReason) => void;
  restoreSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = "wowhub_token";
const USER_KEY = "wowhub_user";
const AUTH_MESSAGE_KEY = "wowhub_auth_message";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem(USER_KEY);

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser) as User;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  function clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }

  function persistSession(data: AuthResponse) {
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    sessionStorage.removeItem(AUTH_MESSAGE_KEY);
    setUser(data.user);
  }

  async function restoreSession() {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      clearSession();
      setLoading(false);
      return;
    }

    try {
      const response = await api.get<User>("/auth/me");
      localStorage.setItem(USER_KEY, JSON.stringify(response.data));
      setUser(response.data);
    } catch {
      sessionStorage.setItem(
        AUTH_MESSAGE_KEY,
        "Sua sessão expirou ou não é mais válida. Faça login novamente para continuar."
      );
      clearSession();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    restoreSession();
  }, []);

  useEffect(() => {
    function handleUnauthorized() {
      clearSession();
    }

    window.addEventListener("wowhub:unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener("wowhub:unauthorized", handleUnauthorized);
    };
  }, []);

  async function handleAuth(
    endpoint: "/auth/login" | "/auth/register",
    data: LoginData | RegisterData
  ) {
    const response = await api.post<AuthResponse>(endpoint, data);
    persistSession(response.data);
  }

  async function login(data: LoginData) {
    await handleAuth("/auth/login", data);
  }

  async function register(data: RegisterData) {
    await handleAuth("/auth/register", data);
  }

  function logout(reason: LogoutReason = "manual") {
    if (reason === "manual") {
      sessionStorage.setItem(
        AUTH_MESSAGE_KEY,
        "Você saiu da sua conta com segurança."
      );
    }

    if (reason === "expired") {
      sessionStorage.setItem(
        AUTH_MESSAGE_KEY,
        "Sua sessão expirou ou não é mais válida. Faça login novamente para continuar."
      );
    }

    clearSession();
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      restoreSession,
    }),
    [user, loading]
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