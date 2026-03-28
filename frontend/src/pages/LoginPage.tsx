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

export function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({
    email: "admin@wowhub.com",
    password: "123456",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
          <span className="eyebrow">Bem-vindo de volta</span>
          <h1>Acesse o WoWHUB</h1>
          <p className="body-copy">
            Entre com sua conta para acessar a operação com segurança e
            estabilidade.
          </p>
        </div>

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
      </div>
    </div>
  );
}