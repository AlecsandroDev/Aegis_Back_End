import React, { useEffect, useState, useRef } from "react"; // Adicionado useRef
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Importe o axios
import { useAuth } from "../contexts/AuthContext";

const Welcome = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  // Estados para dados do usuário e texto dinâmico
  const [userData, setUserData] = useState(null);
  const [userFetchError, setUserFetchError] = useState(null);
  const [dynamicFullText, setDynamicFullText] = useState(
    "Olá! Sou o Aegis. Estou aqui para garantir a segurança dos seus dados e proteger sua privacidade."
  );

  // Estados existentes para animação
  const [typedText, setTypedText] = useState("");
  const [typingComplete, setTypingComplete] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  const [eyeShift, setEyeShift] = useState({ x: 0, y: 0 });
  const [faceExpression, setFaceExpression] = useState("neutral");

  // useEffect para buscar dados do usuário
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setUserFetchError("Autenticação necessária. Faça login novamente.");
        // Opcional: redirecionar para a página de login se o token não existir
        // navigate("/login");
        return;
      }

      try {
        const response = await axios.get(
          "http://localhost:8000/auth/users/me",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setUserData(response.data);
        // Atualiza o texto de boas-vindas com o nome do usuário
        // Assumindo que response.data tem um campo first_name
        if (response.data && response.data.first_name) {
          setDynamicFullText(
            `Olá, ${response.data.first_name}! Sou o Aegis. Estou aqui para garantir a segurança dos seus dados e proteger sua privacidade.`
          );
        } else {
          // Fallback se first_name não estiver disponível mas o usuário foi carregado
          setDynamicFullText(
            `Olá! Bem-vindo(a) de volta! Sou o Aegis. Estou aqui para garantir a segurança dos seus dados e proteger sua privacidade.`
          );
        }
      } catch (err) {
        console.error("Erro ao buscar dados do usuário:", err);
        setUserFetchError("Não foi possível carregar os dados do usuário.");
        // Opcional: Lidar com erros específicos, como token expirado
        // if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        //   localStorage.removeItem("token");
        //   navigate("/login");
        // }
      }
    };

    fetchUserData();
  }, [navigate]); // Executa uma vez, ou se navigate mudar (se usado para redirecionamento)

  // useEffect para a animação de digitar texto (agora depende de dynamicFullText)
  useEffect(() => {
    let cancelled = false;
    setTypedText(""); // Reseta o texto digitado quando dynamicFullText muda
    setTypingComplete(false); // Reseta o status de digitação completa

    const typeText = async () => {
      for (let i = 0; i < dynamicFullText.length; i++) {
        if (cancelled) return;
        setTypedText((prev) => prev + dynamicFullText[i]);

        if (Math.random() > 0.6) {
          setIsTalking(true);
          setTimeout(() => setIsTalking(false), Math.random() * 200 + 100);
        }
        if (Math.random() > 0.9) {
          const shift = {
            x: (Math.random() * 2 - 1) * 2,
            y: Math.random() * 2 - 1,
          };
          setEyeShift(shift);
          setTimeout(() => setEyeShift({ x: 0, y: 0 }), 800);
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
      if (!cancelled) {
        setTypingComplete(true);
        setFaceExpression("friendly");
      }
    };

    if (dynamicFullText) {
      // Só inicia a digitação se houver texto
      typeText();
    }

    return () => {
      cancelled = true;
    };
  }, [dynamicFullText]); // Re-executa se dynamicFullText mudar

  // useEffect para o piscar de olhos (mantido como estava)
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, Math.random() * 3000 + 2000);
    return () => clearInterval(blinkInterval);
  }, []);

  // useEffect para expressões faciais após a digitação (mantido como estava)
  useEffect(() => {
    if (typingComplete) {
      const expressionInterval = setInterval(() => {
        const expressions = ["neutral", "friendly", "thoughtful"];
        setFaceExpression(
          expressions[Math.floor(Math.random() * expressions.length)]
        );
        if (Math.random() > 0.7) {
          setEyeShift({
            x: (Math.random() * 2 - 1) * 2,
            y: Math.random() * 2 - 1,
          });
          setTimeout(() => setEyeShift({ x: 0, y: 0 }), 800);
        }
        if (Math.random() > 0.6) {
          setIsTalking(true);
          setTimeout(() => setIsTalking(false), Math.random() * 300 + 100);
        }
      }, 2000);
      return () => clearInterval(expressionInterval);
    }
  }, [typingComplete]);

  const handleNextClick = () => {
    console.log("[WelcomePage] Tentando navegar para /chatbot.");
    console.log("[WelcomePage] isLoading:", isLoading);
    console.log("[WelcomePage] isAuthenticated:", isAuthenticated);
    console.log("[WelcomePage] User:", user);
    navigate("/chatbot");
  };

  // Feedback de carregamento ou erro (opcional, você pode melhorar esta parte)
  if (userFetchError) {
    // Poderia mostrar uma mensagem de erro mais elaborada ou apenas logar
    console.error("User Fetch Error:", userFetchError);
    // Poderia ter um return <div className="text-red-500">{userFetchError}</div>; aqui
  }
  // Se userData ainda não carregou e não há erro, pode mostrar "Carregando..."
  // ou simplesmente deixar a animação de texto padrão rodar até que os dados cheguem e o texto seja atualizado.

  return (
    <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center px-4">
      {/* ... (toda a sua estrutura JSX para a animação do rosto do Aegis permanece a mesma) ... */}
      <div className="relative w-64 h-64 mb-10">
        {/* ... (código da animação do rosto) ... */}
        <div className="absolute w-full h-full rounded-full bg-gradient-to-b from-aegis-purple/40 to-transparent blur-xl animate-pulse"></div>
        <div
          className="absolute w-3/4 h-3/4 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-b from-aegis-purple/60 to-transparent blur-lg animate-pulse"
          style={{ animationDelay: "0.3s" }}
        ></div>
        <div
          className="absolute w-1/2 h-1/2 left-1/2 top-1/2 -translate-x-1/2 -translate_y-1/2 rounded-full bg-gradient-to-b from-aegis-purple/80 to-transparent blur-md animate-pulse"
          style={{ animationDelay: "0.6s" }}
        ></div>

        <div className="absolute w-full h-full flex items-center justify-center">
          <div className="relative w-20 h-20">
            <div
              className={`absolute top-6 left-3 w-3 ${
                isBlinking ? "h-[2px]" : "h-[12px]"
              } bg-white rounded-full transition-all duration-100`}
              style={{
                transform: `translate(${eyeShift.x}px, ${eyeShift.y}px)`,
                opacity: faceExpression === "thoughtful" ? "0.9" : "1",
              }}
            ></div>

            <div
              className={`absolute top-6 right-3 w-3 ${
                isBlinking ? "h-[2px]" : "h-[12px]"
              } bg-white rounded-full transition-all duration-100`}
              style={{
                transform: `translate(${eyeShift.x}px, ${eyeShift.y}px)`,
                opacity: faceExpression === "thoughtful" ? "0.9" : "1",
              }}
            ></div>

            <div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 transition-all duration-150 bg-white"
              style={{
                width: isTalking ? "10px" : "12px",
                height: isTalking ? "3px" : "6px",
                borderRadius:
                  faceExpression === "friendly" ? "0 0 100px 100px" : "100px",
                transform: `translateX(-50%) scale(${
                  isTalking ? "0.9, 0.7" : "1, 1"
                })`,
                opacity: faceExpression === "thoughtful" ? "0.8" : "1",
              }}
            ></div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-md mx-auto text-center mb-10">
        <h1 className="text-3xl font-medium text-aegis-purple mb-2">
          Aegis Security
        </h1>
        {/* Exibe o nome do usuário se carregado, senão pode mostrar um título alternativo ou nada */}
        {userData && userData.first_name && (
          <h2 className="text-2xl text-white mb-3">
            Bem-vindo(a), {userData.first_name}!
          </h2>
        )}
        <p className="text-xl text-white min-h-[6rem] whitespace-pre-wrap">
          {typedText}
          <span
            className={`inline-block w-2 h-5 bg-white ml-1 ${
              typingComplete && !userFetchError // Só pisca se a digitação estiver completa E não houver erro de fetch
                ? "animate-pulse" // Cursor fixo após completar
                : "animate-[blink_1s_step-end_infinite]" // Cursor piscando durante ou se erro
            }`}
          ></span>
        </p>
        {userFetchError && (
          <p className="text-red-400 text-sm mt-2">{userFetchError}</p>
        )}
      </div>

      <Button
        onClick={handleNextClick}
        className="w-full max-w-md bg-aegis-purple hover:bg-aegis-purple/90 text-white rounded-full py-6"
      >
        Prosseguir
      </Button>

      <p className="text-white/60 text-sm mt-6 text-center max-w-md">
        O Aegis utiliza criptografia avançada para proteger seus dados. Suas
        informações nunca são compartilhadas com terceiros.
      </p>
    </div>
  );
};

export default Welcome;
