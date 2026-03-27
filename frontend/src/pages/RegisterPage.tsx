import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BrandLogo } from "../components/BrandLogo";

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

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      await register(form);
      navigate("/app");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Falha no cadastro");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="background-orb orb-one" />
      <div className="background-orb orb-two" />
      <div className="background-grid" />

      <div className="auth-card">
        <BrandLogo subtitle="SaaS Workspace" />

        <div>
          <span className="eyebrow">Novo operador</span>
          <h1>Crie sua conta</h1>
          <p className="body-copy">
            Em banco vazio, a primeira conta vira admin. Depois disso, a plataforma
            segue o fluxo normal de acesso.
          </p>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Nome
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Seu nome"
            />
          </label>

          <label>
            E-mail
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="voce@empresa.com"
            />
          </label>

          <label>
            Senha
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Crie uma senha"
            />
          </label>

          {error && <div className="error-box">{error}</div>}

          <button type="submit" className="button-primary" disabled={submitting}>
            {submitting ? "Criando..." : "Cadastrar"}
          </button>
        </form>

        <p className="muted-line">
          Já tem conta?{" "}
          <Link to="/login" className="link-light">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}