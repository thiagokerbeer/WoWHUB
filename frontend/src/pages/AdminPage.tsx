import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import type { AdminSnapshot, AdminUser } from "../types";
import "./AdminPage.css";

type AccessAction =
  | "BLOCK"
  | "UNBLOCK"
  | "BAN_5_DAYS"
  | "BAN_30_DAYS"
  | "CLEAR_BAN";

type NoticeState =
  | {
      type: "success" | "error";
      title: string;
      message: string;
    }
  | null;

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
      tone: "danger",
      extra: "Conta bloqueada manualmente pelo admin",
    };
  }

  if (usuarioTemBanAtivo(user.bannedUntil)) {
    return {
      label: "Ban temporário",
      tone: "warning",
      extra: `Até ${formatarData(user.bannedUntil)}`,
    };
  }

  return {
    label: "Ativo",
    tone: "success",
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

function traduzirMensagemAcao(action: AccessAction) {
  const map: Record<AccessAction, string> = {
    BLOCK: "Usuário bloqueado com sucesso.",
    UNBLOCK: "Usuário desbloqueado com sucesso.",
    BAN_5_DAYS: "Ban de 5 dias aplicado com sucesso.",
    BAN_30_DAYS: "Ban de 30 dias aplicado com sucesso.",
    CLEAR_BAN: "Ban removido com sucesso.",
  };

  return map[action];
}

function obterLabelBotao(
  action: AccessAction,
  isBusy: boolean,
  isBlocked: boolean
) {
  if (!isBusy) {
    switch (action) {
      case "BLOCK":
        return isBlocked ? "Bloqueado" : "Bloquear";
      case "UNBLOCK":
        return "Desbloquear";
      case "BAN_5_DAYS":
        return "Ban 5 dias";
      case "BAN_30_DAYS":
        return "Ban 30 dias";
      case "CLEAR_BAN":
        return "Remover ban";
    }
  }

  switch (action) {
    case "BLOCK":
      return "Bloqueando...";
    case "UNBLOCK":
      return "Desbloqueando...";
    case "BAN_5_DAYS":
      return "Aplicando...";
    case "BAN_30_DAYS":
      return "Aplicando...";
    case "CLEAR_BAN":
      return "Removendo...";
  }
}

function somarAgrupamentos(list: Array<{ _count: { status: number } }>) {
  return list.reduce((total, item) => total + item._count.status, 0);
}

function extrairProjectsCount(snapshot: AdminSnapshot | null) {
  if (!snapshot) {
    return 0;
  }

  const raw = snapshot as unknown as Record<string, unknown>;

  if (typeof raw.projectsCount === "number") {
    return raw.projectsCount;
  }

  if (Array.isArray(raw.projects)) {
    return raw.projects.length;
  }

  return 0;
}

export function AdminPage() {
  const [data, setData] = useState<AdminSnapshot | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [notice, setNotice] = useState<NoticeState>(null);
  const [isBootLoading, setIsBootLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function loadSnapshot(options?: { silent?: boolean }) {
    const silent = options?.silent ?? false;

    try {
      if (silent) {
        setIsRefreshing(true);
      } else {
        setIsBootLoading(true);
      }

      const response = await api.get<AdminSnapshot>("/admin/snapshot");
      setData(response.data);
    } catch (error) {
      console.error(error);
      setNotice({
        type: "error",
        title: "Falha ao carregar o painel",
        message:
          "Não foi possível buscar os dados administrativos agora. Tente novamente.",
      });
    } finally {
      setIsBootLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    loadSnapshot();
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

  const filteredUsers = useMemo(() => {
    if (!data?.users) {
      return [];
    }

    return data.users.filter((user) => {
      const searchValue = search.trim().toLowerCase();

      const matchesSearch =
        searchValue.length === 0 ||
        user.name.toLowerCase().includes(searchValue) ||
        user.email.toLowerCase().includes(searchValue);

      const hasActiveBan = usuarioTemBanAtivo(user.bannedUntil);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && !user.isBlocked && !hasActiveBan) ||
        (statusFilter === "BLOCKED" && user.isBlocked) ||
        (statusFilter === "BANNED" && hasActiveBan) ||
        (statusFilter === "ADMIN" && user.role === "ADMIN");

      return matchesSearch && matchesStatus;
    });
  }, [data?.users, search, statusFilter]);

  const metrics = useMemo(() => {
    const users = data?.users ?? [];
    const activeUsers = users.filter(
      (user) => !user.isBlocked && !usuarioTemBanAtivo(user.bannedUntil)
    ).length;
    const blockedUsers = users.filter((user) => user.isBlocked).length;
    const bannedUsers = users.filter((user) =>
      usuarioTemBanAtivo(user.bannedUntil)
    ).length;
    const adminUsers = users.filter((user) => user.role === "ADMIN").length;

    const openTickets =
      data?.ticketsByStatus?.find((ticket) => ticket.status === "OPEN")?._count
        .status ?? 0;

    const resolvedTickets =
      data?.ticketsByStatus?.find((ticket) => ticket.status === "RESOLVED")
        ?._count.status ?? 0;

    const todoTasks =
      data?.tasksByStatus?.find((task) => task.status === "TODO")?._count
        .status ?? 0;

    const doneTasks =
      data?.tasksByStatus?.find((task) => task.status === "DONE")?._count
        .status ?? 0;

    return {
      totalUsers: users.length,
      activeUsers,
      blockedUsers,
      bannedUsers,
      adminUsers,
      projects: extrairProjectsCount(data),
      openTickets,
      resolvedTickets,
      todoTasks,
      doneTasks,
    };
  }, [data]);

  async function handleAccessAction(userId: string, action: AccessAction) {
    try {
      setBusyUserId(userId);

      await api.patch(`/admin/users/${userId}/access`, { action });

      setNotice({
        type: "success",
        title: "Ação aplicada",
        message: traduzirMensagemAcao(action),
      });

      await loadSnapshot({ silent: true });
    } catch (error) {
      console.error(error);
      setNotice({
        type: "error",
        title: "Não foi possível concluir a ação",
        message:
          "A alteração de acesso falhou. Verifique sua sessão e tente novamente.",
      });
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleDeleteUser(user: AdminUser) {
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir o usuário "${user.name}"? Essa ação não pode ser desfeita.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setBusyUserId(user.id);

      await api.delete(`/admin/users/${user.id}`);

      setNotice({
        type: "success",
        title: "Usuário removido",
        message: `${user.name} foi excluído com sucesso.`,
      });

      await loadSnapshot({ silent: true });
    } catch (error) {
      console.error(error);
      setNotice({
        type: "error",
        title: "Falha ao excluir usuário",
        message:
          "Não foi possível remover este usuário agora. Tente novamente em instantes.",
      });
    } finally {
      setBusyUserId(null);
    }
  }

  if (isBootLoading) {
    return (
      <section className="admin-page admin-page--loading">
        <div className="admin-loading-hero shimmer" />
        <div className="admin-loading-grid">
          <div className="admin-loading-card shimmer" />
          <div className="admin-loading-card shimmer" />
          <div className="admin-loading-card shimmer" />
          <div className="admin-loading-card shimmer" />
        </div>
        <div className="admin-loading-panel shimmer" />
        <div className="admin-loading-panel shimmer" />
      </section>
    );
  }

  if (!data) {
    return (
      <section className="admin-empty-state">
        <div className="admin-empty-state__card">
          <span className="admin-chip admin-chip--danger">
            Painel indisponível
          </span>
          <h1>Não foi possível carregar a central administrativa</h1>
          <p>
            O ambiente não conseguiu buscar os dados do painel. Tente novamente
            para restaurar a leitura operacional.
          </p>
          <button
            type="button"
            className="admin-primary-button"
            onClick={() => loadSnapshot()}
          >
            Tentar novamente
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="admin-page">
      <header className="admin-hero">
        <div className="admin-hero__content">
          <span className="admin-eyebrow">Central administrativa WoWHUB</span>
          <h1>Controle de usuários e saúde operacional</h1>
          <p>
            Gerencie permissões, bloqueios e banimentos com leitura rápida do
            ambiente e resposta mais segura sobre o acesso à plataforma.
          </p>

          <div className="admin-hero__chips">
            <span className="admin-chip">Gestão de acesso</span>
            <span className="admin-chip">Monitoramento rápido</span>
            <span className="admin-chip">Operação protegida</span>
          </div>
        </div>

        <div className="admin-hero__sidecard">
          <div className="admin-hero__sidecard-top">
            <span className="admin-eyebrow">Panorama atual</span>
            {isRefreshing ? (
              <span className="admin-status-badge admin-status-badge--info">
                Atualizando...
              </span>
            ) : (
              <span className="admin-status-badge admin-status-badge--success">
                Sincronizado
              </span>
            )}
          </div>

          <p>
            Usuários ativos, fluxo administrativo e disciplina operacional
            concentrados em um único painel.
          </p>

          <div className="admin-hero__mini-grid">
            <div className="admin-mini-stat">
              <span>Total de usuários</span>
              <strong>{metrics.totalUsers}</strong>
            </div>
            <div className="admin-mini-stat">
              <span>Admins</span>
              <strong>{metrics.adminUsers}</strong>
            </div>
            <div className="admin-mini-stat">
              <span>Projetos</span>
              <strong>{metrics.projects}</strong>
            </div>
          </div>
        </div>
      </header>

      {notice ? (
        <div
          className={`admin-notice admin-notice--${notice.type}`}
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

      <section className="admin-stats-grid">
        <article className="admin-stat-card">
          <span className="admin-stat-card__label">Usuários ativos</span>
          <strong>{metrics.activeUsers}</strong>
          <p>Acesso normal e sem banimento temporário ativo.</p>
        </article>

        <article className="admin-stat-card">
          <span className="admin-stat-card__label">Bloqueados</span>
          <strong>{metrics.blockedUsers}</strong>
          <p>Contas com bloqueio manual no ambiente.</p>
        </article>

        <article className="admin-stat-card">
          <span className="admin-stat-card__label">Banimentos ativos</span>
          <strong>{metrics.bannedUsers}</strong>
          <p>Usuários com restrição temporária em vigor.</p>
        </article>

        <article className="admin-stat-card">
          <span className="admin-stat-card__label">Projetos ativos</span>
          <strong>{metrics.projects}</strong>
          <p>Estruturas vivas dentro do ambiente SaaS.</p>
        </article>
      </section>

      <section className="admin-summary-grid">
        <article className="admin-panel-card">
          <div className="admin-panel-card__header">
            <div>
              <span className="admin-eyebrow">Leitura operacional</span>
              <h2>Visão executiva do ambiente</h2>
            </div>
            <button
              type="button"
              className="admin-ghost-button"
              onClick={() => loadSnapshot({ silent: true })}
            >
              Atualizar painel
            </button>
          </div>

          <div className="admin-summary-metrics">
            <div className="admin-summary-metric">
              <span>Chamados monitorados</span>
              <strong>{somarAgrupamentos(data.ticketsByStatus ?? [])}</strong>
            </div>
            <div className="admin-summary-metric">
              <span>Chamados abertos</span>
              <strong>{metrics.openTickets}</strong>
            </div>
            <div className="admin-summary-metric">
              <span>Chamados resolvidos</span>
              <strong>{metrics.resolvedTickets}</strong>
            </div>
            <div className="admin-summary-metric">
              <span>Tarefas pendentes</span>
              <strong>{metrics.todoTasks}</strong>
            </div>
            <div className="admin-summary-metric">
              <span>Tarefas concluídas</span>
              <strong>{metrics.doneTasks}</strong>
            </div>
          </div>
        </article>

        <article className="admin-panel-card">
          <div className="admin-panel-card__header">
            <div>
              <span className="admin-eyebrow">Risco e estabilidade</span>
              <h2>Status do acesso</h2>
            </div>
          </div>

          <div className="admin-health-list">
            <div className="admin-health-item">
              <span className="admin-health-item__title">Cobertura ativa</span>
              <strong>{metrics.activeUsers} usuários</strong>
              <p>Base disponível para operar normalmente no ambiente.</p>
            </div>

            <div className="admin-health-item">
              <span className="admin-health-item__title">
                Intervenção manual
              </span>
              <strong>{metrics.blockedUsers + metrics.bannedUsers} contas</strong>
              <p>Volume atual de contas com restrição aplicada.</p>
            </div>

            <div className="admin-health-item">
              <span className="admin-health-item__title">
                Escopo administrativo
              </span>
              <strong>{metrics.adminUsers} administradores</strong>
              <p>Perfis com controle avançado sobre o sistema.</p>
            </div>
          </div>
        </article>
      </section>

      <section className="admin-panel-card">
        <div className="admin-panel-card__header admin-panel-card__header--stacked">
          <div>
            <span className="admin-eyebrow">Gestão de usuários</span>
            <h2>Controle de acesso da plataforma</h2>
            <p className="admin-panel-card__subtitle">
              Filtre perfis, localize contas e aplique ações administrativas com
              feedback imediato.
            </p>
          </div>

          <div className="admin-users-toolbar">
            <label className="admin-input-wrap">
              <span>Buscar</span>
              <input
                type="text"
                placeholder="Nome ou e-mail"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            <label className="admin-input-wrap admin-input-wrap--select">
              <span>Filtro</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="ALL">Todos</option>
                <option value="ACTIVE">Ativos</option>
                <option value="BLOCKED">Bloqueados</option>
                <option value="BANNED">Banidos</option>
                <option value="ADMIN">Admins</option>
              </select>
            </label>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="admin-users-empty">
            <strong>Nenhum usuário encontrado</strong>
            <p>
              Ajuste os filtros ou revise o termo de busca para localizar outra
              conta no ambiente.
            </p>
          </div>
        ) : (
          <div className="admin-users-list">
            {filteredUsers.map((user) => {
              const status = descreverStatusUsuario(user);
              const isBusy = busyUserId === user.id;
              const hasActiveBan = usuarioTemBanAtivo(user.bannedUntil);

              return (
                <article key={user.id} className="admin-user-card">
                  <div className="admin-user-card__top">
                    <div className="admin-user-card__identity">
                      <div className="admin-user-card__avatar">
                        {user.name.slice(0, 1).toUpperCase()}
                      </div>

                      <div>
                        <h3>{user.name}</h3>
                        <p>{user.email}</p>
                      </div>
                    </div>

                    <div className="admin-user-card__badges">
                      <span
                        className={`admin-role-badge ${
                          user.role === "ADMIN"
                            ? "admin-role-badge--admin"
                            : "admin-role-badge--user"
                        }`}
                      >
                        {traduzirRole(user.role)}
                      </span>

                      <span
                        className={`admin-status-badge admin-status-badge--${status.tone}`}
                      >
                        {status.label}
                      </span>
                    </div>
                  </div>

                  <div className="admin-user-card__meta">
                    <div>
                      <span>Status detalhado</span>
                      <strong>{status.extra}</strong>
                    </div>

                    <div>
                      <span>Criado em</span>
                      <strong>{formatarData(user.createdAt)}</strong>
                    </div>

                    <div>
                      <span>Banimento</span>
                      <strong>
                        {hasActiveBan
                          ? formatarData(user.bannedUntil)
                          : "Sem banimento ativo"}
                      </strong>
                    </div>
                  </div>

                  <div className="admin-user-card__actions">
                    <button
                      type="button"
                      className="admin-action-button admin-action-button--danger"
                      disabled={isBusy || user.isBlocked}
                      onClick={() => handleAccessAction(user.id, "BLOCK")}
                    >
                      {obterLabelBotao("BLOCK", isBusy, user.isBlocked)}
                    </button>

                    <button
                      type="button"
                      className="admin-action-button"
                      disabled={isBusy || !user.isBlocked}
                      onClick={() => handleAccessAction(user.id, "UNBLOCK")}
                    >
                      {obterLabelBotao("UNBLOCK", isBusy, user.isBlocked)}
                    </button>

                    <button
                      type="button"
                      className="admin-action-button admin-action-button--warning"
                      disabled={isBusy}
                      onClick={() => handleAccessAction(user.id, "BAN_5_DAYS")}
                    >
                      {obterLabelBotao("BAN_5_DAYS", isBusy, user.isBlocked)}
                    </button>

                    <button
                      type="button"
                      className="admin-action-button admin-action-button--warning"
                      disabled={isBusy}
                      onClick={() => handleAccessAction(user.id, "BAN_30_DAYS")}
                    >
                      {obterLabelBotao("BAN_30_DAYS", isBusy, user.isBlocked)}
                    </button>

                    <button
                      type="button"
                      className="admin-action-button"
                      disabled={isBusy || !hasActiveBan}
                      onClick={() => handleAccessAction(user.id, "CLEAR_BAN")}
                    >
                      {obterLabelBotao("CLEAR_BAN", isBusy, user.isBlocked)}
                    </button>

                    <button
                      type="button"
                      className="admin-action-button admin-action-button--danger-soft"
                      disabled={isBusy}
                      onClick={() => handleDeleteUser(user)}
                    >
                      {isBusy ? "Processando..." : "Excluir"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="admin-activity-grid">
        <article className="admin-panel-card">
          <div className="admin-panel-card__header">
            <div>
              <span className="admin-eyebrow">Atividade recente</span>
              <h2>Últimos eventos administrativos</h2>
            </div>
          </div>

          {data.activity.length === 0 ? (
            <div className="admin-users-empty">
              <strong>Nenhuma atividade registrada</strong>
              <p>As próximas ações do ambiente aparecerão aqui.</p>
            </div>
          ) : (
            <div className="admin-activity-list">
              {data.activity.slice(0, 8).map((log) => (
                <div key={log.id} className="admin-activity-item">
                  <div className="admin-activity-item__line" />
                  <div className="admin-activity-item__content">
                    <strong>{traduzirAcao(log.action)}</strong>
                    <p>{log.details}</p>
                    <span>{formatarData(log.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="admin-panel-card">
          <div className="admin-panel-card__header">
            <div>
              <span className="admin-eyebrow">Distribuição de status</span>
              <h2>Chamados e tarefas</h2>
            </div>
          </div>

          <div className="admin-distribution-grid">
            <div className="admin-distribution-card">
              <span>Chamados</span>

              <ul>
                {data.ticketsByStatus.length === 0 ? (
                  <li>Sem registros</li>
                ) : (
                  data.ticketsByStatus.map((item) => (
                    <li key={item.status}>
                      <strong>{item.status}</strong>
                      <span>{item._count.status}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="admin-distribution-card">
              <span>Tarefas</span>

              <ul>
                {data.tasksByStatus.length === 0 ? (
                  <li>Sem registros</li>
                ) : (
                  data.tasksByStatus.map((item) => (
                    <li key={item.status}>
                      <strong>{item.status}</strong>
                      <span>{item._count.status}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </article>
      </section>
    </section>
  );
}