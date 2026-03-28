import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button, StatusBadge } from "./ui";
import { InteractiveBackground } from "./InteractiveBackground";
import "./Layout.css";

type NavigationItem = {
  to: string;
  label: string;
  shortLabel: string;
  requiresAdmin?: boolean;
};

const navigationItems: NavigationItem[] = [
  {
    to: "/app",
    label: "Dashboard",
    shortLabel: "Painel",
  },
  {
    to: "/app/tickets",
    label: "Tickets",
    shortLabel: "Chamados",
  },
  {
    to: "/app/tasks",
    label: "Tasks",
    shortLabel: "Tarefas",
  },
  {
    to: "/app/admin",
    label: "Admin",
    shortLabel: "Controle",
    requiresAdmin: true,
  },
];

function getRoleLabel(role?: string) {
  return role === "ADMIN" ? "Administrador" : "Usuário";
}

function getRoleTone(role?: string) {
  return role === "ADMIN" ? "info" : "neutral";
}

function getNavLinkClassName(isActive: boolean) {
  return `app-nav__link${isActive ? " active" : ""}`;
}

export function Layout() {
  const { user, logout } = useAuth();

  function handleLogout() {
    logout({
      redirectTo: "/login",
      message: "Você saiu da sua conta com sucesso.",
    });
  }

  const visibleNavigation = navigationItems.filter((item) => {
    if (item.requiresAdmin && user?.role !== "ADMIN") {
      return false;
    }

    return true;
  });

  return (
    <div className="app-shell">
      <InteractiveBackground />

      <aside className="app-sidebar">
        <div className="app-sidebar__top">
          <div className="app-brand">
            <span className="app-brand__eyebrow">WoWHUB Platform</span>
            <strong className="app-brand__title">WoWHUB</strong>
            <p className="app-brand__description">
              Operação, suporte e gestão centralizados em um único ambiente.
            </p>
          </div>

          <div className="app-sidebar__overview">
            <div className="app-sidebar__overview-card">
              <span className="app-sidebar__overview-label">
                Ambiente autenticado
              </span>
              <strong className="app-sidebar__overview-value">
                Área privada ativa
              </strong>
              <p className="app-sidebar__overview-text">
                Navegação protegida com foco em rotina operacional diária.
              </p>
            </div>
          </div>

          <nav className="app-nav" aria-label="Navegação principal">
            {visibleNavigation.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/app"}
                className={({ isActive }) => getNavLinkClassName(isActive)}
              >
                <span className="app-nav__label">{item.label}</span>
                <small className="app-nav__meta">{item.shortLabel}</small>
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="app-sidebar__bottom">
          <div className="app-user-card">
            <div className="app-user-card__header">
              <div className="app-user-card__identity">
                <div className="app-user-card__avatar">
                  {(user?.name ?? "U").slice(0, 1).toUpperCase()}
                </div>

                <div className="app-user-card__content">
                  <span className="app-user-card__name">
                    {user?.name ?? "Usuário"}
                  </span>
                  <span className="app-user-card__email">
                    {user?.email ?? "Sem e-mail visível"}
                  </span>
                </div>
              </div>

              <StatusBadge
                label={getRoleLabel(user?.role)}
                tone={getRoleTone(user?.role)}
              />
            </div>

            <div className="app-user-card__footer">
              <Button type="button" variant="ghost" fullWidth onClick={handleLogout}>
                Sair
              </Button>
            </div>
          </div>
        </div>
      </aside>

      <main className="app-content">
        <div className="app-content__inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Layout;