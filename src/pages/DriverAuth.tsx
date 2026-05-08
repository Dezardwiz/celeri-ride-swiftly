import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Bike, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import geleriLogo from "@/assets/geleri-logo.jpeg";

type AuthMode = "choice" | "login" | "signup" | "register-driver";

const DriverAuth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("choice");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [motoModel, setMotoModel] = useState("");
  const [plate, setPlate] = useState("");
  const [document, setDocument] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Login realizado!");
      navigate("/driver");
    }
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motoModel || !plate || !document) {
      toast.error("Preencha todos os campos do veículo");
      return;
    }
    setLoading(true);

    // 1. Create account
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin + "/driver",
      },
    });

    if (authError || !authData.user) {
      toast.error(authError?.message ?? "Erro ao criar conta");
      setLoading(false);
      return;
    }

    // 2. Assign driver role
    await supabase.rpc("assign_driver_role", { _user_id: authData.user.id });

    // 3. Create driver record
    const { error: driverError } = await supabase.from("drivers").insert({
      user_id: authData.user.id,
      moto_model: motoModel,
      plate: plate.toUpperCase(),
      document,
      is_approved: false,
    });

    if (driverError) {
      toast.error("Erro ao registrar mototaxista: " + driverError.message);
    } else {
      toast.success("Cadastro criado! Envie seus documentos para análise.");
      navigate("/driver/onboarding");
    }
    setLoading(false);
  };

  const goBack = () => {
    setMode("choice");
    setEmail("");
    setPassword("");
    setFullName("");
    setPhone("");
    setMotoModel("");
    setPlate("");
    setDocument("");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      {/* Logo */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col items-center">
        <img src={geleriLogo} alt="Celeri" className="h-20 w-20 rounded-2xl" />
        <h1 className="mt-3 font-display text-3xl font-bold uppercase tracking-widest text-foreground">CELERI</h1>
        <div className="mt-2 flex items-center justify-center gap-2">
          <Bike className="h-5 w-5 text-primary" />
          <p className="text-sm font-medium text-primary">Área do Mototaxista</p>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {mode === "choice" && (
          <motion.div
            key="choice"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-sm space-y-4"
          >
            <Button className="w-full gap-3 h-14 text-base" onClick={() => setMode("login")}>
              <Mail className="h-5 w-5" />
              Entrar como Mototaxista
            </Button>
            <Button
              variant="outline"
              className="w-full gap-3 h-14 text-base"
              onClick={() => setMode("signup")}
            >
              <Bike className="h-5 w-5" />
              Cadastrar como Mototaxista
            </Button>
            <p className="pt-4 text-center text-xs text-muted-foreground">
              É passageiro?{" "}
              <button onClick={() => navigate("/auth")} className="text-primary hover:underline">
                Entrar como passageiro
              </button>
            </p>
          </motion.div>
        )}

        {mode === "login" && (
          <motion.form
            key="login"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            onSubmit={handleLogin}
            className="w-full max-w-sm space-y-4"
          >
            <button type="button" onClick={goBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
            <h2 className="font-display text-xl font-semibold text-foreground">Login Mototaxista</h2>
            <Input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12" />
            <Input type="password" placeholder="Senha" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="h-12" />
            <Button type="submit" className="w-full h-12" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Não tem conta?{" "}
              <button type="button" onClick={() => setMode("signup")} className="text-primary hover:underline">
                Cadastre-se
              </button>
            </p>
          </motion.form>
        )}

        {mode === "signup" && (
          <motion.form
            key="signup"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            onSubmit={handleSignup}
            className="w-full max-w-sm space-y-4 max-h-[80vh] overflow-y-auto pb-4"
          >
            <button type="button" onClick={goBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
            <h2 className="font-display text-xl font-semibold text-foreground">Cadastro Mototaxista</h2>

            <p className="text-xs uppercase tracking-wider text-muted-foreground font-display">Dados pessoais</p>
            <Input type="text" placeholder="Nome completo" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="h-12" />
            <Input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-12" />
            <Input type="password" placeholder="Senha (mín. 6 caracteres)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="h-12" />
            <Input type="tel" placeholder="Telefone (opcional)" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12" />

            <p className="text-xs uppercase tracking-wider text-muted-foreground font-display pt-2">Dados do veículo</p>
            <Input type="text" placeholder="CPF / Documento" value={document} onChange={(e) => setDocument(e.target.value)} required className="h-12" />
            <Input type="text" placeholder="Modelo da moto (ex: Honda CG 160)" value={motoModel} onChange={(e) => setMotoModel(e.target.value)} required className="h-12" />
            <Input
              type="text"
              placeholder="Placa (ex: ABC1D23)"
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              required
              maxLength={7}
              className="h-12 uppercase"
            />

            <div className="rounded-lg border border-border bg-card p-3">
              <p className="text-xs text-muted-foreground">
                ⚠️ Após o cadastro, seu perfil será analisado e aprovado por um administrador antes de receber corridas.
              </p>
            </div>

            <Button type="submit" className="w-full h-12" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cadastrar"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Já tem conta?{" "}
              <button type="button" onClick={() => setMode("login")} className="text-primary hover:underline">
                Entrar
              </button>
            </p>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DriverAuth;
