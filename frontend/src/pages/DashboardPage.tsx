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
      type: "success" | "error";
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
    URGENT: "Urgente",
    CRITICAL: "Crítica",
  };

  return mapa[priority] || priority;
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

function mapPriorityTone(
  priority: string
): "low" | "medium" | "high" | "critical" | "neutral" {
  const mapa: Record<
    string,
    "low" | "medium" | "high" | "critical" | "neutral"
  > = {
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high",
    URGENT: "high",
    CRITICAL: "critical",
  };

  return mapa[priority] || "neutral";
}

function definirSaudeOperacional(data: DashboardData) {
  const cargaAberta = data.metrics.openTickets;
  const execucao = data.metrics.tasksInProgress;

  if (cargaAberta <= 4 && execucao <= 4) {
    return {
      rotulo: "Operação estável",
      descricao:
        "Fila controlada, ritmo consistente e ambiente pronto para absorver novas demandas.",
      tone: "success" as const,
    };
  }

  if (cargaAberta <= 8 && execucao <= 7) {
    return {
      rotulo: "Operação em atenção",
      descricao:
        "O volume está saudável, mas já pede acompanhamento mais próximo para não gerar atraso.",
      tone: "warning" as const,
    };
  }

  return {
    rotulo: "Operação pressionada",
    descricao:
      "A fila cresceu e a execução está intensa. Prioridades e resposta rápida viram foco imediato.",
    tone: "danger" as const,
  };
}

