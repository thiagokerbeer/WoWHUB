import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "admin@wowhub.com", password: "123456" });
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
      <form className="auth-card" onSubmit={handleSubmit}>
        <span className="eyebrow">Bem-vindo de volta</span>
        <h1>Acesse o WoWHUB</h1>
        <p>Use a conta admin semeada ou crie sua própria conta de operador.</p>

        <label>
          E-mail
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label>
          Senha
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </label>

        {error && <div className="error-box">{error}</div>}

        <button className="button-primary" disabled={submitting}>{submitting ? "Entrando..." : "Entrar"}</button>
        <Link to="/register" className="link-light dark">Ainda não tem conta? Cadastre-se</Link>
      </form>
    </div>
  );
}
