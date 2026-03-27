import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BrandLogo } from "../components/BrandLogo";
import { InteractiveBackground } from "../components/InteractiveBackground";
import { TurnstileWidget } from "../components/TurnstileWidget";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
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

      await register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        turnstileToken: form.turnstileToken,
      });

      navigate("/app");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Falha no cadastro");
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
        <BrandLogo subtitle="Protected Signup" />

        <div>
          <span className="eyebrow">Novo operador</span>
          <h1>Crie sua conta</h1>
          <p className="body-copy">
            Cadastro protegido para reduzir abuso e deixar a plataforma com cara de produto real.
          </p>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Nome
            <input
              type="text"
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
              placeholder="Seu nome"
              autoComplete="name"
              required
            />
          </label>

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
              placeholder="Crie uma senha"
              autoComplete="new-password"
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
            {submitting ? "Criando..." : "Cadastrar"}
          </button>
        </form>

        <p className="body-copy">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </div>
    </div>
  );
}