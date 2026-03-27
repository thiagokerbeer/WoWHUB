import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BrandLogo } from "./BrandLogo";

export function Layout() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <BrandLogo compact subtitle="Control Center" />
        </div>

        <p className="sidebar-copy">Central operacional para suporte, tarefas e gestão.</p>

        <nav className="nav-links">
          <NavLink to="/app">Dashboard</NavLink>
          <NavLink to="/app/tickets">Chamados</NavLink>
          <NavLink to="/app/tasks">Tarefas</NavLink>
          {user?.role === "ADMIN" && <NavLink to="/app/admin">Admin</NavLink>}
        </nav>

        <div className="profile-card">
          <div className="avatar-circle">
            {user?.avatar || user?.name.slice(0, 2).toUpperCase()}
          </div>

          <div>
            <strong>{user?.name}</strong>
            <p>{user?.role === "ADMIN" ? "Administrador" : "Operador"}</p>
          </div>
        </div>

        <Link to="/" className="ghost-button">
          Voltar para home
        </Link>

        <button type="button" className="ghost-button" onClick={logout}>
          Sair
        </button>
      </aside>

      <main className="main-panel">
        <Outlet />
      </main>
    </div>
  );
}