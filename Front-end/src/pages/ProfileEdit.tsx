// src/pages/ProfileEdit.tsx (MODIFICADO)

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Edit, Link as LinkIcon, Phone, Mail, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../contexts/AuthContext"; // Ajuste o caminho se necessário
import axios from "axios"; // Importe o axios
import { User as AuthUser } from "../contexts/AuthContext"; // Importa a interface User do AuthContext

// Interface local para o formulário, pode ser similar à User do AuthContext
interface UserProfileForm {
  first_name: string; // Usaremos first_name e last_name separados
  last_name: string;
  role: string;
  location: string; // Mapeado de user.country
  website: string;
  phone: string;
  email: string; // Geralmente não editável ou com verificação especial
  avatar: string; // URL da imagem ou base64 para upload
  skills: string[];
}

const ProfileEdit: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    user,
    isLoading: authIsLoading,
    isAuthenticated,
    token,
    updateUserContext,
  } = useAuth();

  const [profile, setProfile] = useState<UserProfileForm>({
    first_name: "",
    last_name: "",
    role: "",
    location: "",
    website: "",
    phone: "",
    email: "",
    avatar: "",
    skills: [],
  });
  const [newSkill, setNewSkill] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Popula o formulário com dados do AuthContext quando 'user' estiver disponível
  useEffect(() => {
    if (user) {
      setProfile({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        location: user.country || "", // Mapeia 'country' para 'location'
        // Estes campos precisam existir na interface User do AuthContext e vir do backend
        role: user.role || "Membro Aegis",
        avatar: user.avatar || "",
        website: user.website || "",
        phone: user.phone || "",
        skills: user.skills || ["Segurança Digital"],
      });
    }
  }, [user]); // Depende do 'user' do AuthContext

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast({
        title: "Erro",
        description: "Autenticação necessária.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }
    setIsSubmitting(true);

    // O payload deve corresponder ao seu schema UserUpdate no backend.
    // Se UserUpdate espera 'first_name', 'last_name', etc.
    const updatePayload = {
      first_name: profile.first_name,
      last_name: profile.last_name,
      country: profile.location, // Mapeia 'location' de volta para 'country' se necessário
      role: profile.role,
      website: profile.website,
      phone: profile.phone,
      skills: profile.skills,
      // Não inclua email se não for editável.
      // Para o avatar: se 'profile.avatar' for uma string base64 nova,
      // você precisará de um endpoint separado para upload de imagem primeiro,
      // que retorne um URL, e então salvar esse URL aqui.
      // Se 'profile.avatar' já é um URL ou não mudou, pode enviar.
      // Por simplicidade, se for base64, o backend precisa tratar.
      avatar: profile.avatar,
    };

    try {
      const response = await axios.put(
        "http://localhost:8000/auth/users/me",
        updatePayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const updatedUserDataFromServer = response.data as AuthUser; // Usa a interface User do AuthContext
      updateUserContext(updatedUserDataFromServer); // Atualiza o usuário no AuthContext

      toast({
        title: "Perfil Atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      });
      // Opcional: navigate('/security-dashboard');
    } catch (error: any) {
      console.error("Erro ao atualizar perfil:", error);
      toast({
        title: "Erro ao Atualizar",
        description:
          error?.response?.data?.detail ||
          "Não foi possível salvar as alterações.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string; // Isso será uma string base64
        setProfile((prev) => ({ ...prev, avatar: result }));
        // NOTA: Salvar uma string base64 diretamente como 'avatar' no payload do handleSubmit
        // requer que seu backend saiba como processar essa string base64,
        // convertê-la em um arquivo de imagem, salvá-la e gerar um URL.
        // Uma abordagem comum é ter um endpoint de upload de imagem separado.
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newSkill.trim()) {
      e.preventDefault();
      if (!profile.skills.includes(newSkill.trim())) {
        setProfile((prev) => ({
          ...prev,
          skills: [...prev.skills, newSkill.trim()],
        }));
        setNewSkill("");
      }
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }));
  };

  if (authIsLoading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-aegis-darker via-black to-aegis-dark flex items-center justify-center text-white">
        Carregando seu perfil...
      </div>
    );
  }
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-aegis-darker via-black to-aegis-dark flex items-center justify-center text-white">
        Acesso negado.{" "}
        <Button onClick={() => navigate("/login")} className="ml-2">
          Login
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-aegis-darker via-black to-aegis-dark flex flex-col items-center p-6 text-white">
      <div className="w-full max-w-3xl">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 hover:bg-white/10"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>

        <div className="relative overflow-hidden w-full h-48 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 rounded-t-xl">
          <div className="absolute bottom-0 w-full h-12 bg-gradient-to-t from-black/50 to-transparent"></div>
        </div>

        <div className="bg-aegis-dark border border-aegis-purple/20 rounded-b-xl p-6 relative">
          <div className="absolute -top-16 left-6">
            <div className="relative group">
              <Avatar className="h-32 w-32 ring-4 ring-aegis-dark">
                {profile.avatar ? (
                  <AvatarImage src={profile.avatar} alt={profile.first_name} />
                ) : (
                  <AvatarFallback className="bg-aegis-purple/30 text-white text-4xl">
                    {profile.first_name
                      ? profile.first_name.charAt(0).toUpperCase()
                      : "U"}
                  </AvatarFallback>
                )}
              </Avatar>
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity">
                <Edit className="h-6 w-6 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleAvatarChange}
                />
              </label>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="pt-20">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="first_name">Nome</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    value={profile.first_name}
                    onChange={handleChange}
                    className="bg-aegis-purple/10 border-aegis-purple/20"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Sobrenome</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    value={profile.last_name}
                    onChange={handleChange}
                    className="bg-aegis-purple/10 border-aegis-purple/20"
                  />
                </div>
                <div>
                  <Label htmlFor="role">Função / Cargo</Label>
                  <Input
                    id="role"
                    name="role"
                    value={profile.role}
                    onChange={handleChange}
                    className="bg-aegis-purple/10 border-aegis-purple/20"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="location">Localização (País)</Label>
                  <Input
                    id="location"
                    name="location"
                    value={profile.location}
                    onChange={handleChange}
                    className="bg-aegis-purple/10 border-aegis-purple/20"
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-aegis-purple/50 h-4 w-4" />
                    <Input
                      id="website"
                      name="website"
                      value={profile.website}
                      onChange={handleChange}
                      className="bg-aegis-purple/10 border-aegis-purple/20 pl-10"
                      placeholder="https://seusite.com"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-aegis-purple/50 h-4 w-4" />
                    <Input
                      id="phone"
                      name="phone"
                      value={profile.phone}
                      onChange={handleChange}
                      className="bg-aegis-purple/10 border-aegis-purple/20 pl-10"
                      placeholder="+55 (00) 00000-0000"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div>
              {" "}
              {/* Email (geralmente não editável ou com fluxo de verificação) */}
              <Label htmlFor="email" className="mt-4 block">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={profile.email}
                className="bg-aegis-purple/5 border-aegis-purple/10 text-white/70 cursor-not-allowed"
                readOnly
                disabled
              />
            </div>

            <div className="mt-6">
              <Label htmlFor="skills">Competências</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.skills.map((skill, index) => (
                  <div
                    key={index}
                    className="bg-aegis-purple/20 px-3 py-1 rounded-full flex items-center"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-2 text-white/70 hover:text-white"
                    >
                      &times;
                    </button>
                  </div>
                ))}
                <div className="relative inline-flex">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={handleAddSkill}
                    placeholder="Adicionar competência..."
                    className="bg-aegis-purple/10 border-aegis-purple/20 min-w-48"
                  />
                </div>
              </div>
              <p className="text-white/50 text-xs mt-1">
                Pressione Enter para adicionar uma competência
              </p>
            </div>

            <div className="mt-8 flex justify-end">
              <Button
                type="submit"
                className="bg-aegis-purple hover:bg-purple-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileEdit;
