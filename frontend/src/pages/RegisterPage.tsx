import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BrandLogo } from "../components/BrandLogo";
import { InteractiveBackground } from "../components/InteractiveBackground";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      await register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      navigate("/app");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Falha no cadastro");
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
            Cadastro protegido por validação no servidor e limite de tentativas.
          </p>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Nome
            <input
              type="text"
              value={form.name}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  name: e.target.value,
                }))
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
              placeholder="Crie uma senha"
              autoComplete="new-password"
              required
            />
          </label>

          {error ? <div className="error-box">{error}</div> : null}

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