import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { BrandLogo } from "./BrandLogo";
import "./PublicShell.css";

type PublicShellProps = {
  children: ReactNode;
  /** Texto da linha secundária do rodapé (ex.: estado de carregamento) */
  footerMeta?: string;
};

export function PublicShell({ children, footerMeta }: PublicShellProps) {
  return (
    <div className="public-shell app-background">
      <header className="public-shell__header">
        <BrandLogo subtitle="WoWHUB" compact />

        <nav className="public-shell__nav" aria-label="Navegação pública">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `public-shell__link${isActive ? " is-active" : ""}`
            }
          >
            Home
          </NavLink>
          <NavLink
            to="/login"
            className={({ isActive }) =>
              `public-shell__link${isActive ? " is-active" : ""}`
            }
          >
            Entrar
          </NavLink>
          <NavLink
            to="/register"
            className={({ isActive }) =>
              `public-shell__link${isActive ? " is-active" : ""}`
            }
          >
            Criar conta
          </NavLink>
        </nav>
      </header>

      <main className="public-shell__main">{children}</main>

      <footer className="public-shell__footer">
        <span className="public-shell__footer-brand">WoWHUB</span>
        <span className="public-shell__footer-meta">
          {footerMeta ?? "Plataforma operacional · demonstração"}
        </span>
      </footer>
    </div>
  );
}
