import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type PublicOnlyRouteProps = {
  children: ReactNode;
};

export function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="auth-status-screen">
        <div className="auth-status-card">
          <span className="eyebrow">WoWHUB Security</span>
          <h1>Verificando sua sessão</h1>
          <p className="body-copy">
            Estamos preparando seu acesso e validando o ambiente seguro da
            plataforma.
          </p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}