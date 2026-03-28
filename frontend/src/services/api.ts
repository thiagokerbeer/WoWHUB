import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL?.trim() || "http://localhost:3333";

export const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("wowhub_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const currentPath = window.location.pathname;

    if ((status === 401 || status === 403) && currentPath.startsWith("/app")) {
      localStorage.removeItem("wowhub_token");
      localStorage.removeItem("wowhub_user");
      window.dispatchEvent(new Event("wowhub:unauthorized"));
    }

    return Promise.reject(error);
  }
);