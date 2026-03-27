import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BrandLogo } from "../components/BrandLogo";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "admin@wowhub.com",
    password: "123456",
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      await login(form);
      navigate("/app");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Falha ao entrar");
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
        <BrandLogo subtitle="Secure Access" />

        <div>
          <span className="eyebrow">Bem-vindo de volta</span>
          <h1>Acesse o WoWHUB</h1>
          <p className="body-copy">
            Use a conta admin semeada ou entre com sua conta para acessar a operação.
          </p>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
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
              placeholder="Digite sua senha"
            />
          </label>

          {error && <div className="error-box">{error}</div>}

          <button type="submit" className="button-primary" disabled={submitting}>
            {submitting ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="muted-line">
          Ainda não tem conta?{" "}
          <Link to="/register" className="link-light">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}