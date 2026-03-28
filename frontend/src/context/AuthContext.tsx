import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { api } from "../services/api";
import {
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  WOWHUB_AUTH_EVENTS,
  clearStoredAuth,
  getStoredToken,
  getStoredUser,
  setStoredAuth,
} from "../services/api";
import type { AuthResponse, User } from "../types";

type LoginData = {
  email: string;
  password: string;
  turnstileToken?: string;
};

type RegisterData = {
  name: string;
  email: string;
  password: string;
  turnstileToken?: string;
};

type LogoutOptions = {
  redirectTo?: string;
  message?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: (options?: LogoutOptions) => void;
  forceLogout: (message?: string) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

function dispatchAuthEvent(
  eventName: string,
  detail?: Record<string, unknown>
) {
  window.dispatchEvent(new CustomEvent(eventName, { detail }));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = getStoredUser();
    return storedUser as User | null;
  });
  const [loading, setLoading] = useState(true);

  const clearSessionState = useCallback(() => {
    clearStoredAuth();
    setUser(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    const token = getStoredToken();

    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get<User>("/auth/me")
      .then((response) => {
        setUser(response.data);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.data));
      })
      .catch(() => {
        clearSessionState();
      })
      .finally(() => {
        setLoading(false);
      });
  }, [clearSessionState]);

  useEffect(() => {
    function handleSessionExpired() {
      clearSessionState();
    }

    function handleLogout() {
      clearSessionState();
    }

    window.addEventListener(
      WOWHUB_AUTH_EVENTS.SESSION_EXPIRED,
      handleSessionExpired
    );
    window.addEventListener(WOWHUB_AUTH_EVENTS.LOGOUT, handleLogout);

    return () => {
      window.removeEventListener(
        WOWHUB_AUTH_EVENTS.SESSION_EXPIRED,
        handleSessionExpired
      );
      window.removeEventListener(WOWHUB_AUTH_EVENTS.LOGOUT, handleLogout);
    };
  }, [clearSessionState]);

  async function handleAuth(
    endpoint: "/auth/login" | "/auth/register",
    data: LoginData | RegisterData
  ) {
    const response = await api.post<AuthResponse>(endpoint, data);

    setStoredAuth(response.data.token, response.data.user);
    setUser(response.data.user);
  }

  async function login(data: LoginData) {
    await handleAuth("/auth/login", data);
  }

  async function register(data: RegisterData) {
    await handleAuth("/auth/register", data);
  }

  function logout(options?: LogoutOptions) {
    clearStoredAuth();
    setUser(null);

    dispatchAuthEvent(WOWHUB_AUTH_EVENTS.LOGOUT, {
      redirectTo: options?.redirectTo ?? "/login",
      message: options?.message ?? "Você saiu da sua conta com sucesso.",
    });
  }

  function forceLogout(message?: string) {
    clearStoredAuth();
    setUser(null);

    dispatchAuthEvent(WOWHUB_AUTH_EVENTS.SESSION_EXPIRED, {
      message:
        message ||
        "Sua sessão expirou ou foi encerrada. Faça login novamente.",
    });
  }

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      forceLogout,
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