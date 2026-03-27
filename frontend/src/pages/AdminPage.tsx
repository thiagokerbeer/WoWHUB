import { useEffect, useMemo, useState } from "react";
import { api } from "../services/api";
import { AdminSnapshot, AdminUser } from "../types";
import "./AdminPage.css";

type AccessAction =
  | "BLOCK"
  | "UNBLOCK"
  | "BAN_5_DAYS"
  | "BAN_30_DAYS"
  | "CLEAR_BAN";

type NoticeState = {
  type: "success" | "error";
  message: string;
} | null;

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

function obterLabelBotao(action: AccessAction, isBusy: boolean, isBlocked: boolean) {
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

      const response = await api.get("/admin/snapshot");
      setData(response.data);
    } catch {
      setNotice({
        type: "error",
        message: "Não foi possível carregar o painel administrativo.",
      });
    } finally {
      setIsBootLoading(false);
      setIsRefreshing(false);
    }
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

    const ativos = data.users.filter(
      (user) => !user.isBlocked && !usuarioTemBanAtivo(user.bannedUntil)
    ).length;

    const bloqueados = data.users.filter((user) => user.isBlocked).length;
    const banidos = data.users.filter((user) => usuarioTemBanAtivo(user.bannedUntil)).length;
    const admins = data.users.filter((user) => user.role === "ADMIN").length;

    return {
      ativos,
      bloqueados,
      banidos,
      admins,
    };
  }, [data]);

  async function aplicarAcao(userId: string, action: AccessAction) {
    try {
      setBusyUserId(userId);
      setNotice(null);

      await api.patch(`/admin/users/${userId}/access`, { action });
      await loadSnapshot({ silent: true });

      setNotice({
        type: "success",
        message: traduzirMensagemAcao(action),
      });
    } catch (error: any) {
      setNotice({
        type: "error",
        message:
          error?.response?.data?.message ||
          "Não foi possível concluir a ação administrativa.",
      });
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
      setNotice(null);

      await api.delete(`/admin/users/${userId}`);
      await loadSnapshot({ silent: true });

      setNotice({
        type: "success",
        message: "Usuário excluído com sucesso.",
      });
    } catch (error: any) {
      setNotice({
        type: "error",
        message:
          error?.response?.data?.message || "Não foi possível excluir o usuário.",
      });
    } finally {
      setBusyUserId(null);
    }
  }

  if (isBootLoading) {
    return (
      <div className="admin-page">
        <section className="admin-hero admin-hero--loading">
          <span className="admin-overline">Alto comando</span>
          <h1>Painel administrativo</h1>
          <p>Carregando visão de acesso, usuários e atividade administrativa...</p>
        </section>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="admin-page">
        <section className="admin-empty">
          <span className="admin-overline">Painel indisponível</span>
          <h2>Não foi possível carregar os dados do Admin</h2>
          <p>Tente atualizar novamente para restaurar a visão operacional.</p>

          <button className="admin-action-btn admin-action-btn--primary" onClick={() => loadSnapshot()}>
            Tentar novamente
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <section className="admin-hero">
        <div className="admin-hero__content">
          <span className="admin-overline">Alto comando</span>
          <h1>Painel administrativo</h1>
          <p>
            Controle central de usuários, bloqueios, banimentos temporários e visão
            rápida da base operacional.
          </p>

          <div className="admin-hero__chips">
            <span>Gestão de acesso</span>
            <span>Controle de conta</span>
            <span>Ações críticas centralizadas</span>
          </div>
        </div>

        <div className="admin-hero__metrics">
          <div className="admin-metric-card">
            <span>Ativos</span>
            <strong>{metricas.ativos}</strong>
          </div>

          <div className="admin-metric-card">
            <span>Bloqueados</span>
            <strong>{metricas.bloqueados}</strong>
          </div>

          <div className="admin-metric-card">
            <span>Banidos</span>
            <strong>{metricas.banidos}</strong>
          </div>

          <div className="admin-metric-card">
            <span>Admins</span>
            <strong>{metricas.admins}</strong>
          </div>
        </div>
      </section>

      {notice && (
        <div className={`admin-notice admin-notice--${notice.type}`}>
          <div>
            <strong>{notice.type === "success" ? "Ação concluída" : "Atenção"}</strong>
            <p>{notice.message}</p>
          </div>

          <button onClick={() => setNotice(null)}>Fechar</button>
        </div>
      )}

      <section className="admin-panel">
        <div className="admin-panel__header">
          <div>
            <span className="admin-overline">Controle de usuários</span>
            <h2>Gestão total de acesso</h2>
            <p>
              Visualize status, filtre a base e execute ações administrativas com
              retorno imediato.
            </p>
          </div>

          <div className="admin-panel__header-actions">
            <span className="admin-count-pill">
              {usuariosFiltrados.length} {usuariosFiltrados.length === 1 ? "usuário" : "usuários"}
            </span>

            <button
              className="admin-action-btn admin-action-btn--ghost"
              onClick={() => loadSnapshot({ silent: true })}
              disabled={isRefreshing}
            >
              {isRefreshing ? "Atualizando..." : "Atualizar painel"}
            </button>
          </div>
        </div>

        <div className="admin-filters">
          <div className="admin-field">
            <label htmlFor="admin-search">Buscar</label>
            <input
              id="admin-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nome ou e-mail"
            />
          </div>

          <div className="admin-field admin-field--compact">
            <label htmlFor="admin-status">Status</label>
            <select
              id="admin-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">Todos</option>
              <option value="ACTIVE">Ativos</option>
              <option value="BLOCKED">Bloqueados</option>
              <option value="BANNED">Banidos</option>
            </select>
          </div>
        </div>

        {usuariosFiltrados.length === 0 ? (
          <div className="admin-empty-state">
            <h3>Nenhum usuário encontrado</h3>
            <p>Refine os filtros ou limpe a busca para visualizar toda a base.</p>
          </div>
        ) : (
          <div className="admin-users-grid">
            {usuariosFiltrados.map((user) => {
              const status = descreverStatusUsuario(user);
              const isBusy = busyUserId === user.id;

              return (
                <article className="admin-user-card" key={user.id}>
                  <div className="admin-user-card__top">
                    <div className="admin-user-card__identity">
                      <div className="admin-avatar">
                        {user.avatar || user.name.slice(0, 2).toUpperCase()}
                      </div>

                      <div>
                        <h3>{user.name}</h3>
                        <p>{user.email}</p>
                      </div>
                    </div>

                    <div className="admin-user-card__badges">
                      <span className={`admin-badge admin-badge--${status.tone}`}>
                        {status.label}
                      </span>
                      <span className="admin-badge admin-badge--neutral">
                        {traduzirRole(user.role)}
                      </span>
                    </div>
                  </div>

                  <div className="admin-user-card__details">
                    <div className="admin-detail-box">
                      <span>Criado em</span>
                      <strong>{formatarData(user.createdAt)}</strong>
                    </div>

                    <div className="admin-detail-box">
                      <span>Detalhe</span>
                      <strong>{status.extra}</strong>
                    </div>
                  </div>

                  <div className="admin-user-card__actions">
                    {!user.isBlocked ? (
                      <button
                        className="admin-action-btn admin-action-btn--danger-soft"
                        onClick={() => aplicarAcao(user.id, "BLOCK")}
                        disabled={isBusy}
                      >
                        {obterLabelBotao("BLOCK", isBusy, user.isBlocked)}
                      </button>
                    ) : (
                      <button
                        className="admin-action-btn admin-action-btn--success-soft"
                        onClick={() => aplicarAcao(user.id, "UNBLOCK")}
                        disabled={isBusy}
                      >
                        {obterLabelBotao("UNBLOCK", isBusy, user.isBlocked)}
                      </button>
                    )}

                    <button
                      className="admin-action-btn admin-action-btn--secondary"
                      onClick={() => aplicarAcao(user.id, "BAN_5_DAYS")}
                      disabled={isBusy}
                    >
                      {obterLabelBotao("BAN_5_DAYS", isBusy, user.isBlocked)}
                    </button>

                    <button
                      className="admin-action-btn admin-action-btn--secondary"
                      onClick={() => aplicarAcao(user.id, "BAN_30_DAYS")}
                      disabled={isBusy}
                    >
                      {obterLabelBotao("BAN_30_DAYS", isBusy, user.isBlocked)}
                    </button>

                    <button
                      className="admin-action-btn admin-action-btn--ghost"
                      onClick={() => aplicarAcao(user.id, "CLEAR_BAN")}
                      disabled={isBusy}
                    >
                      {obterLabelBotao("CLEAR_BAN", isBusy, user.isBlocked)}
                    </button>

                    <button
                      className="admin-action-btn admin-action-btn--danger"
                      onClick={() => excluirUsuario(user.id)}
                      disabled={isBusy}
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

      <section className="admin-bottom-grid">
        <div className="admin-summary-card">
          <span className="admin-overline">Resumo estrutural</span>
          <h2>Visão geral do módulo</h2>

          <div className="admin-summary-grid">
            <div>
              <span>Usuários</span>
              <strong>{data.users.length}</strong>
            </div>

            <div>
              <span>Projetos</span>
              <strong>{data.projects.length}</strong>
            </div>

            <div>
              <span>Grupos de chamados</span>
              <strong>{data.ticketsByStatus.length}</strong>
            </div>

            <div>
              <span>Grupos de tarefas</span>
              <strong>{data.tasksByStatus.length}</strong>
            </div>
          </div>
        </div>

        <div className="admin-activity-card">
          <span className="admin-overline">Atividade administrativa</span>
          <h2>Últimos eventos do painel</h2>

          <div className="admin-activity-list">
            {data.activity.length === 0 ? (
              <div className="admin-activity-empty">
                Nenhuma atividade administrativa recente.
              </div>
            ) : (
              data.activity.map((item) => (
                <article className="admin-activity-item" key={item.id}>
                  <div className="admin-activity-item__dot" />

                  <div className="admin-activity-item__content">
                    <strong>{traduzirAcao(item.action)}</strong>
                    <p>{item.details}</p>
                    <span>
                      {item.user.name} • {formatarData(item.createdAt)}
                    </span>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}