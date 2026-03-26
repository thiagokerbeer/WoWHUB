import { useEffect, useState } from "react";
import { api } from "../services/api";
import { AdminSnapshot } from "../types";

function traduzirRole(role: string) {
  return role === "ADMIN" ? "Administrador" : "Usuário";
}

export function AdminPage() {
  const [data, setData] = useState<AdminSnapshot | null>(null);

  useEffect(() => {
    api.get<AdminSnapshot>("/admin/snapshot").then((response) => setData(response.data));
  }, []);

  if (!data) return <div className="panel-card">Carregando painel administrativo...</div>;

  return (
    <div className="page-stack">
      <section className="header-card wow-gradient">
        <div>
          <span className="eyebrow">Alto comando</span>
          <h1>Painel administrativo</h1>
          <p>Usuários, atividade e visão operacional em um único painel premium.</p>
        </div>
      </section>

      <section className="metric-grid">
        <article className="metric-card"><small>Usuários</small><strong>{data.users.length}</strong></article>
        <article className="metric-card"><small>Projetos</small><strong>{data.projects.length}</strong></article>
        <article className="metric-card"><small>Grupos de chamados</small><strong>{data.ticketsByStatus.length}</strong></article>
        <article className="metric-card"><small>Grupos de tarefas</small><strong>{data.tasksByStatus.length}</strong></article>
      </section>

      <section className="content-grid">
        <div className="panel-card">
          <div className="panel-title-row"><h2>Usuários</h2></div>
          <div className="mini-list">
            {data.users.map((user) => (
              <div key={user.id} className="list-row">
                <div>
                  <strong>{user.name}</strong>
                  <p>{user.email}</p>
                </div>
                <span className="pill neutral">{traduzirRole(user.role)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-title-row"><h2>Atividade</h2></div>
          <div className="activity-list">
            {data.activity.map((item) => (
              <div key={item.id} className="activity-item">
                <strong>{item.action}</strong>
                <p>{item.details}</p>
                <small>{item.user.name}</small>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
