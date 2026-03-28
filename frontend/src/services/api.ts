import axios, { AxiosError } from "axios";

export const AUTH_TOKEN_KEY = "wowhub_token";
export const AUTH_USER_KEY = "wowhub_user";

export const WOWHUB_AUTH_EVENTS = {
  SESSION_EXPIRED: "wowhub:session-expired",
  ACCESS_DENIED: "wowhub:access-denied",
  LOGOUT: "wowhub:logout",
} as const;

const baseURL =
  import.meta.env.VITE_API_URL?.trim() || "http://localhost:3333";

export const api = axios.create({
  baseURL,
});

export function getStoredToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getStoredUser() {
  const rawUser = localStorage.getItem(AUTH_USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    localStorage.removeItem(AUTH_USER_KEY);
    return null;
  }
}

export function setStoredAuth(token: string, user: unknown) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
}

function dispatchAuthEvent(
  eventName: string,
  detail?: Record<string, unknown>
) {
  window.dispatchEvent(new CustomEvent(eventName, { detail }));
}

function isPublicAuthRequest(url?: string) {
  if (!url) {
    return false;
  }

  return url.includes("/auth/login") || url.includes("/auth/register");
}

let sessionExpiredAlreadyDispatched = false;

api.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url;
    const token = getStoredToken();
    const backendMessage = error.response?.data?.message;

    if ((status === 401 || status === 403) && token) {
      if (status === 401 && !isPublicAuthRequest(requestUrl)) {
        clearStoredAuth();

        if (!sessionExpiredAlreadyDispatched) {
          sessionExpiredAlreadyDispatched = true;

          dispatchAuthEvent(WOWHUB_AUTH_EVENTS.SESSION_EXPIRED, {
            message:
              backendMessage ||
              "Sua sessão expirou ou ficou inválida. Faça login novamente.",
          });

          window.setTimeout(() => {
            sessionExpiredAlreadyDispatched = false;
          }, 1200);
        }
      }

      if (status === 403) {
        dispatchAuthEvent(WOWHUB_AUTH_EVENTS.ACCESS_DENIED, {
          message:
            backendMessage ||
            "Você não tem permissão para acessar esta área do WoWHUB.",
        });
      }
    }

    return Promise.reject(error);
  }
);