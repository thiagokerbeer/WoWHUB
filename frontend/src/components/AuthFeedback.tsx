import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { WOWHUB_AUTH_EVENTS } from "../services/api";
import "./AuthFeedback.css";

type NoticeType = "warning" | "error" | "success";

type Notice = {
  id: number;
  type: NoticeType;
  title: string;
  message: string;
};

type RouteState = {
  reason?: string;
  message?: string;
  from?: unknown;
} | null;

export function AuthFeedback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [notice, setNotice] = useState<Notice | null>(null);

  const isPrivateArea = useMemo(
    () => location.pathname.startsWith("/app"),
    [location.pathname]
  );

  useEffect(() => {
    function showNotice(nextNotice: Omit<Notice, "id">) {
      setNotice({
        id: Date.now(),
        ...nextNotice,
      });
    }

    function handleSessionExpired(event: Event) {
      const customEvent = event as CustomEvent<{ message?: string }>;
      const message =
        customEvent.detail?.message ||
        "Sua sessão expirou. Faça login novamente.";

      showNotice({
        type: "warning",
        title: "Sessão encerrada",
        message,
      });

      if (location.pathname !== "/login") {
        navigate("/login", {
          replace: true,
          state: {
            reason: "session-expired",
            message,
            from: location,
          },
        });
      }
    }

    function handleAccessDenied(event: Event) {
      const customEvent = event as CustomEvent<{ message?: string }>;
      const message =
        customEvent.detail?.message ||
        "Você não tem permissão para acessar esta área.";

      showNotice({
        type: "error",
        title: "Acesso negado",
        message,
      });

      if (location.pathname.startsWith("/app/admin")) {
        navigate("/app", {
          replace: true,
          state: {
            reason: "admin-only",
            message,
          },
        });
      }
    }

    function handleLogout(event: Event) {
      const customEvent = event as CustomEvent<{
        message?: string;
        redirectTo?: string;
      }>;

      const message =
        customEvent.detail?.message || "Você saiu da sua conta com sucesso.";
      const redirectTo = customEvent.detail?.redirectTo || "/login";

      showNotice({
        type: "success",
        title: "Logout realizado",
        message,
      });

      if (location.pathname !== redirectTo) {
        navigate(redirectTo, { replace: true });
      }
    }

    window.addEventListener(
      WOWHUB_AUTH_EVENTS.SESSION_EXPIRED,
      handleSessionExpired
    );
    window.addEventListener(
      WOWHUB_AUTH_EVENTS.ACCESS_DENIED,
      handleAccessDenied
    );
    window.addEventListener(WOWHUB_AUTH_EVENTS.LOGOUT, handleLogout);

    return () => {
      window.removeEventListener(
        WOWHUB_AUTH_EVENTS.SESSION_EXPIRED,
        handleSessionExpired
      );
      window.removeEventListener(
        WOWHUB_AUTH_EVENTS.ACCESS_DENIED,
        handleAccessDenied
      );
      window.removeEventListener(WOWHUB_AUTH_EVENTS.LOGOUT, handleLogout);
    };
  }, [location, navigate]);

  useEffect(() => {
    const state = location.state as RouteState;

    if (!state?.message) {
      return;
    }

    if (state.reason === "auth-required") {
      setNotice({
        id: Date.now(),
        type: "warning",
        title: "Login necessário",
        message: state.message,
      });
    }

    if (state.reason === "admin-only") {
      setNotice({
        id: Date.now(),
        type: "error",
        title: "Área restrita",
        message: state.message,
      });
    }

    if (state.reason === "session-expired") {
      setNotice({
        id: Date.now(),
        type: "warning",
        title: "Sessão encerrada",
        message: state.message,
      });
    }

    navigate(`${location.pathname}${location.search}${location.hash}`, {
      replace: true,
      state: null,
    });
  }, [location, navigate]);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setNotice(null);
    }, 4500);

    return () => window.clearTimeout(timeout);
  }, [notice]);

  if (!notice) {
    return null;
  }

  const toneClass =
    notice.type === "success"
      ? "auth-feedback--success"
      : notice.type === "error"
        ? "auth-feedback--error"
        : "auth-feedback--warning";

  return (
    <div className={`auth-feedback ${toneClass}`} role="status" aria-live="polite">
      <div className="auth-feedback__panel">
        <div className="auth-feedback__row">
          <div>
            <strong className="auth-feedback__title">{notice.title}</strong>
            <p className="auth-feedback__message">{notice.message}</p>
          </div>

          <button
            type="button"
            className="auth-feedback__close"
            onClick={() => setNotice(null)}
            aria-label="Fechar aviso"
          >
            ×
          </button>
        </div>

        {isPrivateArea && notice.type !== "success" ? (
          <p className="auth-feedback__hint">
            O WoWHUB protege automaticamente áreas privadas quando a sessão perde
            validade.
          </p>
        ) : null}
      </div>
    </div>
  );
}