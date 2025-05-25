import React, { useState, useRef } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Globe, Camera, Eye, EyeOff } from "lucide-react"; // Eye e EyeOff adicionados
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";

// --- Validação do formulário com Zod ---
const registerSchema = z.object({
  firstName: z.string().min(2, "Nome deve ter no mínimo 2 caracteres"),
  lastName: z.string().min(2, "Sobrenome deve ter no mínimo 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  country: z.string().min(1, "País é obrigatório"),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: "Você deve concordar com os termos",
  }),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formError, setFormError] = useState("");
  const [isFaceCapture, setIsFaceCapture] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const [capturing, setCapturing] = useState(false);
  const [pendingFormValues, setPendingFormValues] =
    useState<RegisterFormValues | null>(null);
  const [showPassword, setShowPassword] = useState(false); // Estado para visibilidade da senha

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      country: "",
      agreeToTerms: false,
    },
  });

  // Função chamada no submit do formulário (tradicional)
  const handleRegister = async (values: RegisterFormValues) => {
    try {
      setFormError("");

      // Os nomes dos campos aqui (first_name, last_name, agree_to_terms)
      // devem corresponder ao que seu backend espera no schema Pydantic.
      // Se o backend espera camelCase (ex: firstName) e usa aliases no Pydantic,
      // então envie em camelCase. Caso contrário, snake_case é o padrão Python.
      const dataToSend = {
        first_name: values.firstName,
        last_name: values.lastName,
        email: values.email,
        password: values.password,
        country: values.country,
        agree_to_terms: values.agreeToTerms,
      };

      await axios.post("http://localhost:8000/auth/register", dataToSend, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      // A criação de perfil local após o registro pode ser opcional
      // se você for redirecionar para o login e o AuthContext cuidar de buscar o perfil.
      const userProfile = {
        name: `${values.firstName} ${values.lastName}`,
        email: values.email,
        role: "Usuário Aegis",
        location: values.country,
        website: "",
        phone: "",
        avatar: "",
        skills: ["Segurança Digital"],
      };
      localStorage.setItem("userProfile", JSON.stringify(userProfile));
      localStorage.setItem("userEmail", values.email); // Também opcional com AuthContext

      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Bem-vindo ao Aegis Security. Faça login para continuar.",
      });

      navigate("/login"); // Redireciona para login após cadastro
    } catch (error: any) {
      // Especificar 'any' ou um tipo de erro mais específico
      console.error("Erro ao fazer cadastro:", error);
      const detail = error?.response?.data?.detail;
      setFormError(
        detail ||
          "Erro ao fazer cadastro. Verifique seus dados e tente novamente."
      );
      toast({
        title: "Erro ao fazer cadastro",
        description: detail || "Verifique seus dados e tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Câmera e integração facial
  const openCamera = async (values: RegisterFormValues) => {
    setCameraError("");
    setCapturing(true);
    setIsFaceCapture(true);
    setPendingFormValues(values);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      setCameraError("Não foi possível acessar a câmera.");
      setCapturing(false);
      setIsFaceCapture(false);
    }
  };

  const stopCamera = () => {
    setIsFaceCapture(false);
    setCapturing(false);
    setPendingFormValues(null);
    if (videoRef.current && videoRef.current.srcObject) {
      (videoRef.current.srcObject as MediaStream)
        .getTracks()
        .forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const captureAndSend = async () => {
    if (!videoRef.current || !pendingFormValues) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        const formData = new FormData();
        formData.append("first_name", pendingFormValues.firstName);
        formData.append("last_name", pendingFormValues.lastName);
        formData.append("email", pendingFormValues.email);
        formData.append("password", pendingFormValues.password);
        formData.append("country", pendingFormValues.country);
        formData.append(
          "agree_to_terms",
          String(pendingFormValues.agreeToTerms)
        );
        formData.append("face_image", blob, "face.jpg");

        await axios.post("http://localhost:8000/auth/register-face", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        toast({
          title: "Cadastro facial realizado com sucesso!",
          description:
            "Bem-vindo ao Aegis Security. Faça login para continuar.",
        });
        stopCamera();
        navigate("/login"); // Redireciona para login após cadastro
      } catch (error: any) {
        // Especificar 'any' ou um tipo de erro mais específico
        const detail = error?.response?.data?.detail;
        toast({
          title: "Erro no cadastro facial",
          description: detail || error.message || "Erro desconhecido",
          variant: "destructive",
        });
        stopCamera();
      }
    }, "image/jpeg");
  };

  return (
    <div className="min-h-screen w-full bg-black flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Fundo com brilho roxo e estrelas */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/2 left-0 w-full h-32 bg-aegis-purple/30 blur-[100px] transform -translate-y-1/2"></div>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.8 + 0.2,
            }}
          />
        ))}
        <div className="absolute top-[15%] right-[10%] text-white/20 transform rotate-12 animate-float">
          <ShieldCheck size={24} />
        </div>
        <div
          className="absolute bottom-[20%] left-[15%] text-white/20 transform -rotate-12 animate-float"
          style={{ animationDelay: "1s" }}
        >
          <ShieldCheck size={32} />
        </div>
      </div>
      <div className="w-full max-w-md flex flex-col items-center backdrop-blur-lg bg-black/30 p-8 rounded-2xl border border-white/10 shadow-[0_0_25px_rgba(160,32,240,0.3)] z-10">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-aegis-purple rounded-2xl flex items-center justify-center mb-4 shadow-lg">
          <ShieldCheck className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-2xl font-medium text-white mb-2">Cadastro Aegis</h1>
        <p className="text-white/60 text-center mb-8 text-sm">
          Registre-se para ter seus dados protegidos pela tecnologia Aegis
          Security
        </p>
        {formError && (
          <div className="w-full bg-red-500/20 border border-red-500/50 rounded-md p-3 mb-4">
            <p className="text-red-400 text-sm">{formError}</p>
          </div>
        )}

        {isFaceCapture ? (
          <div className="w-full flex flex-col items-center">
            <div className="w-64 h-64 relative mb-8">
              <video
                ref={videoRef}
                width={256}
                height={256}
                className="rounded-lg border-2 border-aegis-purple"
                autoPlay
                muted
                playsInline
                style={{
                  display: capturing ? "block" : "none",
                  objectFit: "cover",
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Camera className="h-24 w-24 text-aegis-purple/70 animate-pulse" />
              </div>
            </div>
            {cameraError && (
              <p className="text-red-400 text-center mb-4">{cameraError}</p>
            )}
            <div className="flex flex-row gap-4">
              <Button
                onClick={captureAndSend}
                className="bg-aegis-purple text-white"
                disabled={!capturing}
              >
                Capturar e Cadastrar
              </Button>
              <Button
                onClick={stopCamera}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Form {...registerForm}>
              <form
                onSubmit={registerForm.handleSubmit(handleRegister)}
                className="w-full space-y-4"
              >
                {/* Nome e Sobrenome lado a lado */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={registerForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="Nome"
                            className="bg-white/5 border-white/10 text-white h-12 rounded-md"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="Sobrenome"
                            className="bg-white/5 border-white/10 text-white h-12 rounded-md"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Email"
                          className="bg-white/5 border-white/10 text-white h-12 rounded-md"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                {/* CAMPO DE SENHA MODIFICADO */}
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"} // Tipo dinâmico
                            placeholder="Senha"
                            className="bg-white/5 border-white/10 text-white h-12 rounded-md pr-10" // Espaço para o ícone
                            {...field}
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <Button
                              variant="ghost"
                              type="button" // Previne submit do formulário
                              size="icon"
                              className="h-8 w-8 text-white/70 hover:text-white focus-visible:ring-0 focus-visible:ring-offset-0"
                              onClick={() => setShowPassword(!showPassword)} // Alterna visibilidade
                            >
                              {showPassword ? (
                                <EyeOff size={18} /> // Ícone para ocultar
                              ) : (
                                <Eye size={18} /> // Ícone para mostrar
                              )}
                            </Button>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                {/* FIM DO CAMPO DE SENHA MODIFICADO */}
                <FormField
                  control={registerForm.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="País"
                            className="bg-white/5 border-white/10 text-white h-12 rounded-md"
                            {...field}
                          />
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50">
                            <Globe size={16} />
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="agreeToTerms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-aegis-purple data-[state=checked]:border-aegis-purple"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm text-white/70">
                          Eu concordo com os{" "}
                          <a href="#" className="text-aegis-purple underline">
                            Termos de Serviço
                          </a>{" "}
                          e{" "}
                          <a href="#" className="text-aegis-purple underline">
                            Políticas de Privacidade
                          </a>{" "}
                          da Aegis Security
                        </FormLabel>
                        <FormMessage className="text-red-400" />
                      </div>
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-aegis-purple to-blue-500 text-white h-12 rounded-md mt-4 hover:opacity-90"
                >
                  CADASTRAR
                </Button>
                <Button
                  type="button"
                  className="w-full mt-2 bg-transparent border border-aegis-purple/60 text-white h-12 rounded-md hover:bg-aegis-purple/10 flex items-center justify-center gap-2"
                  onClick={registerForm.handleSubmit(openCamera)}
                >
                  <Camera size={18} />
                  CADASTRAR COM RECONHECIMENTO FACIAL
                </Button>
              </form>
            </Form>
            <div className="mt-8 text-center">
              <p className="text-white/60 text-sm">
                Já possui conta?{" "}
                <Button
                  onClick={() => navigate("/login")}
                  variant="link"
                  className="text-aegis-purple p-0 h-auto text-sm font-medium ml-1"
                >
                  Entre aqui
                </Button>
              </p>
            </div>
          </>
        )}
      </div>
      {/* Animações CSS */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @keyframes float {
            0% { transform: translateY(0px) rotate(12deg); }
            50% { transform: translateY(-10px) rotate(12deg); }
            100% { transform: translateY(0px) rotate(12deg); }
          }
          .animate-float {
            animation: float 5s ease-in-out infinite;
          }
        `,
        }}
      />
    </div>
  );
};

export default Register;
