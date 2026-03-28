import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { WOWHUB_AUTH_EVENTS } from "../services/api";

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

  const palette =
    notice.type === "success"
      ? {
          border: "rgba(74, 222, 128, 0.45)",
          glow: "rgba(74, 222, 128, 0.16)",
          title: "#dcfce7",
          text: "#bbf7d0",
        }
      : notice.type === "error"
      ? {
          border: "rgba(248, 113, 113, 0.45)",
          glow: "rgba(248, 113, 113, 0.16)",
          title: "#fee2e2",
          text: "#fecaca",
        }
      : {
          border: "rgba(250, 204, 21, 0.45)",
          glow: "rgba(250, 204, 21, 0.16)",
          title: "#fef3c7",
          text: "#fde68a",
        };

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        top: 20,
        right: 20,
        zIndex: 9999,
        width: "min(420px, calc(100vw - 32px))",
      }}
    >
      <div
        style={{
          border: `1px solid ${palette.border}`,
          background:
            "linear-gradient(135deg, rgba(10, 10, 16, 0.96), rgba(18, 18, 28, 0.96))",
          boxShadow: `0 20px 50px ${palette.glow}`,
          borderRadius: 20,
          padding: "16px 18px",
          backdropFilter: "blur(12px)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div>
            <strong
              style={{
                display: "block",
                fontSize: 15,
                color: palette.title,
                marginBottom: 6,
              }}
            >
              {notice.title}
            </strong>

            <p
              style={{
                margin: 0,
                lineHeight: 1.55,
                fontSize: 14,
                color: palette.text,
              }}
            >
              {notice.message}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Fechar aviso"
            style={{
              border: "none",
              background: "transparent",
              color: "#d1d5db",
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {isPrivateArea && notice.type !== "success" ? (
          <div
            style={{
              marginTop: 12,
              fontSize: 12,
              color: "#9ca3af",
            }}
          >
            O WoWHUB protege automaticamente áreas privadas quando a sessão perde
            validade.
          </div>
        ) : null}
      </div>
    </div>
  );
}