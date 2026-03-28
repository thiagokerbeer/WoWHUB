import { FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { Ticket } from "../types";
import { useAuth } from "../context/AuthContext";
import {
  Button,
  EmptyState,
  Field,
  FormRow,
  Input,
  NoticeBanner,
  PageHero,
  PanelCard,
  PriorityBadge,
  Select,
  SkeletonBlock,
  StatCard,
  StatusBadge,
  Textarea,
} from "../components/ui";
import "./TicketsPage.css";

type TicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING_RESPONSE"
  | "RESOLVED"
  | "CLOSED";

type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

type NoticeState =
  | {
      type: "success" | "error";
      title: string;
      message: string;
    }
  | null;

type TicketFormState = {
  title: string;
  description: string;
  category: string;
  priority: TicketPriority;
};

const initialForm: TicketFormState = {
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

function formatarData(dateString?: string | null) {
  if (!dateString) {
    return "Sem data";
  }

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

function buildErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: unknown }).response === "object"
  ) {
    const response = (error as { response?: { data?: { message?: string } } })
      .response;
    const message = response?.data?.message;

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return fallback;
}

function calcularSaude(
  open: number,
  inProgress: number,
  waiting: number,
  resolved: number
) {
  const total = open + inProgress + waiting + resolved;

  if (total === 0) {
    return {
      label: "Fila vazia",
      tone: "neutral" as const,
      text: "Ainda não há chamados registrados neste ambiente.",
    };
  }

  if (resolved >= open + inProgress + waiting) {
    return {
      label: "Operação estável",
      tone: "success" as const,
      text: "O volume resolvido já domina a fila monitorada.",
    };
  }

  if (open >= inProgress && open >= waiting) {
    return {
      label: "Atenção na fila",
      tone: "warning" as const,
      text: "Há concentração de chamados abertos esperando avanço.",
    };
  }

  return {
    label: "Ritmo ativo",
    tone: "info" as const,
    text: "O time está movimentando a fila com consistência.",
  };
}

function mapStatusTone(status: string) {
  const mapa: Record<string, "success" | "warning" | "info" | "neutral"> = {
    OPEN: "warning",
    IN_PROGRESS: "info",
    WAITING_RESPONSE: "neutral",
    RESOLVED: "success",
    CLOSED: "neutral",
  };

  return mapa[status] || "neutral";
}

function mapPriorityTone(priority: string) {
  const mapa: Record<
    string,
    "low" | "medium" | "high" | "critical" | "neutral"
  > = {
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
    CRITICAL: "critical",
  };

  return mapa[priority] || "neutral";
}

