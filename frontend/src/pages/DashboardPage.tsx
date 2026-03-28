import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { DashboardData } from "../types";
import {
  Button,
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

  const taxaResolucao = useMemo(() => {
    if (!data) {
      return 0;
    }

    const total = data.metrics.openTickets + data.metrics.resolvedTickets;

    if (total === 0) {
      return 0;
    }

    return Math.round((data.metrics.resolvedTickets / total) * 100);
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
        <SkeletonBlock className="dashboard-loading-panel" />
      </section>
    );
  }

  if (!data) {
    return (
      <section className="dashboard-empty-state">
        <div className="dashboard-empty-state__card">
          <EmptyState
            eyebrow="Painel indisponível"
            title="Não foi possível carregar o dashboard"
            description="A leitura operacional não pôde ser montada agora. Atualize para tentar novamente."
            action={
              <Button type="button" onClick={() => loadDashboard()}>
                Tentar novamente
              </Button>
            }
          />
        </div>
      </section>
    );
  }

  return (
    <section className="dashboard-page">
      <PageHero
        eyebrow="Central de comando"
        title="Painel operacional"
        description="Acompanhe o recorte atual da operação com leitura rápida de chamados, tarefas, usuários e projetos."
        chips={["Visão executiva", "Fluxo monitorado", "Operação em tempo real"]}
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
          description="Demandas que ainda pedem ação direta da operação."
        />
        <StatCard
          label="Chamados resolvidos"
          value={data.metrics.resolvedTickets}
          description="Volume já estabilizado dentro do recorte atual."
        />
        <StatCard
          label="Tarefas em andamento"
          value={data.metrics.tasksInProgress}
          description="Execução ativa nas rotinas e projetos do ambiente."
        />
        <StatCard
          label="Taxa de resolução"
          value={`${taxaResolucao}%`}
          description="Proporção resolvida entre chamados abertos e concluídos."
        />
      </section>

      <section className="dashboard-summary-grid">
        <PanelCard
          eyebrow="Leitura operacional"
          title="Visão consolidada"
          subtitle="Um recorte direto do que está vivo agora no WoWHUB."
          action={
            <Button
              type="button"
              variant="ghost"
              onClick={() => loadDashboard({ silent: true })}
            >
              Atualizar painel
            </Button>
          }
        >
          <div className="dashboard-summary-metrics">
            <div className="dashboard-summary-metric">
              <span>Chamados abertos</span>
              <strong>{data.metrics.openTickets}</strong>
              <p>Itens que ainda dependem de atendimento ou avanço operacional.</p>
            </div>

            <div className="dashboard-summary-metric">
              <span>Chamados resolvidos</span>
              <strong>{data.metrics.resolvedTickets}</strong>
              <p>Entregas já devolvidas ao fluxo com situação estabilizada.</p>
            </div>

            <div className="dashboard-summary-metric">
              <span>Tarefas em andamento</span>
              <strong>{data.metrics.tasksInProgress}</strong>
              <p>Execuções correndo dentro do ambiente neste momento.</p>
            </div>

            <div className="dashboard-summary-metric">
              <span>Base ativa</span>
              <strong>
                {data.metrics.usersCount} usuários • {data.metrics.projectsCount} projetos
              </strong>
              <p>Escopo atual visível para rotina, suporte e gestão.</p>
            </div>
          </div>
        </PanelCard>
      </section>

      <section className="dashboard-feed-grid">
        <PanelCard
          eyebrow="Chamados recentes"
          title="Fila de suporte"
          subtitle="Últimos itens que entraram ou seguem visíveis no painel."
          stacked
        >
          {data.tickets.length === 0 ? (
            <EmptyState
              title="Sem chamados recentes"
              description="Os próximos chamados monitorados aparecerão aqui."
            />
          ) : (
            <div className="dashboard-feed-list">
              {data.tickets.map((ticket) => (
                <article key={ticket.id} className="dashboard-feed-card">
                  <div className="dashboard-feed-card__top">
                    <div>
                      <h3>{ticket.title}</h3>
                      <p>
                        {ticket.user.name} • {ticket.category}
                      </p>
                    </div>

                    <div className="dashboard-feed-card__badges">
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

                  <div className="dashboard-feed-card__meta">
                    <span>{formatarData(ticket.createdAt)}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </PanelCard>

        <PanelCard
          eyebrow="Tarefas recentes"
          title="Execução em andamento"
          subtitle="Atividades mais recentes visíveis na operação."
          stacked
        >
          {data.tasks.length === 0 ? (
            <EmptyState
              title="Sem tarefas recentes"
              description="As próximas tarefas monitoradas aparecerão aqui."
            />
          ) : (
            <div className="dashboard-feed-list">
              {data.tasks.map((task) => (
                <article key={task.id} className="dashboard-feed-card">
                  <div className="dashboard-feed-card__top">
                    <div>
                      <h3>{task.title}</h3>
                      <p>
                        {task.project.name} •{" "}
                        {task.assignee?.name || "Sem responsável"}
                      </p>
                    </div>

                    <div className="dashboard-feed-card__badges">
                      <StatusBadge
                        label={traduzirStatus(task.status)}
                        tone={mapStatusTone(task.status)}
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </PanelCard>
      </section>

      <PanelCard
        eyebrow="Atividade recente"
        title="Fluxo da operação"
        subtitle="Ações administrativas e movimentações recentes do ambiente."
        stacked
      >
        {data.recentActivity.length === 0 ? (
          <EmptyState
            title="Sem atividade recente"
            description="As próximas ações relevantes aparecerão aqui."
          />
        ) : (
          <div className="dashboard-activity-list">
            {data.recentActivity.map((activity) => (
              <article key={activity.id} className="dashboard-activity-item">
                <div className="dashboard-activity-item__top">
                  <div className="dashboard-activity-item__badges">
                    <StatusBadge
                      label={traduzirAcao(activity.action)}
                      tone="neutral"
                    />
                  </div>

                  <span className="dashboard-activity-item__date">
                    {formatarData(activity.createdAt)}
                  </span>
                </div>

                <strong>{activity.user.name}</strong>
                <p>{activity.details}</p>
                <small>{activity.action}</small>
              </article>
            ))}
          </div>
        )}
      </PanelCard>
    </section>
  );
}

export default DashboardPage;