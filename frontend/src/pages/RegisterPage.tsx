import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
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
      <form className="auth-card" onSubmit={handleSubmit}>
        <span className="eyebrow">Novo operador</span>
        <h1>Crie sua conta</h1>
        <p>A primeira conta vira admin em bancos vazios.</p>

        <label>
          Nome
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label>
          E-mail
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label>
          Senha
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </label>

        {error && <div className="error-box">{error}</div>}

        <button className="button-primary" disabled={submitting}>{submitting ? "Criando..." : "Cadastrar"}</button>
        <Link to="/login" className="link-light dark">Já tem conta? Entrar</Link>
      </form>
    </div>
  );
}
