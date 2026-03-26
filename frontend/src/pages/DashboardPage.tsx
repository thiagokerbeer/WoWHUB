import { useEffect, useState } from "react";
import { api } from "../services/api";
import { DashboardData } from "../types";

function traduzirStatus(status: string) {
  const mapa: Record<string, string> = {
    OPEN: "Aberto",
    IN_PROGRESS: "Em andamento",
    WAITING_RESPONSE: "Aguardando resposta",
    RESOLVED: "Resolvido",
    CLOSED: "Fechado",
    TODO: "A fazer",
    DOING: "Em execução",
    DONE: "Concluída"
  };

  return mapa[status] || status;
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    api.get<DashboardData>("/dashboard").then((response) => setData(response.data));
  }, []);

  if (!data) return <div className="panel-card">Carregando dashboard...</div>;

  return (
    <div className="page-stack">
      <section className="header-card wow-gradient">
        <div>
          <span className="eyebrow">Central de comando WoWHUB</span>
          <h1>Dashboard operacional</h1>
          <p>Uma visão refinada para suporte, tarefas, atividade recente e impacto de portfólio.</p>
        </div>
      </section>

      <section className="metric-grid">
        <article className="metric-card"><small>Chamados abertos</small><strong>{data.metrics.openTickets}</strong></article>
        <article className="metric-card"><small>Chamados resolvidos</small><strong>{data.metrics.resolvedTickets}</strong></article>
        <article className="metric-card"><small>Tarefas em andamento</small><strong>{data.metrics.tasksInProgress}</strong></article>
        <article className="metric-card"><small>Projetos ativos</small><strong>{data.metrics.projectsCount}</strong></article>
      </section>

      <section className="content-grid">
        <div className="panel-card">
          <div className="panel-title-row"><h2>Chamados recentes</h2></div>
          <div className="mini-list">
            {data.tickets.map((ticket) => (
              <div key={ticket.id} className="list-row">
                <div>
                  <strong>{ticket.title}</strong>
                  <p>{ticket.user.name} • {ticket.category}</p>
                </div>
                <span className={`pill ${ticket.priority.toLowerCase()}`}>{traduzirStatus(ticket.status)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-title-row"><h2>Tarefas recentes</h2></div>
          <div className="mini-list">
            {data.tasks.map((task) => (
              <div key={task.id} className="list-row">
                <div>
                  <strong>{task.title}</strong>
                  <p>{task.project.name} • {task.assignee?.name || "Sem responsável"}</p>
                </div>
                <span className={`pill neutral`}>{traduzirStatus(task.status)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel-card">
        <div className="panel-title-row"><h2>Fluxo de atividades</h2></div>
        <div className="activity-list">
          {data.recentActivity.map((activity) => (
            <div key={activity.id} className="activity-item">
              <strong>{activity.action}</strong>
              <p>{activity.details}</p>
              <small>{activity.user.name}</small>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
