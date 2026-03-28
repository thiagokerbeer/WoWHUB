import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { DashboardData } from "../types";
import {
  EmptyState,
  NoticeBanner,
  PageHero,
  PanelCard,
  PriorityBadge,
  SkeletonBlock,
  StatCard,
  StatusBadge,
} from "../components/ui";
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
      tone: "neutral" as const,
      text: "Ainda não há volume operacional relevante carregado no dashboard.",
    };
  }

  if (resolvedTickets >= openTickets && tasksInProgress <= resolvedTickets) {
    return {
      label: "Operação estável",
      tone: "success" as const,
      text: "Os resolvidos estão sustentando bem o fluxo atual.",
    };
  }

  if (openTickets > resolvedTickets) {
    return {
      label: "Fila pressionada",
      tone: "warning" as const,
      text: "Há mais chamados abertos do que resolvidos no recorte atual.",
    };
  }

  return {
    label: "Ritmo ativo",
    tone: "info" as const,
    text: "O ambiente mostra boa movimentação de execução e atendimento.",
  };
}

function mapStatusTone(status: string) {
  const mapa: Record<string, "success" | "warning" | "info" | "neutral"> = {
    OPEN: "warning",
    IN_PROGRESS: "info",
    WAITING_RESPONSE: "neutral",
    RESOLVED: "success",
    CLOSED: "neutral",
    TODO: "warning",
    DOING: "info",
    DONE: "success",
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
        tone: "neutral" as const,
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
        <SkeletonBlock className="dashboard-loading-hero" />

        <div className="dashboard-loading-grid">
          <SkeletonBlock className="dashboard-loading-card" />
          <SkeletonBlock className="dashboard-loading-card" />
          <SkeletonBlock className="dashboard-loading-card" />
          <SkeletonBlock className="dashboard-loading-card" />
        </div>

        <SkeletonBlock className="dashboard-loading-panel" />
        <SkeletonBlock className="dashboard-loading-panel" />
      </section>
    );
  }

  if (!data) {
    return (
      <section className="dashboard-empty-state">
        <div className="dashboard-empty-state__card">
          <EmptyState
            eyebrow="Dashboard indisponível"
            title="Não foi possível carregar a central de comando"
            description="O sistema não conseguiu montar a leitura operacional agora. Tente novamente para restaurar o painel."
            action={
              <button
                type="button"
                className="dashboard-primary-button"
                onClick={() => loadDashboard()}
              >
                Tentar novamente
              </button>
            }
          />
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-page">
      <PageHero
        eyebrow="WoWHUB Command Center"
        title="Dashboard operacional"
        description="Uma leitura clara do ambiente para tickets, tarefas, usuários, projetos e atividade recente, sem poeira de painel genérico."
        chips={["Atendimento", "Execução", "Atividade recente"]}
        sideEyebrow="Saúde do ambiente"
        sideBadge={
          <StatusBadge
            label={refreshing ? "Atualizando..." : health.label}
            tone={health.tone}
          />
        }
        sideDescription={health.text}
        miniStats={[
          { label: "Usuários", value: data.metrics.usersCount },
          { label: "Projetos", value: data.metrics.projectsCount },
          { label: "Em execução", value: data.metrics.tasksInProgress },
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

      <section className="dashboard-stats-grid">
        <StatCard
          label="Chamados abertos"
          value={data.metrics.openTickets}
          description="Volume de solicitações ainda pedindo resposta da operação."
        />

        <StatCard
          label="Chamados resolvidos"
          value={data.metrics.resolvedTickets}
          description="Itens concluídos dentro do fluxo de suporte."
        />

        <StatCard
          label="Tarefas em andamento"
          value={data.metrics.tasksInProgress}
          description="Execução ativa concentrada na trilha operacional."
        />

        <StatCard
          label="Projetos ativos"
          value={data.metrics.projectsCount}
          description="Estruturas vivas sustentando o ambiente SaaS."
        />
      </section>

      <section className="dashboard-panel-grid">
        <PanelCard
          eyebrow="Atendimento recente"
          title="Chamados recentes"
          action={
            <button
              type="button"
              className="dashboard-ghost-button"
              onClick={() => loadDashboard({ silent: true })}
            >
              Atualizar painel
            </button>
          }
        >
          {data.tickets.length === 0 ? (
            <div className="dashboard-empty-block">
              <EmptyState
                title="Nenhum chamado recente"
                description="Os próximos tickets criados vão aparecer aqui."
              />
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

                  <div className="dashboard-ticket-card__footer">
                    <span>{formatarData(ticket.createdAt)}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </PanelCard>

        <PanelCard eyebrow="Execução recente" title="Tarefas recentes">
          {data.tasks.length === 0 ? (
            <div className="dashboard-empty-block">
              <EmptyState
                title="Nenhuma tarefa recente"
                description="As próximas tarefas criadas vão alimentar esta coluna."
              />
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

                    <StatusBadge
                      label={traduzirStatus(task.status)}
                      tone={mapStatusTone(task.status)}
                    />
                  </div>
                </article>
              ))}
            </div>
          )}
        </PanelCard>
      </section>

      <PanelCard eyebrow="Atividade do ambiente" title="Fluxo recente de atividade">
        {data.recentActivity.length === 0 ? (
          <div className="dashboard-empty-block">
            <EmptyState
              title="Nenhuma atividade recente"
              description="As próximas ações operacionais vão aparecer aqui."
            />
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
      </PanelCard>
    </section>
  );
}