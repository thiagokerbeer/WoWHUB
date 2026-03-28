import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type ProtectedRouteProps = {
  children: ReactNode;
  adminOnly?: boolean;
};

export function ProtectedRoute({
  children,
  adminOnly = false,
}: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="auth-status-screen">
        <div className="auth-status-card">
          <span className="eyebrow">WoWHUB Security</span>
          <h1>Validando sua sessão</h1>
          <p className="body-copy">
            Estamos verificando seu acesso para entrar no ambiente seguro da
            plataforma.
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (adminOnly && user?.role !== "ADMIN") {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}