export function TicketsPage() {
  const { user } = useAuth();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [form, setForm] = useState<TicketFormState>(initialForm);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [expandedTicketId, setExpandedTicketId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [commentingTicketId, setCommentingTicketId] = useState<string | null>(
    null
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | TicketStatus>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<
    "ALL" | TicketPriority
  >("ALL");

  const [notice, setNotice] = useState<NoticeState>(null);

  async function loadTickets(options?: { silent?: boolean }) {
    const silent = options?.silent ?? false;

    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get<Ticket[]>("/tickets");
      setTickets(response.data);
    } catch (error) {
      console.error(error);
      setNotice({
        type: "error",
        title: "Falha ao carregar chamados",
        message: buildErrorMessage(
          error,
          "Não foi possível carregar a fila de chamados agora."
        ),
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setNotice(null);
    }, 4500);

    return () => window.clearTimeout(timeout);
  }, [notice]);

  const categorias = useMemo(() => {
    const base = ["Suporte"];
    const dinamicas = Array.from(
      new Set(tickets.map((ticket) => ticket.category).filter(Boolean))
    );

    return Array.from(new Set([...base, ...dinamicas]));
  }, [tickets]);

  const metricas = useMemo(() => {
    const open = tickets.filter((ticket) => ticket.status === "OPEN").length;
    const inProgress = tickets.filter(
      (ticket) => ticket.status === "IN_PROGRESS"
    ).length;
    const waiting = tickets.filter(
      (ticket) => ticket.status === "WAITING_RESPONSE"
    ).length;
    const resolved = tickets.filter(
      (ticket) => ticket.status === "RESOLVED" || ticket.status === "CLOSED"
    ).length;
    const critical = tickets.filter(
      (ticket) => ticket.priority === "CRITICAL"
    ).length;

    return {
      open,
      inProgress,
      waiting,
      resolved,
      critical,
      total: tickets.length,
      health: calcularSaude(open, inProgress, waiting, resolved),
    };
  }, [tickets]);

  const ticketsFiltrados = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const bateBusca =
        normalizedSearch === "" ||
        ticket.title.toLowerCase().includes(normalizedSearch) ||
        ticket.description.toLowerCase().includes(normalizedSearch) ||
        ticket.user.name.toLowerCase().includes(normalizedSearch) ||
        ticket.user.email.toLowerCase().includes(normalizedSearch) ||
        ticket.category.toLowerCase().includes(normalizedSearch);

      const bateStatus =
        statusFilter === "ALL" || ticket.status === statusFilter;

      const batePrioridade =
        priorityFilter === "ALL" || ticket.priority === priorityFilter;

      return bateBusca && bateStatus && batePrioridade;
    });
  }, [tickets, search, statusFilter, priorityFilter]);

  async function handleCreateTicket(event: FormEvent) {
    event.preventDefault();

    try {
      setCreating(true);

      await api.post("/tickets", form);

      setNotice({
        type: "success",
        title: "Chamado criado",
        message: "O chamado entrou na fila com sucesso.",
      });

      setForm(initialForm);
      await loadTickets({ silent: true });
    } catch (error) {
      console.error(error);
      setNotice({
        type: "error",
        title: "Falha ao criar chamado",
        message: buildErrorMessage(
          error,
          "Não foi possível abrir o chamado agora."
        ),
      });
    } finally {
      setCreating(false);
    }
  }

  async function handleStatusChange(ticketId: string, status: TicketStatus) {
    try {
      setActiveTicketId(ticketId);

      await api.patch(`/tickets/${ticketId}/status`, { status });

      setNotice({
        type: "success",
        title: "Status atualizado",
        message: `O chamado foi movido para "${traduzirStatus(status)}".`,
      });

      await loadTickets({ silent: true });
    } catch (error) {
      console.error(error);
      setNotice({
        type: "error",
        title: "Falha ao atualizar chamado",
        message: buildErrorMessage(
          error,
          "Não foi possível atualizar o status deste chamado agora."
        ),
      });
    } finally {
      setActiveTicketId(null);
    }
  }

  async function handleCommentSubmit(ticketId: string) {
    const message = (commentDrafts[ticketId] || "").trim();

    if (!message) {
      setNotice({
        type: "error",
        title: "Comentário vazio",
        message: "Digite um comentário antes de enviar.",
      });
      return;
    }

    try {
      setCommentingTicketId(ticketId);

      await api.post(`/tickets/${ticketId}/comments`, { message });

      setCommentDrafts((current) => ({
        ...current,
        [ticketId]: "",
      }));

      setNotice({
        type: "success",
        title: "Comentário adicionado",
        message: "A atualização foi registrada no chamado.",
      });

      await loadTickets({ silent: true });
      setExpandedTicketId(ticketId);
    } catch (error) {
      console.error(error);
      setNotice({
        type: "error",
        title: "Falha ao comentar",
        message: buildErrorMessage(
          error,
          "Não foi possível registrar o comentário agora."
        ),
      });
    } finally {
      setCommentingTicketId(null);
    }
  }

  function toggleExpanded(ticketId: string) {
    setExpandedTicketId((current) => (current === ticketId ? null : ticketId));
  }

  if (loading) {
    return (
      <section className="tickets-page tickets-page--loading">
        <SkeletonBlock className="tickets-loading-hero" />
        <div className="tickets-loading-grid">
          <SkeletonBlock className="tickets-loading-card" />
          <SkeletonBlock className="tickets-loading-card" />
          <SkeletonBlock className="tickets-loading-card" />
          <SkeletonBlock className="tickets-loading-card" />
        </div>
        <SkeletonBlock className="tickets-loading-panel" />
        <SkeletonBlock className="tickets-loading-panel" />
      </section>
    );
  }

  return (
    <section className="tickets-page">
      <PageHero
        eyebrow="Central de suporte"
        title="Fila operacional de chamados"
        description="Acompanhe incidentes, mova status com clareza e registre contexto útil para manter a operação viva, rastreável e organizada."
        chips={["Fluxo de suporte", "Histórico comentado", "Prioridade visível"]}
        sideEyebrow="Saúde da fila"
        sideBadge={
          <StatusBadge
            label={refreshing ? "Atualizando..." : metricas.health.label}
            tone={metricas.health.tone}
          />
        }
        sideDescription={metricas.health.text}
        miniStats={[
          { label: "Total", value: metricas.total },
          { label: "Abertos", value: metricas.open },
          { label: "Resolvidos", value: metricas.resolved },
        ]}
      />

      {notice ? (
        <NoticeBanner
          type={notice.type}
          title={notice.title}
          message={notice.message}
          onClose={() => setNotice(null)}
        />
      ) : null}

      <section className="tickets-stats-grid">
        <StatCard
          label="Abertos"
          value={metricas.open}
          description="Chamados aguardando resposta ou início de atendimento."
        />

        <StatCard
          label="Em andamento"
          value={metricas.inProgress}
          description="Itens sendo tratados pela operação neste momento."
        />

        <StatCard
          label="Aguardando"
          value={metricas.waiting}
          description="Chamados esperando retorno para seguir no fluxo."
        />

        <StatCard
          label="Críticos"
          value={metricas.critical}
          description="Itens com prioridade máxima dentro da fila."
        />
      </section>

      <div className="tickets-layout">
        <PanelCard
          eyebrow="Novo chamado"
          title="Abrir solicitação"
          subtitle="Registre o problema com clareza para acelerar a resposta da operação."
        >
          <form className="tickets-form" onSubmit={handleCreateTicket}>
            <Field label="Título">
              <Input
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="Ex.: Internet lenta no setor comercial"
                required
              />
            </Field>

            <Field label="Descrição">
              <Textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                rows={6}
                placeholder="Explique o problema com o máximo de contexto útil"
                required
              />
            </Field>

            <FormRow>
              <Field label="Categoria">
                <Select
                  value={form.category}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                >
                  {categorias.map((categoria) => (
                    <option key={categoria} value={categoria}>
                      {categoria}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Prioridade">
                <Select
                  value={form.priority}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      priority: event.target.value as TicketPriority,
                    }))
                  }
                >
                  <option value="LOW">Baixa</option>
                  <option value="MEDIUM">Média</option>
                  <option value="HIGH">Alta</option>
                  <option value="CRITICAL">Crítica</option>
                </Select>
              </Field>
            </FormRow>

            <Button type="submit" disabled={creating} fullWidth>
              {creating ? "Abrindo chamado..." : "Abrir chamado"}
            </Button>
          </form>
        </PanelCard>

        <section className="tickets-main-column">
          <PanelCard
            eyebrow="Painel de atendimento"
            title="Fila de chamados"
            subtitle="Filtre prioridades, acompanhe contexto e mova a fila com mais previsibilidade."
            stacked
          >
            <div className="tickets-toolbar">
              <Field label="Buscar">
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Título, descrição, solicitante ou categoria"
                />
              </Field>

              <Field label="Status">
                <Select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value as "ALL" | TicketStatus)
                  }
                >
                  <option value="ALL">Todos</option>
                  <option value="OPEN">Aberto</option>
                  <option value="IN_PROGRESS">Em andamento</option>
                  <option value="WAITING_RESPONSE">Aguardando resposta</option>
                  <option value="RESOLVED">Resolvido</option>
                  <option value="CLOSED">Fechado</option>
                </Select>
              </Field>

              <Field label="Prioridade">
                <Select
                  value={priorityFilter}
                  onChange={(event) =>
                    setPriorityFilter(
                      event.target.value as "ALL" | TicketPriority
                    )
                  }
                >
                  <option value="ALL">Todas</option>
                  <option value="LOW">Baixa</option>
                  <option value="MEDIUM">Média</option>
                  <option value="HIGH">Alta</option>
                  <option value="CRITICAL">Crítica</option>
                </Select>
              </Field>

              <Button
                type="button"
                variant="ghost"
                onClick={() => loadTickets({ silent: true })}
              >
                Atualizar
              </Button>
            </div>

            <div className="tickets-toolbar__meta">
              <span className="tickets-list-count">
                {ticketsFiltrados.length}{" "}
                {ticketsFiltrados.length === 1 ? "item" : "itens"}
              </span>

              {refreshing ? (
                <span className="tickets-refreshing-text">
                  Sincronizando chamados...
                </span>
              ) : null}
            </div>
          </PanelCard>

          {ticketsFiltrados.length === 0 ? (
            <article className="tickets-empty-state">
              <EmptyState
                eyebrow="Sem chamados"
                title="Nenhum item encontrado"
                description="Ajuste os filtros ou abra um novo chamado para iniciar a fila de atendimento."
              />
            </article>
          ) : (
            <div className="tickets-list">
              {ticketsFiltrados.map((ticket) => {
                const isBusy = activeTicketId === ticket.id;
                const isCommenting = commentingTicketId === ticket.id;
                const isExpanded = expandedTicketId === ticket.id;

                return (
                  <article className="ticket-card" key={ticket.id}>
                    <div className="ticket-card__header">
                      <div className="ticket-card__title-block">
                        <div className="ticket-card__title-row">
                          <h2>{ticket.title}</h2>
                          <span className="ticket-card__date">
                            {formatarData(ticket.createdAt)}
                          </span>
                        </div>

                        <p className="ticket-card__meta">
                          {ticket.user.name} • {ticket.user.email} •{" "}
                          {ticket.category}
                        </p>
                      </div>

                      <div className="ticket-card__badges">
                        <PriorityBadge
                          label={traduzirPrioridade(ticket.priority)}
                          tone={mapPriorityTone(ticket.priority)}
                        />

                        <StatusBadge
                          label={traduzirStatus(ticket.status)}
                          tone={mapStatusTone(ticket.status)}
                        />
                      </div>
                    </div>

                    <p className="ticket-card__description">
                      {ticket.description}
                    </p>

                    <div className="ticket-card__details">
                      <div className="ticket-card__detail">
                        <small>Status atual</small>
                        <strong>{traduzirStatus(ticket.status)}</strong>
                      </div>

                      <div className="ticket-card__detail">
                        <small>Prioridade</small>
                        <strong>{traduzirPrioridade(ticket.priority)}</strong>
                      </div>

                      <div className="ticket-card__detail">
                        <small>Comentários</small>
                        <strong>{ticket.comments.length}</strong>
                      </div>
                    </div>

                    <div className="ticket-card__actions">
                      {user?.role === "ADMIN" ? (
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            className="tickets-action-button"
                            disabled={isBusy}
                            onClick={() => handleStatusChange(ticket.id, "OPEN")}
                          >
                            {isBusy ? "Movendo..." : "Aberto"}
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            className="tickets-action-button tickets-action-button--info"
                            disabled={isBusy}
                            onClick={() =>
                              handleStatusChange(ticket.id, "IN_PROGRESS")
                            }
                          >
                            {isBusy ? "Movendo..." : "Em andamento"}
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            className="tickets-action-button"
                            disabled={isBusy}
                            onClick={() =>
                              handleStatusChange(ticket.id, "WAITING_RESPONSE")
                            }
                          >
                            {isBusy ? "Movendo..." : "Aguardar resposta"}
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            className="tickets-action-button tickets-action-button--success"
                            disabled={isBusy}
                            onClick={() =>
                              handleStatusChange(ticket.id, "RESOLVED")
                            }
                          >
                            {isBusy ? "Movendo..." : "Resolver"}
                          </Button>

                          <Button
                            type="button"
                            variant="ghost"
                            className="tickets-action-button tickets-action-button--ghost"
                            disabled={isBusy}
                            onClick={() => handleStatusChange(ticket.id, "CLOSED")}
                          >
                            {isBusy ? "Movendo..." : "Fechar"}
                          </Button>
                        </>
                      ) : (
                        <Button
                          type="button"
                          variant="ghost"
                          className="tickets-action-button tickets-action-button--ghost"
                          disabled={isBusy}
                          onClick={() => handleStatusChange(ticket.id, "CLOSED")}
                        >
                          {isBusy ? "Fechando..." : "Fechar meu chamado"}
                        </Button>
                      )}

                      <Button
                        type="button"
                        variant="ghost"
                        className="tickets-action-button tickets-action-button--ghost"
                        onClick={() => toggleExpanded(ticket.id)}
                      >
                        {isExpanded ? "Ocultar detalhes" : "Ver detalhes"}
                      </Button>
                    </div>

                    {isExpanded ? (
                      <div className="ticket-card__expanded">
                        <div className="ticket-comments">
                          <div className="ticket-comments__header">
                            <strong>Histórico do chamado</strong>
                            <span>
                              {ticket.comments.length}{" "}
                              {ticket.comments.length === 1
                                ? "comentário"
                                : "comentários"}
                            </span>
                          </div>

                          {ticket.comments.length === 0 ? (
                            <div className="ticket-comments__empty">
                              Ainda não há comentários neste chamado.
                            </div>
                          ) : (
                            <div className="ticket-comments__list">
                              {ticket.comments.map((comment) => (
                                <div
                                  key={comment.id}
                                  className="ticket-comment-card"
                                >
                                  <div className="ticket-comment-card__top">
                                    <strong>{comment.user.name}</strong>
                                    <span>{formatarData(comment.createdAt)}</span>
                                  </div>
                                  <p>{comment.message}</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="ticket-comment-form">
                          <Field label="Novo comentário">
                            <Textarea
                              rows={4}
                              value={commentDrafts[ticket.id] || ""}
                              onChange={(event) =>
                                setCommentDrafts((current) => ({
                                  ...current,
                                  [ticket.id]: event.target.value,
                                }))
                              }
                              placeholder="Adicione atualização, diagnóstico ou orientação"
                            />
                          </Field>

                          <Button
                            type="button"
                            disabled={isCommenting}
                            onClick={() => handleCommentSubmit(ticket.id)}
                          >
                            {isCommenting
                              ? "Enviando comentário..."
                              : "Adicionar comentário"}
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}