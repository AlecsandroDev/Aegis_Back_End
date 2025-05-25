import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner"; // Renomeei para evitar conflito de nome se 'Toaster' for usado em outro lugar
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Importações do Contexto de Autenticação e Rota Protegida
import { AuthProvider } from "./contexts/AuthContext"; // Ajuste o caminho se necessário
import ProtectedRoute from "./components/ProtectedRoute"; // Ajuste o caminho se necessário

import { ChatProvider } from "./contexts/ChatContext";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Welcome from "./pages/Welcome";
import Chatbot from "./pages/Chatbot";
import SecurityDashboard from "./pages/SecurityDashboard";
import ProfileEdit from "./pages/ProfileEdit";
import AegisTeam from "./pages/AegisTeam";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        {" "}
        {/* BrowserRouter deve ser um dos mais externos */}
        <AuthProvider>
          {" "}
          {/* AuthProvider envolve as rotas e outros providers que podem depender dele */}
          <ChatProvider>
            {" "}
            {/* ChatProvider pode vir aqui ou dentro de AuthProvider se não depender do auth */}
            <Toaster />
            <Sonner /> {/* Renomeado para Sonner para clareza */}
            <Routes>
              {/* Rotas Públicas */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Rotas Protegidas */}
              <Route
                path="/welcome"
                element={
                  <ProtectedRoute>
                    <Welcome />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chatbot"
                element={
                  <ProtectedRoute>
                    <Chatbot />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/security-dashboard"
                element={
                  <ProtectedRoute>
                    <SecurityDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile-edit"
                element={
                  <ProtectedRoute>
                    <ProfileEdit />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/aegis-team"
                element={
                  <ProtectedRoute>
                    <AegisTeam />
                  </ProtectedRoute>
                }
              />

              {/* Rota de Not Found (Pega Tudo) */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ChatProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
