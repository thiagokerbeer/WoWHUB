import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { DashboardData } from "../types";
import "./DashboardPage.css";

type NoticeState =
  | {
      type: "error";
      title: string;
      message: string;
    }
  | null;

function traduzirStatus(status: string) {
  const mapa: Record<string, string> = {
    OPEN: "Aberto",
    IN_PROGRESS: "Em andamento",
    WAITING_RESPONSE: "Aguardando resposta",
    RESOLVED: "Resolvido",
    CLOSED: "Fechado",
    TODO: "A fazer",
    DOING: "Em execução",
    DONE: "Concluída",
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

function traduzirAcao(action: string) {
  const mapa: Record<string, string> = {
    "Admin block": "Bloqueio administrativo",
    "Admin unblock": "Desbloqueio administrativo",
    "Admin temp ban": "Banimento temporário",
    "Admin clear ban": "Remoção de banimento",
    "Admin delete user": "Exclusão de usuário",
  };

  return mapa[action] || action;
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
  openTickets: number,
  resolvedTickets: number,
  tasksInProgress: number
) {
  if (openTickets === 0 && resolvedTickets === 0 && tasksInProgress === 0) {
    return {
      label: "Painel leve",
      tone: "neutral",
      text: "Ainda não há volume operacional relevante carregado no dashboard.",
    };
  }

  if (resolvedTickets >= openTickets && tasksInProgress <= resolvedTickets) {
    return {
      label: "Operação estável",
      tone: "success",
      text: "Os resolvidos estão sustentando bem o fluxo atual.",
    };
  }

  if (openTickets > resolvedTickets) {
    return {
      label: "Fila pressionada",
      tone: "warning",
      text: "Há mais chamados abertos do que resolvidos no recorte atual.",
    };
  }

  return {
    label: "Ritmo ativo",
    tone: "info",
    text: "O ambiente mostra boa movimentação de execução e atendimento.",
  };
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState<NoticeState>(null);

  async function loadDashboard(options?: { silent?: boolean }) {
    const silent = options?.silent ?? false;

    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get<DashboardData>("/dashboard");
      setData(response.data);
    } catch (error) {
      console.error(error);
      setNotice({
        type: "error",
        title: "Falha ao carregar dashboard",
        message: buildErrorMessage(
          error,
          "Não foi possível buscar o painel operacional agora."
        ),
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboard();
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

  const health = useMemo(() => {
    if (!data) {
      return {
        label: "Carregando",
        tone: "neutral",
        text: "Preparando leitura operacional.",
      };
    }

    return calcularSaude(
      data.metrics.openTickets,
      data.metrics.resolvedTickets,
      data.metrics.tasksInProgress
    );
  }, [data]);

  if (loading) {
    return (
      <section className="dashboard-page dashboard-page--loading">
        <div className="dashboard-loading-hero shimmer" />
        <div className="dashboard-loading-grid">
          <div className="dashboard-loading-card shimmer" />
          <div className="dashboard-loading-card shimmer" />
          <div className="dashboard-loading-card shimmer" />
          <div className="dashboard-loading-card shimmer" />
        </div>
        <div className="dashboard-loading-panel shimmer" />
        <div className="dashboard-loading-panel shimmer" />
      </section>
    );
  }

  if (!data) {
    return (
      <section className="dashboard-empty-state">
        <div className="dashboard-empty-state__card">
          <span className="dashboard-chip dashboard-chip--danger">
            Dashboard indisponível
          </span>
          <h1>Não foi possível carregar a central de comando</h1>
          <p>
            O sistema não conseguiu montar a leitura operacional agora. Tente
            novamente para restaurar o painel.
          </p>
          <button
            type="button"
            className="dashboard-primary-button"
            onClick={() => loadDashboard()}
          >
            Tentar novamente
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-page">
      <header className="dashboard-hero">
        <div className="dashboard-hero__content">
          <span className="dashboard-eyebrow">WoWHUB Command Center</span>
          <h1>Dashboard operacional</h1>
          <p>
            Uma leitura clara do ambiente para tickets, tarefas, usuários,
            projetos e atividade recente, sem poeira de painel genérico.
          </p>

          <div className="dashboard-hero__chips">
            <span className="dashboard-chip">Atendimento</span>
            <span className="dashboard-chip">Execução</span>
            <span className="dashboard-chip">Atividade recente</span>
          </div>
        </div>

        <div className="dashboard-hero__sidecard">
          <div className="dashboard-hero__sidecard-top">
            <span className="dashboard-eyebrow">Saúde do ambiente</span>
            <span
              className={`dashboard-status-badge dashboard-status-badge--${health.tone}`}
            >
              {refreshing ? "Atualizando..." : health.label}
            </span>
          </div>

          <p>{health.text}</p>

          <div className="dashboard-hero__mini-grid">
            <div className="dashboard-mini-stat">
              <span>Usuários</span>
              <strong>{data.metrics.usersCount}</strong>
            </div>
            <div className="dashboard-mini-stat">
              <span>Projetos</span>
              <strong>{data.metrics.projectsCount}</strong>
            </div>
            <div className="dashboard-mini-stat">
              <span>Em execução</span>
              <strong>{data.metrics.tasksInProgress}</strong>
            </div>
          </div>
        </div>
      </header>

      {notice ? (
        <div
          className={`dashboard-notice dashboard-notice--${notice.type}`}
          role="status"
          aria-live="polite"
        >
          <div>
            <strong>{notice.title}</strong>
            <p>{notice.message}</p>
          </div>

          <button type="button" onClick={() => setNotice(null)}>
            ×
          </button>
        </div>
      ) : null}

      <section className="dashboard-stats-grid">
        <article className="dashboard-stat-card">
          <span className="dashboard-stat-card__label">Chamados abertos</span>
          <strong>{data.metrics.openTickets}</strong>
          <p>Volume de solicitações ainda pedindo resposta da operação.</p>
        </article>

        <article className="dashboard-stat-card">
          <span className="dashboard-stat-card__label">Chamados resolvidos</span>
          <strong>{data.metrics.resolvedTickets}</strong>
          <p>Itens concluídos dentro do fluxo de suporte.</p>
        </article>

        <article className="dashboard-stat-card">
          <span className="dashboard-stat-card__label">Tarefas em andamento</span>
          <strong>{data.metrics.tasksInProgress}</strong>
          <p>Execução ativa concentrada na trilha operacional.</p>
        </article>

        <article className="dashboard-stat-card">
          <span className="dashboard-stat-card__label">Projetos ativos</span>
          <strong>{data.metrics.projectsCount}</strong>
          <p>Estruturas vivas sustentando o ambiente SaaS.</p>
        </article>
      </section>

      <section className="dashboard-panel-grid">
        <article className="dashboard-panel-card">
          <div className="dashboard-panel-card__header">
            <div>
              <span className="dashboard-eyebrow">Atendimento recente</span>
              <h2>Chamados recentes</h2>
            </div>

            <button
              type="button"
              className="dashboard-ghost-button"
              onClick={() => loadDashboard({ silent: true })}
            >
              Atualizar painel
            </button>
          </div>

          {data.tickets.length === 0 ? (
            <div className="dashboard-empty-block">
              <strong>Nenhum chamado recente</strong>
              <p>Os próximos tickets criados vão aparecer aqui.</p>
            </div>
          ) : (
            <div className="dashboard-ticket-list">
              {data.tickets.map((ticket) => (
                <article key={ticket.id} className="dashboard-ticket-card">
                  <div className="dashboard-ticket-card__top">
                    <div>
                      <h3>{ticket.title}</h3>
                      <p>
                        {ticket.user.name} • {ticket.category}
                      </p>
                    </div>

                    <div className="dashboard-ticket-card__badges">
                      <span
                        className={`dashboard-priority-badge dashboard-priority-badge--${ticket.priority.toLowerCase()}`}
                      >
                        {traduzirPrioridade(ticket.priority)}
                      </span>

                      <span
                        className={`dashboard-status-badge dashboard-status-badge--${ticket.status.toLowerCase()}`}
                      >
                        {traduzirStatus(ticket.status)}
                      </span>
                    </div>
                  </div>

                  <div className="dashboard-ticket-card__footer">
                    <span>{formatarData(ticket.createdAt)}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>

        <article className="dashboard-panel-card">
          <div className="dashboard-panel-card__header">
            <div>
              <span className="dashboard-eyebrow">Execução recente</span>
              <h2>Tarefas recentes</h2>
            </div>
          </div>

          {data.tasks.length === 0 ? (
            <div className="dashboard-empty-block">
              <strong>Nenhuma tarefa recente</strong>
              <p>As próximas tarefas criadas vão alimentar esta coluna.</p>
            </div>
          ) : (
            <div className="dashboard-task-list">
              {data.tasks.map((task) => (
                <article key={task.id} className="dashboard-task-card">
                  <div className="dashboard-task-card__top">
                    <div>
                      <h3>{task.title}</h3>
                      <p>
                        {task.project.name} •{" "}
                        {task.assignee?.name || "Sem responsável"}
                      </p>
                    </div>

                    <span
                      className={`dashboard-status-badge dashboard-status-badge--${task.status.toLowerCase()}`}
                    >
                      {traduzirStatus(task.status)}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="dashboard-panel-card">
        <div className="dashboard-panel-card__header">
          <div>
            <span className="dashboard-eyebrow">Atividade do ambiente</span>
            <h2>Fluxo recente de atividade</h2>
          </div>
        </div>

        {data.recentActivity.length === 0 ? (
          <div className="dashboard-empty-block">
            <strong>Nenhuma atividade recente</strong>
            <p>As próximas ações operacionais vão aparecer aqui.</p>
          </div>
        ) : (
          <div className="dashboard-activity-list">
            {data.recentActivity.map((activity) => (
              <div key={activity.id} className="dashboard-activity-item">
                <div className="dashboard-activity-item__line" />
                <div className="dashboard-activity-item__content">
                  <strong>{traduzirAcao(activity.action)}</strong>
                  <p>{activity.details}</p>
                  <span>
                    {activity.user.name} • {formatarData(activity.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}