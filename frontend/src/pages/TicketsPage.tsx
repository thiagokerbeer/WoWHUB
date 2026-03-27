import { FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { Ticket } from "../types";
import { useAuth } from "../context/AuthContext";
import "./TicketsPage.css";

const defaultForm = {
  title: "",
  description: "",
  category: "Suporte",
  priority: "MEDIUM",
};

function traduzirStatus(status: string) {
  const mapa: Record<string, string> = {
    OPEN: "Aberto",
    IN_PROGRESS: "Em andamento",
    WAITING_RESPONSE: "Aguardando resposta",
    RESOLVED: "Resolvido",
    CLOSED: "Fechado",
  };

  return mapa[status] || status;
}

function traduzirPrioridade(priority: string) {
  const mapa: Record<string, string> = {
    LOW: "Baixa",
    MEDIUM: "Média",
    HIGH: "Alta",
    CRITICAL: "Crítica",
  };

  return mapa[priority] || priority;
}

function formatarData(dateString: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
}

export function TicketsPage() {
  const { user } = useAuth();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [form, setForm] = useState(defaultForm);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [activeStatusTicketId, setActiveStatusTicketId] = useState<string | null>(null);
  const [activeCommentTicketId, setActiveCommentTicketId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");

  async function loadTickets() {
    setLoading(true);

    try {
      const response = await api.get<Ticket[]>("/tickets");
      setTickets(response.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTickets();
  }, []);

  const categorias = useMemo(() => {
    const base = ["Suporte"];
    const dinamicas = Array.from(new Set(tickets.map((ticket) => ticket.category))).filter(Boolean);
    return Array.from(new Set([...base, ...dinamicas]));
  }, [tickets]);

  const metricas = useMemo(() => {
    const abertos = tickets.filter((ticket) => ticket.status === "OPEN").length;
    const emAndamento = tickets.filter((ticket) => ticket.status === "IN_PROGRESS").length;
    const aguardando = tickets.filter((ticket) => ticket.status === "WAITING_RESPONSE").length;
    const resolvidos = tickets.filter(
      (ticket) => ticket.status === "RESOLVED" || ticket.status === "CLOSED"
    ).length;

    return { abertos, emAndamento, aguardando, resolvidos };
  }, [tickets]);

  const ticketsFiltrados = useMemo(() => {
    return tickets.filter((ticket) => {
      const bateBusca =
        search.trim() === "" ||
        ticket.title.toLowerCase().includes(search.toLowerCase()) ||
        ticket.description.toLowerCase().includes(search.toLowerCase()) ||
        ticket.user.name.toLowerCase().includes(search.toLowerCase()) ||
        ticket.category.toLowerCase().includes(search.toLowerCase());

      const bateStatus = statusFilter === "ALL" || ticket.status === statusFilter;
      const batePrioridade = priorityFilter === "ALL" || ticket.priority === priorityFilter;

      return bateBusca && bateStatus && batePrioridade;
    });
  }, [tickets, search, statusFilter, priorityFilter]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setCreating(true);
      await api.post("/tickets", form);
      setForm(defaultForm);
      await loadTickets();
    } finally {
      setCreating(false);
    }
  }

  async function handleStatus(ticketId: string, status: string) {
    try {
      setActiveStatusTicketId(ticketId);
      await api.patch(`/tickets/${ticketId}/status`, { status });
      await loadTickets();
    } finally {
      setActiveStatusTicketId(null);
    }
  }

  async function handleComment(ticketId: string) {
    const message = commentText[ticketId]?.trim();

    if (!message) {
      return;
    }

    try {
      setActiveCommentTicketId(ticketId);
      await api.post(`/tickets/${ticketId}/comments`, { message });
      setCommentText((prev) => ({ ...prev, [ticketId]: "" }));
      await loadTickets();
    } finally {
      setActiveCommentTicketId(null);
    }
  }

  return (
    <div className="page-stack tickets-page">
      <section className="header-card wow-gradient tickets-hero">
        <div className="tickets-hero__content">
          <span className="eyebrow">Trilha de suporte</span>
          <h1>Chamados</h1>
          <p className="tickets-hero__lead">
            Abra novas demandas, acompanhe a conversa e conduza o fluxo de atendimento com cara de
            produto real.
          </p>

          <div className="tickets-hero__chips">
            <span className="tickets-chip">Fila operacional</span>
            <span className="tickets-chip">Histórico por ticket</span>
            <span className="tickets-chip">Acompanhamento centralizado</span>
          </div>
        </div>

        <aside className="tickets-hero__summary">
          <div className="tickets-summary-card">
            <span className="tickets-summary-card__label">Leitura rápida da fila</span>

            <div className="tickets-summary-card__grid">
              <div>
                <small>Abertos</small>
                <strong>{metricas.abertos}</strong>
              </div>
              <div>
                <small>Em andamento</small>
                <strong>{metricas.emAndamento}</strong>
              </div>
              <div>
                <small>Aguardando</small>
                <strong>{metricas.aguardando}</strong>
              </div>
              <div>
                <small>Resolvidos</small>
                <strong>{metricas.resolvidos}</strong>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section className="tickets-layout">
        <aside className="panel-card tickets-create-card">
          <div className="tickets-create-card__header">
            <span className="eyebrow">Novo chamado</span>
            <h2>Abrir demanda</h2>
            <p className="body-copy">
              Registre o contexto da solicitação para deixar o fluxo mais claro desde a entrada.
            </p>
          </div>

          <form className="tickets-form" onSubmit={handleCreate}>
            <label>
              Título
              <input
                value={form.title}
                onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
                placeholder="Ex.: Computador não liga"
                required
              />
            </label>

            <label>
              Descrição
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((current) => ({ ...current, description: e.target.value }))
                }
                placeholder="Descreva o cenário, impacto e contexto do problema"
                rows={5}
                required
              />
            </label>

            <div className="tickets-form__split">
              <label>
                Categoria
                <select
                  value={form.category}
                  onChange={(e) => setForm((current) => ({ ...current, category: e.target.value }))}
                >
                  {categorias.map((categoria) => (
                    <option key={categoria} value={categoria}>
                      {categoria}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Prioridade
                <select
                  value={form.priority}
                  onChange={(e) => setForm((current) => ({ ...current, priority: e.target.value }))}
                >
                  <option value="LOW">Baixa</option>
                  <option value="MEDIUM">Média</option>
                  <option value="HIGH">Alta</option>
                  <option value="CRITICAL">Crítica</option>
                </select>
              </label>
            </div>

            <button className="button-primary tickets-submit-button" disabled={creating}>
              {creating ? "Criando chamado..." : "Criar chamado"}
            </button>
          </form>
        </aside>

        <section className="page-stack tickets-main-column">
          <div className="panel-card tickets-filter-card">
            <div className="tickets-filter-card__header">
              <div>
                <span className="eyebrow">Painel de triagem</span>
                <h2>Fila de chamados</h2>
              </div>
              <span className="tickets-filter-card__count">
                {ticketsFiltrados.length} {ticketsFiltrados.length === 1 ? "item" : "itens"}
              </span>
            </div>

            <div className="tickets-filters">
              <label className="tickets-filters__search">
                Buscar
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Título, usuário, categoria ou descrição"
                />
              </label>

              <label>
                Status
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="ALL">Todos</option>
                  <option value="OPEN">Aberto</option>
                  <option value="IN_PROGRESS">Em andamento</option>
                  <option value="WAITING_RESPONSE">Aguardando resposta</option>
                  <option value="RESOLVED">Resolvido</option>
                  <option value="CLOSED">Fechado</option>
                </select>
              </label>

              <label>
                Prioridade
                <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
                  <option value="ALL">Todas</option>
                  <option value="LOW">Baixa</option>
                  <option value="MEDIUM">Média</option>
                  <option value="HIGH">Alta</option>
                  <option value="CRITICAL">Crítica</option>
                </select>
              </label>
            </div>
          </div>

          {loading ? (
            <div className="panel-card">Carregando chamados...</div>
          ) : ticketsFiltrados.length === 0 ? (
            <div className="panel-card tickets-empty-state">
              <span className="eyebrow">Fila vazia</span>
              <h2>Nenhum chamado encontrado</h2>
              <p className="body-copy">
                Ajuste os filtros ou abra uma nova demanda para começar o fluxo.
              </p>
            </div>
          ) : (
            <div className="page-stack tickets-list">
              {ticketsFiltrados.map((ticket) => (
                <article className="panel-card ticket-card" key={ticket.id}>
                  <div className="ticket-card__header">
                    <div className="ticket-card__title-block">
                      <div className="ticket-card__title-row">
                        <h2>{ticket.title}</h2>
                        <span className="ticket-card__date">{formatarData(ticket.createdAt)}</span>
                      </div>

                      <p className="ticket-card__meta">
                        {ticket.user.name} • {ticket.user.email} • {ticket.category}
                      </p>
                    </div>

                    <div className="ticket-card__badges">
                      <span className={`dashboard-priority-badge ${ticket.priority.toLowerCase()}`}>
                        {traduzirPrioridade(ticket.priority)}
                      </span>
                      <span className="pill neutral">{traduzirStatus(ticket.status)}</span>
                    </div>
                  </div>

                  <p className="ticket-card__description">{ticket.description}</p>

                  <div className="ticket-card__actions">
                    {user?.role === "ADMIN" ? (
                      <>
                        <button
                          className="small-button"
                          disabled={activeStatusTicketId === ticket.id}
                          onClick={() => handleStatus(ticket.id, "IN_PROGRESS")}
                        >
                          Iniciar
                        </button>

                        <button
                          className="small-button"
                          disabled={activeStatusTicketId === ticket.id}
                          onClick={() => handleStatus(ticket.id, "WAITING_RESPONSE")}
                        >
                          Aguardar resposta
                        </button>

                        <button
                          className="small-button"
                          disabled={activeStatusTicketId === ticket.id}
                          onClick={() => handleStatus(ticket.id, "RESOLVED")}
                        >
                          Resolver
                        </button>

                        <button
                          className="small-button danger"
                          disabled={activeStatusTicketId === ticket.id}
                          onClick={() => handleStatus(ticket.id, "CLOSED")}
                        >
                          Fechar
                        </button>
                      </>
                    ) : (
                      <button
                        className="small-button danger"
                        disabled={activeStatusTicketId === ticket.id}
                        onClick={() => handleStatus(ticket.id, "CLOSED")}
                      >
                        Fechar meu chamado
                      </button>
                    )}
                  </div>

                  <div className="ticket-conversation">
                    <div className="ticket-conversation__header">
                      <span className="eyebrow">Conversa</span>
                      <strong>
                        {ticket.comments.length} {ticket.comments.length === 1 ? "mensagem" : "mensagens"}
                      </strong>
                    </div>

                    <div className="ticket-comments-list">
                      {ticket.comments.length === 0 ? (
                        <div className="ticket-comment ticket-comment--empty">
                          <p>Ainda não há respostas neste chamado.</p>
                        </div>
                      ) : (
                        ticket.comments.map((comment) => (
                          <div className="ticket-comment" key={comment.id}>
                            <div className="ticket-comment__top">
                              <strong>{comment.user.name}</strong>
                              <span>{formatarData(comment.createdAt)}</span>
                            </div>
                            <p>{comment.message}</p>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="ticket-comment-form">
                      <input
                        placeholder="Escreva uma resposta"
                        value={commentText[ticket.id] || ""}
                        onChange={(e) =>
                          setCommentText((prev) => ({
                            ...prev,
                            [ticket.id]: e.target.value,
                          }))
                        }
                      />
                      <button
                        className="small-button"
                        disabled={activeCommentTicketId === ticket.id}
                        onClick={() => handleComment(ticket.id)}
                      >
                        {activeCommentTicketId === ticket.id ? "Enviando..." : "Enviar"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </div>
  );
}