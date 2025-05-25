// src/components/ProtectedRoute.tsx
import React, { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext"; // Ajuste o caminho se necessário

interface ProtectedRouteProps {
  children: ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth(); // Adicionei user para o log
  const location = useLocation();

  console.log("[ProtectedRoute] Path:", location.pathname); // Para saber qual rota está sendo verificada
  console.log("[ProtectedRoute] isLoading:", isLoading);
  console.log("[ProtectedRoute] isAuthenticated:", isAuthenticated);
  console.log("[ProtectedRoute] User:", user); // Para ver se o usuário está carregado

  if (isLoading) {
    console.log("[ProtectedRoute] Ainda carregando autenticação...");
    return <div>Verificando autenticação...</div>;
  }

  if (!isAuthenticated) {
    console.log("[ProtectedRoute] Não autenticado! Redirecionando para /login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log("[ProtectedRoute] Autenticado! Renderizando children.");
  return children;
};

export default ProtectedRoute;
