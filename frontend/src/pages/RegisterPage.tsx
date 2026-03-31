import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PublicShell } from "../components/PublicShell";

const REGISTER_POINTS = [
  "Validação no servidor e limite de tentativas no cadastro e login.",
  "Acesso imediato à área privada após criar a conta.",
  "Mesma experiência visual e fluxo do restante da plataforma.",
] as const;

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
      setError(message || "Falha no cadastro");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PublicShell>
      <div className="public-panel">
        <div className="public-panel__intro">
          <p className="public-badge">
            <span className="public-badge__dot" aria-hidden />
            Novo operador
          </p>
          <h1 className="public-page-title">Criar conta</h1>
          <p className="public-lead">
            Cadastre-se para explorar tickets, tarefas e o painel com uma conta sua —
            em poucos passos você já está dentro do ambiente.
          </p>
        </div>

        <ul className="public-checklist" aria-label="O que você obtém">
          {REGISTER_POINTS.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>

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
              placeholder="Como devemos te chamar"
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
              placeholder="Mínimo seguro para a demo"
              autoComplete="new-password"
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
              {submitting ? "Criando conta…" : "Cadastrar e entrar"}
            </button>
          </div>
        </form>

        <p className="public-panel__footnote">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </div>
    </PublicShell>
  );
}
