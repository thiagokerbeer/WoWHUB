import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { AuthResponse, User } from "../types";

type LoginData = {
  email: string;
  password: string;
};

type RegisterData = {
  name: string;
  email: string;
  password: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("wowhub_token");
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get<User>("/auth/me")
      .then((response) => setUser(response.data))
      .catch(() => {
        localStorage.removeItem("wowhub_token");
        localStorage.removeItem("wowhub_user");
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleAuth(endpoint: "/auth/login" | "/auth/register", data: LoginData | RegisterData) {
    const response = await api.post<AuthResponse>(endpoint, data);
    localStorage.setItem("wowhub_token", response.data.token);
    localStorage.setItem("wowhub_user", JSON.stringify(response.data.user));
    setUser(response.data.user);
  }

  function login(data: LoginData) {
    return handleAuth("/auth/login", data);
  }

  function register(data: RegisterData) {
    return handleAuth("/auth/register", data);
  }

  function logout() {
    localStorage.removeItem("wowhub_token");
    localStorage.removeItem("wowhub_user");
    setUser(null);
  }

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
