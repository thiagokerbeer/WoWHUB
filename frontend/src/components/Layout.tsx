import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { InteractiveBackground } from "./InteractiveBackground";

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout({
      redirectTo: "/login",
      message: "Você saiu da sua conta com sucesso.",
    });
  }

  return (
    <div className="app-shell">
      <InteractiveBackground />

      <aside className="sidebar">
        <div className="sidebar__brand">
          <span className="sidebar__eyebrow">WoWHUB Platform</span>
          <strong>WoWHUB</strong>
        </div>

        <nav className="sidebar__nav">
          <NavLink to="/app" end>
            Dashboard
          </NavLink>

          <NavLink to="/app/tickets">Tickets</NavLink>

          <NavLink to="/app/tasks">Tasks</NavLink>

          {user?.role === "ADMIN" ? (
            <NavLink to="/app/admin">Admin</NavLink>
          ) : null}
        </nav>

        <div className="sidebar__footer">
          <div className="sidebar__user">
            <span className="sidebar__user-name">{user?.name}</span>
            <span className="sidebar__user-role">{user?.role}</span>
          </div>

          <button type="button" className="sidebar__logout" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </aside>

      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}