// src/contexts/AuthContext.tsx
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Interface para os dados do usuário
// !! IMPORTANTE !!: Certifique-se que esta interface espelha seu schema UserOut do backend
// e inclui TODOS os campos que você quer usar globalmente (role, avatar, website, phone, skills etc.)
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  country: string;
  role?: string; // Exemplo: Adicionado como opcional
  avatar?: string; // Exemplo: Adicionado como opcional (URL da imagem)
  website?: string;
  phone?: string;
  skills?: string[];
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (newToken: string) => Promise<void>;
  logout: () => void;
  updateUserContext: (updatedUserData: User) => void; // Função para atualizar o usuário no contexto
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token")
  );
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyTokenAndFetchUser = async () => {
      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Se temos um token, tentamos buscar o usuário.
      // Não definimos isLoading aqui porque ele já é true inicialmente,
      // ou foi setado por login() antes do token mudar.
      try {
        const response = await axios.get(
          "http://localhost:8000/auth/users/me",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUser(response.data as User);
      } catch (error) {
        console.error(
          "Falha ao validar token ou buscar usuário no AuthContext:",
          error
        );
        localStorage.removeItem("token");
        setToken(null); // Dispara re-execução do useEffect, que vai cair no 'if (!token)'
        setUser(null); // Limpa o usuário
      } finally {
        setIsLoading(false); // Sempre define isLoading como false após a tentativa
      }
    };

    verifyTokenAndFetchUser();
  }, [token]); // Re-executa se o token mudar

  const login = async (newToken: string) => {
    setIsLoading(true); // Mostra carregando enquanto o token é processado e o usuário é buscado
    localStorage.setItem("token", newToken);
    setToken(newToken);
    // O useEffect acima será disparado para buscar os dados do usuário
  };

  const logout = () => {
    setIsLoading(true); // Pode mostrar um "saindo..." brevemente
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail"); // Se ainda usa
    setToken(null); // Dispara useEffect, que limpará o usuário e setará isLoading = false
    // setUser(null); // O useEffect lida com isso ao token se tornar null
    navigate("/login");
  };

  const updateUserContext = (updatedUserData: User) => {
    setUser(updatedUserData);
    // Se você estava salvando o perfil inteiro no localStorage (não ideal para dados completos),
    // poderia atualizar aqui também, mas é melhor confiar no estado do AuthContext.
    // localStorage.setItem('userProfile', JSON.stringify(updatedUserData));
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !isLoading && !!user && !!token, // Só autenticado se não estiver carregando E tiver user E token
        isLoading,
        login,
        logout,
        updateUserContext,
      }}
    >
      {children}{" "}
      {/* Não envolva children com !isLoading aqui, deixe ProtectedRoute cuidar disso para suas rotas */}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};
