import { FormEvent, useEffect, useState } from "react";
import { api } from "../services/api";
import { Ticket } from "../types";
import { useAuth } from "../context/AuthContext";

const defaultForm = {
  title: "",
  description: "",
  category: "Suporte",
  priority: "MEDIUM"
};

function traduzirStatus(status: string) {
  const mapa: Record<string, string> = {
    OPEN: "Aberto",
    IN_PROGRESS: "Em andamento",
    WAITING_RESPONSE: "Aguardando resposta",
    RESOLVED: "Resolvido",
    CLOSED: "Fechado"
  };

  return mapa[status] || status;
}

function traduzirPrioridade(priority: string) {
  const mapa: Record<string, string> = {
    LOW: "Baixa",
    MEDIUM: "Média",
    HIGH: "Alta",
    CRITICAL: "Crítica"
  };

  return mapa[priority] || priority;
}

export function TicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [form, setForm] = useState(defaultForm);
  const [commentText, setCommentText] = useState<Record<string, string>>({});

  async function loadTickets() {
    const response = await api.get<Ticket[]>("/tickets");
    setTickets(response.data);
  }

  useEffect(() => {
    loadTickets();
  }, []);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    await api.post("/tickets", form);
    setForm(defaultForm);
    loadTickets();
  }

  async function handleStatus(ticketId: string, status: string) {
    await api.patch(`/tickets/${ticketId}/status`, { status });
    loadTickets();
  }

  async function handleComment(ticketId: string) {
    const message = commentText[ticketId];
    if (!message) return;
    await api.post(`/tickets/${ticketId}/comments`, { message });
    setCommentText((prev) => ({ ...prev, [ticketId]: "" }));
    loadTickets();
  }

  return (
    <div className="page-stack">
      <section className="header-card">
        <div>
          <span className="eyebrow">Trilha de suporte</span>
          <h1>Chamados</h1>
          <p>Abra novas demandas, acompanhe respostas e mostre maturidade de fluxo no portfólio.</p>
        </div>
      </section>

      <div className="content-grid wide-left">
        <form className="panel-card form-grid" onSubmit={handleCreate}>
          <div className="panel-title-row"><h2>Abrir chamado</h2></div>
          <label>Título<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label>Descrição<textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
          <div className="split-grid">
            <label>Categoria<input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></label>
            <label>Prioridade
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="LOW">Baixa</option>
                <option value="MEDIUM">Média</option>
                <option value="HIGH">Alta</option>
                <option value="CRITICAL">Crítica</option>
              </select>
            </label>
          </div>
          <button className="button-primary">Criar chamado</button>
        </form>

        <div className="page-stack">
          {tickets.map((ticket) => (
            <article className="panel-card" key={ticket.id}>
              <div className="panel-title-row wrap-gap">
                <div>
                  <h2>{ticket.title}</h2>
                  <p>{ticket.user.name} • {ticket.category}</p>
                </div>
                <div className="badge-row">
                  <span className={`pill ${ticket.priority.toLowerCase()}`}>{traduzirPrioridade(ticket.priority)}</span>
                  <span className="pill neutral">{traduzirStatus(ticket.status)}</span>
                </div>
              </div>

              <p className="body-copy">{ticket.description}</p>

              <div className="action-row">
                {user?.role === "ADMIN" ? (
                  <>
                    <button className="small-button" onClick={() => handleStatus(ticket.id, "IN_PROGRESS")}>Iniciar</button>
                    <button className="small-button" onClick={() => handleStatus(ticket.id, "WAITING_RESPONSE")}>Aguardar resposta</button>
                    <button className="small-button" onClick={() => handleStatus(ticket.id, "RESOLVED")}>Resolver</button>
                    <button className="small-button danger" onClick={() => handleStatus(ticket.id, "CLOSED")}>Fechar</button>
                  </>
                ) : (
                  <button className="small-button" onClick={() => handleStatus(ticket.id, "CLOSED")}>Fechar meu chamado</button>
                )}
              </div>

              <div className="comment-box">
                <strong>Conversa</strong>
                <div className="mini-list comments">
                  {ticket.comments.map((comment) => (
                    <div className="comment-item" key={comment.id}>
                      <strong>{comment.user.name}</strong>
                      <p>{comment.message}</p>
                    </div>
                  ))}
                </div>
                <div className="comment-form">
                  <input
                    placeholder="Escreva uma resposta"
                    value={commentText[ticket.id] || ""}
                    onChange={(e) => setCommentText((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                  />
                  <button className="small-button" onClick={() => handleComment(ticket.id)}>Enviar</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
