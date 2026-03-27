import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { AdminSnapshot, AdminUser } from "../types";
import "./AdminPage.css";

function traduzirRole(role: string) {
  return role === "ADMIN" ? "Administrador" : "Usuário";
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

function usuarioTemBanAtivo(bannedUntil?: string | null) {
  if (!bannedUntil) {
    return false;
  }

  return new Date(bannedUntil).getTime() > Date.now();
}

function descreverStatusUsuario(user: AdminUser) {
  if (user.isBlocked) {
    return {
      label: "Bloqueado",
      tone: "is-danger",
      extra: "Conta bloqueada manualmente pelo admin",
    };
  }

  if (usuarioTemBanAtivo(user.bannedUntil)) {
    return {
      label: "Ban temporário",
      tone: "is-warning",
      extra: `Até ${formatarData(user.bannedUntil)}`,
    };
  }

  return {
    label: "Ativo",
    tone: "is-success",
    extra: "Acesso liberado",
  };
}

function traduzirAcao(action: string) {
  const map: Record<string, string> = {
    "Admin block": "Bloqueio administrativo",
    "Admin unblock": "Desbloqueio administrativo",
    "Admin temp ban": "Banimento temporário",
    "Admin clear ban": "Remoção de banimento",
    "Admin delete user": "Exclusão de usuário",
  };

  return map[action] || action;
}

export function AdminPage() {
  const [data, setData] = useState<AdminSnapshot | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  async function loadSnapshot() {
    const response = await api.get<AdminSnapshot>("/admin/snapshot");
    setData(response.data);
  }

  useEffect(() => {
    loadSnapshot();
  }, []);

  const usuariosFiltrados = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.users.filter((user) => {
      const status = descreverStatusUsuario(user);

      const bateBusca =
        search.trim() === "" ||
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());

      const bateStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && status.label === "Ativo") ||
        (statusFilter === "BLOCKED" && status.label === "Bloqueado") ||
        (statusFilter === "BANNED" && status.label === "Ban temporário");

      return bateBusca && bateStatus;
    });
  }, [data, search, statusFilter]);

  const metricas = useMemo(() => {
    if (!data) {
      return {
        ativos: 0,
        bloqueados: 0,
        banidos: 0,
        admins: 0,
      };
    }

    const ativos = data.users.filter((user) => !user.isBlocked && !usuarioTemBanAtivo(user.bannedUntil)).length;
    const bloqueados = data.users.filter((user) => user.isBlocked).length;
    const banidos = data.users.filter((user) => usuarioTemBanAtivo(user.bannedUntil)).length;
    const admins = data.users.filter((user) => user.role === "ADMIN").length;

    return { ativos, bloqueados, banidos, admins };
  }, [data]);

  async function aplicarAcao(userId: string, action: "BLOCK" | "UNBLOCK" | "BAN_5_DAYS" | "BAN_30_DAYS" | "CLEAR_BAN") {
    try {
      setBusyUserId(userId);
      await api.patch(`/admin/users/${userId}/access`, { action });
      await loadSnapshot();
    } finally {
      setBusyUserId(null);
    }
  }

  async function excluirUsuario(userId: string) {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir este usuário? Essa ação remove a conta e os dados relacionados."
    );

    if (!confirmed) {
      return;
    }

    try {
      setBusyUserId(userId);
      await api.delete(`/admin/users/${userId}`);
      await loadSnapshot();
    } finally {
      setBusyUserId(null);
    }
  }

  if (!data) {
    return <div className="panel-card">Carregando painel administrativo...</div>;
  }

  return (
    <div className="page-stack admin-page">
      <section className="header-card wow-gradient admin-hero">
        <div className="admin-hero__content">
          <span className="eyebrow">Alto comando</span>
          <h1>Painel administrativo</h1>
          <p className="admin-hero__lead">
            Controle central de usuários, bloqueios, banimentos temporários e visão rápida da base operacional.
          </p>

          <div className="admin-hero__chips">
            <span className="admin-chip">Gestão de acesso</span>
            <span className="admin-chip">Controle de conta</span>
            <span className="admin-chip">Ações críticas centralizadas</span>
          </div>
        </div>

        <aside className="admin-hero__summary">
          <div className="admin-summary-card">
            <span className="admin-summary-card__label">Panorama de acesso</span>

            <div className="admin-summary-card__grid">
              <div>
                <small>Ativos</small>
                <strong>{metricas.ativos}</strong>
              </div>
              <div>
                <small>Bloqueados</small>
                <strong>{metricas.bloqueados}</strong>
              </div>
              <div>
                <small>Banidos</small>
                <strong>{metricas.banidos}</strong>
              </div>
              <div>
                <small>Admins</small>
                <strong>{metricas.admins}</strong>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section className="panel-card admin-users-panel">
        <div className="admin-users-panel__header">
          <div>
            <span className="eyebrow">Controle de usuários</span>
            <h2>Gestão total de acesso</h2>
          </div>

          <span className="admin-users-panel__count">
            {usuariosFiltrados.length} {usuariosFiltrados.length === 1 ? "usuário" : "usuários"}
          </span>
        </div>

        <div className="admin-users-panel__filters">
          <label className="admin-users-panel__search">
            Buscar
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nome ou e-mail"
            />
          </label>

          <label>
            Status
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">Todos</option>
              <option value="ACTIVE">Ativos</option>
              <option value="BLOCKED">Bloqueados</option>
              <option value="BANNED">Banidos</option>
            </select>
          </label>
        </div>

        <div className="admin-users-grid">
          {usuariosFiltrados.map((user) => {
            const status = descreverStatusUsuario(user);

            return (
              <article className="admin-user-card" key={user.id}>
                <div className="admin-user-card__top">
                  <div className="admin-user-card__identity">
                    <div className="admin-user-card__avatar">
                      {user.avatar || user.name.slice(0, 2).toUpperCase()}
                    </div>

                    <div>
                      <h3>{user.name}</h3>
                      <p>{user.email}</p>
                    </div>
                  </div>

                  <div className="admin-user-card__badges">
                    <span className={`admin-user-status ${status.tone}`}>{status.label}</span>
                    <span className="admin-user-role">{traduzirRole(user.role)}</span>
                  </div>
                </div>

                <div className="admin-user-card__meta">
                  <div>
                    <small>Criado em</small>
                    <strong>{formatarData(user.createdAt)}</strong>
                  </div>
                  <div>
                    <small>Detalhe</small>
                    <strong>{status.extra}</strong>
                  </div>
                </div>

                <div className="admin-user-card__actions">
                  {!user.isBlocked ? (
                    <button
                      className="small-button danger"
                      disabled={busyUserId === user.id}
                      onClick={() => aplicarAcao(user.id, "BLOCK")}
                    >
                      Bloquear
                    </button>
                  ) : (
                    <button
                      className="small-button"
                      disabled={busyUserId === user.id}
                      onClick={() => aplicarAcao(user.id, "UNBLOCK")}
                    >
                      Desbloquear
                    </button>
                  )}

                  <button
                    className="small-button"
                    disabled={busyUserId === user.id}
                    onClick={() => aplicarAcao(user.id, "BAN_5_DAYS")}
                  >
                    Ban 5 dias
                  </button>

                  <button
                    className="small-button"
                    disabled={busyUserId === user.id}
                    onClick={() => aplicarAcao(user.id, "BAN_30_DAYS")}
                  >
                    Ban 30 dias
                  </button>

                  <button
                    className="small-button"
                    disabled={busyUserId === user.id}
                    onClick={() => aplicarAcao(user.id, "CLEAR_BAN")}
                  >
                    Remover ban
                  </button>

                  <button
                    className="small-button danger"
                    disabled={busyUserId === user.id}
                    onClick={() => excluirUsuario(user.id)}
                  >
                    Excluir
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="content-grid">
        <div className="panel-card admin-stats-card">
          <div className="panel-title-row">
            <h2>Resumo estrutural</h2>
          </div>

          <div className="admin-stat-list">
            <div className="admin-stat-item">
              <small>Usuários</small>
              <strong>{data.users.length}</strong>
            </div>
            <div className="admin-stat-item">
              <small>Projetos</small>
              <strong>{data.projects.length}</strong>
            </div>
            <div className="admin-stat-item">
              <small>Grupos de chamados</small>
              <strong>{data.ticketsByStatus.length}</strong>
            </div>
            <div className="admin-stat-item">
              <small>Grupos de tarefas</small>
              <strong>{data.tasksByStatus.length}</strong>
            </div>
          </div>
        </div>

        <div className="panel-card admin-activity-card">
          <div className="panel-title-row">
            <h2>Atividade administrativa</h2>
          </div>

          <div className="admin-activity-list">
            {data.activity.map((item) => (
              <article className="admin-activity-item" key={item.id}>
                <strong>{traduzirAcao(item.action)}</strong>
                <p>{item.details}</p>
                <small>
                  {item.user.name} • {formatarData(item.createdAt)}
                </small>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}