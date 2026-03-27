import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { DashboardData } from "../types";
import "./DashboardPage.css";

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

function definirSaudeOperacional(data: DashboardData) {
  const cargaAberta = data.metrics.openTickets;
  const execucao = data.metrics.tasksInProgress;

  if (cargaAberta <= 4 && execucao <= 4) {
    return {
      rotulo: "Operação estável",
      descricao: "Fila controlada, ritmo consistente e ambiente pronto para absorver novas demandas.",
      tom: "is-stable",
    };
  }

  if (cargaAberta <= 8 && execucao <= 7) {
    return {
      rotulo: "Operação em atenção",
      descricao: "O volume está saudável, mas já pede acompanhamento mais próximo para não gerar atraso.",
      tom: "is-attention",
    };
  }

  return {
    rotulo: "Operação pressionada",
    descricao: "A fila cresceu e a execução está intensa. Prioridades e resposta rápida viram foco imediato.",
    tom: "is-critical",
  };
}

function obterResumoAtividade(action: string) {
  const acao = action.toLowerCase();

  if (acao.includes("login")) {
    return {
      grupo: "Acesso",
      tom: "is-cyan",
    };
  }

  if (acao.includes("account") || acao.includes("user")) {
    return {
      grupo: "Usuário",
      tom: "is-violet",
    };
  }

  if (acao.includes("ticket") || acao.includes("chamado")) {
    return {
      grupo: "Chamado",
      tom: "is-amber",
    };
  }

  if (acao.includes("task") || acao.includes("tarefa")) {
    return {
      grupo: "Tarefa",
      tom: "is-emerald",
    };
  }

  return {
    grupo: "Sistema",
    tom: "is-neutral",
  };
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    api.get<DashboardData>("/dashboard").then((response) => setData(response.data));
  }, []);

  const saudeOperacional = useMemo(() => {
    if (!data) {
      return null;
    }

    return definirSaudeOperacional(data);
  }, [data]);

  const metricas = useMemo(() => {
    if (!data) {
      return [];
    }

    const totalChamadosMonitorados = data.metrics.openTickets + data.metrics.resolvedTickets;
    const taxaResolucao =
      totalChamadosMonitorados > 0
        ? Math.round((data.metrics.resolvedTickets / totalChamadosMonitorados) * 100)
        : 0;

    return [
      {
        titulo: "Chamados abertos",
        valor: data.metrics.openTickets,
        apoio: "Demandas que ainda exigem atenção direta da operação.",
        destaque: data.metrics.openTickets <= 4 ? "Fluxo controlado" : "Fila exigindo prioridade",
        tom: "is-cyan",
      },
      {
        titulo: "Chamados resolvidos",
        valor: data.metrics.resolvedTickets,
        apoio: "Volume concluído e devolvido como resposta efetiva.",
        destaque: `${taxaResolucao}% de resolução no painel`,
        tom: "is-violet",
      },
      {
        titulo: "Tarefas em andamento",
        valor: data.metrics.tasksInProgress,
        apoio: "Execução ativa dentro dos projetos e rotinas internas.",
        destaque:
          data.metrics.tasksInProgress <= 4 ? "Carga equilibrada" : "Execução intensa no momento",
        tom: "is-amber",
      },
      {
        titulo: "Projetos ativos",
        valor: data.metrics.projectsCount,
        apoio: "Frentes operacionais e estruturas vivas dentro da plataforma.",
        destaque: `${data.metrics.usersCount} usuários visíveis no ambiente`,
        tom: "is-emerald",
      },
    ];
  }, [data]);

  if (!data) {
    return <div className="panel-card">Carregando dashboard...</div>;
  }

  return (
    <div className="page-stack">
      <section className="header-card wow-gradient dashboard-hero">
        <div className="dashboard-hero__content">
          <span className="eyebrow">Central de comando WoWHUB</span>
          <h1>Dashboard operacional</h1>
          <p className="dashboard-hero__lead">
            Visão executiva da operação, com leitura rápida de carga, execução e estabilidade do ambiente.
          </p>

          <div className="dashboard-hero__chips">
            <span className="dashboard-chip">Suporte em andamento</span>
            <span className="dashboard-chip">Rotina interna ativa</span>
            <span className="dashboard-chip">Ambiente SaaS operacional</span>
          </div>
        </div>

        <aside className="dashboard-hero__status">
          <div className="dashboard-status-card">
            <div className="dashboard-status-card__top">
              <span className="dashboard-status-card__label">Saúde operacional</span>
              <span className={`dashboard-status-badge ${saudeOperacional?.tom}`}>
                {saudeOperacional?.rotulo}
              </span>
            </div>

            <p className="dashboard-status-card__text">{saudeOperacional?.descricao}</p>

            <div className="dashboard-status-card__metrics">
              <div>
                <small>Equipe visível</small>
                <strong>{data.metrics.usersCount}</strong>
              </div>

              <div>
                <small>Projetos ativos</small>
                <strong>{data.metrics.projectsCount}</strong>
              </div>

              <div>
                <small>Fila aberta</small>
                <strong>{data.metrics.openTickets}</strong>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section className="dashboard-metrics-grid">
        {metricas.map((metrica) => (
          <article key={metrica.titulo} className={`dashboard-kpi-card ${metrica.tom}`}>
            <div className="dashboard-kpi-card__glow" />

            <div className="dashboard-kpi-card__top">
              <div>
                <span className="dashboard-kpi-card__eyebrow">Indicador central</span>
                <h3>{metrica.titulo}</h3>
              </div>

              <span className="dashboard-kpi-card__badge">{metrica.destaque}</span>
            </div>

            <div className="dashboard-kpi-card__value-row">
              <strong>{metrica.valor}</strong>
            </div>

            <p>{metrica.apoio}</p>
          </article>
        ))}
      </section>

      <section className="content-grid">
        <div className="panel-card">
          <div className="panel-title-row">
            <h2>Chamados recentes</h2>
          </div>

          <div className="mini-list">
            {data.tickets.map((ticket) => (
              <div key={ticket.id} className="list-row">
                <div>
                  <strong>{ticket.title}</strong>
                  <p>
                    {ticket.user.name} • {ticket.category}
                  </p>
                </div>

                <span className={`pill ${ticket.priority.toLowerCase()}`}>
                  {traduzirStatus(ticket.status)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-title-row">
            <h2>Tarefas recentes</h2>
          </div>

          <div className="mini-list">
            {data.tasks.map((task) => (
              <div key={task.id} className="list-row">
                <div>
                  <strong>{task.title}</strong>
                  <p>
                    {task.project.name} • {task.assignee?.name || "Sem responsável"}
                  </p>
                </div>

                <span className="pill neutral">{traduzirStatus(task.status)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel-card dashboard-activity-panel">
        <div className="panel-title-row dashboard-activity-panel__header">
          <div>
            <span className="eyebrow">Fluxo recente</span>
            <h2>Atividade da operação</h2>
          </div>
          <p className="dashboard-activity-panel__copy">
            Leitura rápida do que foi movimentado no ambiente nas ações mais recentes.
          </p>
        </div>

        <div className="dashboard-timeline">
          {data.recentActivity.map((activity, index) => {
            const resumo = obterResumoAtividade(activity.action);

            return (
              <article key={activity.id} className="dashboard-timeline-item">
                <div className="dashboard-timeline-item__rail">
                  <span className={`dashboard-timeline-item__dot ${resumo.tom}`} />
                  {index < data.recentActivity.length - 1 ? (
                    <span className="dashboard-timeline-item__line" />
                  ) : null}
                </div>

                <div className="dashboard-timeline-item__content">
                  <div className="dashboard-timeline-item__top">
                    <span className={`dashboard-timeline-item__tag ${resumo.tom}`}>
                      {resumo.grupo}
                    </span>
                    <span className="dashboard-timeline-item__user">{activity.user.name}</span>
                  </div>

                  <strong>{activity.action}</strong>
                  <p>{activity.details}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}