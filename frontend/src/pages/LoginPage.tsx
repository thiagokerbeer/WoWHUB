import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BrandLogo } from "../components/BrandLogo";
import { InteractiveBackground } from "../components/InteractiveBackground";
import { TurnstileWidget } from "../components/TurnstileWidget";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "admin@wowhub.com",
    password: "123456",
    turnstileToken: "",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!form.turnstileToken) {
      setError("Confirme a verificação de segurança.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await login({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        turnstileToken: form.turnstileToken,
      });

      navigate("/app");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Falha ao entrar");
      setForm((current) => ({
        ...current,
        turnstileToken: "",
      }));
    } finally {
      setSubmitting(false);
    }
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
            Entre com sua conta para acessar a operação com uma camada extra de proteção.
          </p>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            E-mail
            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm({
                  ...form,
                  email: e.target.value,
                })
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
                setForm({
                  ...form,
                  password: e.target.value,
                })
              }
              placeholder="Sua senha"
              autoComplete="current-password"
              required
            />
          </label>

          <TurnstileWidget
            onTokenChange={(token) =>
              setForm((current) => ({
                ...current,
                turnstileToken: token,
              }))
            }
          />

          {error && <div className="error-box">{error}</div>}

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