import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { InteractiveBackground } from "./InteractiveBackground";
import "./Layout.css";

export function Layout() {
  const { user, logout } = useAuth();

  function handleLogout() {
    logout({
      redirectTo: "/login",
      message: "Você saiu da sua conta com sucesso.",
    });
  }

  return (
    <div className="app-shell">
      <InteractiveBackground />

      <aside className="app-sidebar">
        <div className="app-sidebar__top">
          <div className="app-brand">
            <span className="app-brand__eyebrow">WoWHUB Platform</span>
            <strong className="app-brand__title">WoWHUB</strong>
          </div>

          <nav className="app-nav">
            <NavLink to="/app" end className={({ isActive }) => (isActive ? "active" : "")}>
              Dashboard
            </NavLink>

            <NavLink
              to="/app/tickets"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              Tickets
            </NavLink>

            <NavLink
              to="/app/tasks"
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              Tasks
            </NavLink>

            {user?.role === "ADMIN" ? (
              <NavLink
                to="/app/admin"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                Admin
              </NavLink>
            ) : null}
          </nav>
        </div>

        <div className="app-sidebar__bottom">
          <div className="app-user-card">
            <span className="app-user-card__name">{user?.name ?? "Usuário"}</span>
            <span className="app-user-card__role">
              {user?.role === "ADMIN" ? "Administrador" : "Usuário"}
            </span>
          </div>

          <button type="button" className="app-logout-button" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </aside>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}