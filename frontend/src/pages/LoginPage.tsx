import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BrandLogo } from "../components/BrandLogo";
import { PublicShell } from "../components/PublicShell";

type LocationState = {
  from?: {
    pathname?: string;
  };
};

const AUTH_MESSAGE_KEY = "wowhub_auth_message";

const DEMO_PASSWORD = "123456";

const DEMO_ACCOUNTS = [
  {
    label: "Administrador",
    email: "admin@wowhub.com",
  },
  {
    label: "Usuário",
    email: "user@wowhub.com",
  },
] as const;

export function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const storedMessage = sessionStorage.getItem(AUTH_MESSAGE_KEY);

    if (storedMessage) {
      setInfoMessage(storedMessage);
      sessionStorage.removeItem(AUTH_MESSAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/app", { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  function fillDemoAccount(email: string) {
    setForm({ email, password: DEMO_PASSWORD });
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setInfoMessage("");

      await login({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      const state = location.state as LocationState | null;
      const redirectTo = state?.from?.pathname || "/app";

      navigate(redirectTo, { replace: true });
    } catch (err: unknown) {
      const message =
        err &&
        typeof err === "object" &&
        "response" in err &&
        typeof (err as { response?: { data?: { message?: string } } })
          .response === "object"
          ? (err as { response?: { data?: { message?: string } } }).response
              ?.data?.message
          : undefined;
      setError(message || "Falha ao entrar");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <PublicShell footerMeta="Verificando sessão…">
        <div className="public-panel public-panel--loading">
          <BrandLogo subtitle="WoWHUB" compact to="/" />
          <p className="public-loading-text">Sincronizando com o servidor…</p>
        </div>
      </PublicShell>
    );
  }

  return (
    <PublicShell>
      <div className="public-panel">
        <div className="public-panel__intro">
          <p className="public-badge">
            <span className="public-badge__dot" aria-hidden />
            Área privada
          </p>
          <h1 className="public-page-title">Entrar</h1>
          <p className="public-lead">
            Use sua conta para acessar dashboard, chamados e tarefas no mesmo ambiente.
          </p>
        </div>

        {infoMessage ? (
          <div className="public-banner public-banner--info">{infoMessage}</div>
        ) : null}

        <section className="public-demo" aria-label="Contas para demonstração">
          <p className="public-demo__title">Demonstração</p>
          <p className="public-demo__hint">
            Senha em ambas:{" "}
            <code className="public-demo__mono">{DEMO_PASSWORD}</code>
          </p>
          <ul className="public-demo__list">
            {DEMO_ACCOUNTS.map((account) => (
              <li key={account.email} className="public-demo__row">
                <div className="public-demo__meta">
                  <span className="public-demo__label">{account.label}</span>
                  <span className="public-demo__email">{account.email}</span>
                </div>
                <button
                  type="button"
                  className="small-button public-demo__btn"
                  onClick={() => fillDemoAccount(account.email)}
                >
                  Preencher
                </button>
              </li>
            ))}
          </ul>
        </section>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            E-mail
            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  email: e.target.value,
                }))
              }
              placeholder="voce@empresa.com"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Senha
            <input
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  password: e.target.value,
                }))
              }
              placeholder="Sua senha"
              autoComplete="current-password"
              required
            />
          </label>

          {error ? <div className="error-box">{error}</div> : null}

          <div className="public-form-actions">
            <button
              type="submit"
              className="button-primary"
              disabled={submitting}
            >
              {submitting ? "Entrando…" : "Entrar"}
            </button>
          </div>
        </form>
      </div>
    </PublicShell>
  );
}
