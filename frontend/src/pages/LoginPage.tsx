import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BrandLogo } from "../components/BrandLogo";
import { InteractiveBackground } from "../components/InteractiveBackground";

type LocationState = {
  from?: {
    pathname?: string;
  };
};

const AUTH_MESSAGE_KEY = "wowhub_auth_message";

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
    } catch (err: any) {
      setError(err?.response?.data?.message || "Falha ao entrar");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="auth-page">
        <InteractiveBackground />
        <div className="background-orb orb-one" />
        <div className="background-orb orb-two" />
        <div className="background-grid" />

        <div className="auth-card">
          <BrandLogo subtitle="Secure Access" />

          <div>
            <span className="eyebrow">Sessão protegida</span>
            <h1>Verificando acesso</h1>
            <p className="body-copy">
              Estamos confirmando suas credenciais e preparando sua entrada no
              WoWHUB.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <InteractiveBackground />
      <div className="background-orb orb-one" />
      <div className="background-orb orb-two" />
      <div className="background-grid" />

      <div className="auth-card">
        <BrandLogo subtitle="Secure Access" />

        <div>
          <span className="eyebrow">Acesso privado</span>
          <h1>Entre no WoWHUB</h1>
          <p className="body-copy">
            Use sua conta para acessar a operação, acompanhar tarefas, abrir
            chamados e navegar pela área privada do produto.
          </p>
          <p className="muted-line">
            Quer testar pela primeira vez? Crie sua conta em segundos. O acesso
            administrativo não fica exposto nesta tela e permanece somente na
            documentação da demo.
          </p>
        </div>

        {infoMessage ? (
          <div className="feature-card">
            <span className="feature-kicker">Conta criada</span>
            <p className="muted-line">{infoMessage}</p>
          </div>
        ) : null}

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

          <button type="submit" className="primary-button" disabled={submitting}>
            {submitting ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="body-copy">
          Ainda não tem conta? <Link to="/register">Cadastre-se</Link>
        </p>

        <p className="muted-line">
          Voltou para conhecer melhor o produto? <Link to="/">Ir para a home</Link>
        </p>
      </div>
    </div>
  );
}