function obterResumoAtividade(action: string) {
  const acao = action.toLowerCase();

  if (acao.includes("login")) {
    return {
      grupo: "Acesso",
      tone: "info" as const,
    };
  }

  if (acao.includes("account") || acao.includes("user")) {
    return {
      grupo: "Usuário",
      tone: "neutral" as const,
    };
  }

  if (acao.includes("ticket") || acao.includes("chamado")) {
    return {
      grupo: "Chamado",
      tone: "warning" as const,
    };
  }

  if (acao.includes("task") || acao.includes("tarefa")) {
    return {
      grupo: "Tarefa",
      tone: "success" as const,
    };
  }

  return {
    grupo: "Sistema",
    tone: "neutral" as const,
  };
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
        title: "Falha ao carregar o painel",
        message:
          "Não foi possível buscar os dados do dashboard agora. Tente novamente em instantes.",
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

  const saudeOperacional = useMemo(() => {
    if (!data) {
      return null;
    }

    return definirSaudeOperacional(data);
  }, [data]);

  const metricas = useMemo(() => {
    if (!data) {
      return null;
    }

    const totalChamadosMonitorados =
      data.metrics.openTickets + data.metrics.resolvedTickets;

    const taxaResolucao =
      totalChamadosMonitorados > 0
        ? Math.round(
            (data.metrics.resolvedTickets / totalChamadosMonitorados) * 100
          )
        : 0;

    return {
      openTickets: data.metrics.openTickets,
      resolvedTickets: data.metrics.resolvedTickets,
      tasksInProgress: data.metrics.tasksInProgress,
      projectsCount: data.metrics.projectsCount,
      usersCount: data.metrics.usersCount,
      resolutionRate: taxaResolucao,
    };
  }, [data]);

  const visaoOperacional = useMemo(() => {
    if (!data) {
      return null;
    }

    const totalChamados =
      data.metrics.openTickets + data.metrics.resolvedTickets;

    const taxaResolucao =
      totalChamados > 0
        ? Math.round((data.metrics.resolvedTickets / totalChamados) * 100)
        : 0;

    const cargaPorUsuario =
      data.metrics.usersCount > 0
        ? (data.metrics.openTickets / data.metrics.usersCount).toFixed(1)
        : "0.0";

    const focoImediato =
      data.metrics.openTickets > data.metrics.tasksInProgress
        ? "Reduzir a fila de chamados e acelerar resposta da operação."
        : "Sustentar a execução das tarefas em andamento sem perder ritmo de atendimento.";

    const capacidadeTexto =
      data.metrics.usersCount >= 6
        ? "Equipe com boa cobertura para distribuir demanda."
        : "Equipe enxuta, exigindo priorização mais disciplinada.";

    return {
      taxaResolucao,
      cargaPorUsuario,
      focoImediato,
      capacidadeTexto,
    };
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

  if (!data || !metricas || !visaoOperacional || !saudeOperacional) {
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
        eyebrow="Central de comando WoWHUB"
        title="Painel operacional"
        description="Visão executiva da operação, com leitura rápida de carga, execução e estabilidade do ambiente."
        chips={[
          "Suporte em andamento",
          "Rotina interna ativa",
          "Ambiente SaaS operacional",
        ]}
        sideEyebrow="Saúde operacional"
        sideBadge={
          <StatusBadge
            label={refreshing ? "Atualizando..." : saudeOperacional.rotulo}
            tone={refreshing ? "info" : saudeOperacional.tone}
          />
        }
        sideDescription={saudeOperacional.descricao}
        miniStats={[
          { label: "Equipe visível", value: metricas.usersCount },
          { label: "Projetos ativos", value: metricas.projectsCount },
          { label: "Fila aberta", value: metricas.openTickets },
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
          value={metricas.openTickets}
          description="Demandas que ainda exigem atenção direta da operação."
        />
        <StatCard
          label="Chamados resolvidos"
          value={metricas.resolvedTickets}
          description={`${metricas.resolutionRate}% de resolução no painel monitorado.`}
        />
        <StatCard
          label="Tarefas em andamento"
          value={metricas.tasksInProgress}
          description="Execução ativa dentro dos projetos e rotinas internas."
        />
        <StatCard
          label="Projetos ativos"
          value={metricas.projectsCount}
          description={`${metricas.usersCount} usuários visíveis no ambiente.`}
        />
      </section>

      <section className="dashboard-summary-grid">
        <PanelCard
          eyebrow="Visão operacional"
          title="Leitura executiva do ambiente"
          subtitle="Um resumo direto da carga atual, capacidade visível e foco imediato da operação."
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
              <span>Foco imediato</span>
              <strong>{visaoOperacional.focoImediato}</strong>
              <p>
                A relação entre chamados abertos e tarefas em execução indica
                onde a atenção precisa estar agora.
              </p>
            </div>

            <div className="dashboard-summary-metric">
              <span>Taxa de resolução</span>
              <strong>{visaoOperacional.taxaResolucao}%</strong>
              <p>
                Percentual de chamados resolvidos dentro do volume monitorado no
                painel.
              </p>
            </div>

            <div className="dashboard-summary-metric">
              <span>Carga por usuário</span>
              <strong>{visaoOperacional.cargaPorUsuario}</strong>
              <p>
                Média de chamados abertos por usuário visível no ambiente
                operacional.
              </p>
            </div>

            <div className="dashboard-summary-metric">
              <span>Capacidade atual</span>
              <strong>{metricas.usersCount} usuários</strong>
              <p>{visaoOperacional.capacidadeTexto}</p>
            </div>
          </div>
        </PanelCard>
      </section>

      <section className="dashboard-feed-grid">
        <PanelCard
          eyebrow="Fila recente"
          title="Chamados recentes"
          subtitle={`${data.tickets.length} ${
            data.tickets.length === 1 ? "item" : "itens"
          } monitorados no painel.`}
          stacked
        >
          {data.tickets.length === 0 ? (
            <EmptyState
              title="Sem chamados recentes"
              description="Os próximos chamados visíveis no ambiente aparecerão aqui."
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
          eyebrow="Execução recente"
          title="Tarefas recentes"
          subtitle={`${data.tasks.length} ${
            data.tasks.length === 1 ? "item" : "itens"
          } em leitura rápida.`}
          stacked
        >
          {data.tasks.length === 0 ? (
            <EmptyState
              title="Sem tarefas recentes"
              description="As próximas tarefas visíveis no dashboard aparecerão aqui."
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
        eyebrow="Fluxo recente"
        title="Atividade da operação"
        subtitle="Leitura rápida do que foi movimentado no ambiente nas ações mais recentes."
        stacked
      >
        {data.recentActivity.length === 0 ? (
          <EmptyState
            title="Sem atividade recente"
            description="As próximas ações relevantes da operação aparecerão aqui."
          />
        ) : (
          <div className="dashboard-activity-list">
            {data.recentActivity.map((activity) => {
              const resumo = obterResumoAtividade(activity.action);

              return (
                <article
                  key={activity.id}
                  className="dashboard-activity-item"
                >
                  <div className="dashboard-activity-item__top">
                    <div className="dashboard-activity-item__badges">
                      <StatusBadge
                        label={resumo.grupo}
                        tone={resumo.tone}
                      />
                    </div>

                    <span className="dashboard-activity-item__date">
                      {formatarData(activity.createdAt)}
                    </span>
                  </div>

                  <strong>{activity.user.name}</strong>
                  <p>{activity.action}</p>
                  <small>{activity.details}</small>
                </article>
              );
            })}
          </div>
        )}
      </PanelCard>
    </section>
  );
}

export default DashboardPage;