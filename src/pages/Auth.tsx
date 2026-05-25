import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail, Phone, ArrowLeft, Loader2 } from "lucide-react";
import geleriLogo from "@/assets/geleri-logo.jpeg";

type AuthMode = "choice" | "email-login" | "email-signup" | "phone-login" | "otp-verify";

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("choice");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) toast.error(error.message);else
    toast.success("Login realizado!");
    setLoading(false);
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin
      }
    });
    if (error) toast.error(error.message);else
    toast.success("Conta criada! Verifique seu email.");
    setLoading(false);
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) toast.error(error.message);else
    {
      toast.success("Código enviado!");
      setMode("otp-verify");
    }
    setLoading(false);
  };

  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: "sms" });
    if (error) toast.error(error.message);else
    toast.success("Login realizado!");
    setLoading(false);
  };

  const goBack = () => {
    setMode("choice");
    setEmail("");
    setPassword("");
    setFullName("");
    setPhone("");
    setOtp("");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 flex flex-col items-center">
        
        <img src={geleriLogo} alt="Celeri" className="h-20 w-20 rounded-2xl" />
        <h1 className="mt-3 font-display text-3xl font-bold uppercase tracking-widest text-foreground">
          CELERI
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">Seu destino, sem demora.</p>
      </motion.div>

      <AnimatePresence mode="wait">
        {mode === "choice" &&
        <motion.div
          key="choice"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="w-full max-w-sm space-y-4">
          
            <Button
            className="w-full gap-3 h-14 text-base"
            onClick={() => setMode("email-login")}>
            
              <Mail className="h-5 w-5" />
              Entrar com Email
            </Button>
            <Button
            variant="secondary"
            className="w-full gap-3 h-14 text-base"
            onClick={() => setMode("phone-login")}>
            
              <Phone className="h-5 w-5" />
              Entrar com Telefone
            </Button>
            <p className="pt-4 text-center text-xs text-muted-foreground">
              É mototaxista?{" "}
              <button onClick={() => window.location.href = "/driver/auth"} className="hover:underline text-primary border-0">
                Entrar como mototaxista
              </button>
            </p>
          </motion.div>
        }

        {mode === "email-login" &&
        <motion.form
          key="email-login"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          onSubmit={handleEmailLogin}
          className="w-full max-w-sm space-y-4">
          
            <button type="button" onClick={goBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
            <h2 className="font-display text-xl font-semibold text-foreground">Login com Email</h2>
            <Input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12" />
          
            <Input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="h-12" />
          
            <Button type="submit" className="w-full h-12" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Não tem conta?{" "}
              <button
              type="button"
              onClick={() => setMode("email-signup")}
              className="text-primary hover:underline">
              
                Cadastre-se
              </button>
            </p>
          </motion.form>
        }

        {mode === "email-signup" &&
        <motion.form
          key="email-signup"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          onSubmit={handleEmailSignup}
          className="w-full max-w-sm space-y-4">
          
            <button type="button" onClick={goBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
            <h2 className="font-display text-xl font-semibold text-foreground">Criar Conta</h2>
            <Input
            type="text"
            placeholder="Nome completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="h-12" />
          
            <Input
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-12" />
          
            <Input
            type="password"
            placeholder="Senha (mín. 6 caracteres)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="h-12" />
          
            <Button type="submit" className="w-full h-12" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Criar Conta"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Já tem conta?{" "}
              <button
              type="button"
              onClick={() => setMode("email-login")}
              className="text-primary hover:underline">
              
                Entrar
              </button>
            </p>
          </motion.form>
        }

        {mode === "phone-login" &&
        <motion.form
          key="phone-login"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          onSubmit={handlePhoneLogin}
          className="w-full max-w-sm space-y-4">
          
            <button type="button" onClick={goBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
            <h2 className="font-display text-xl font-semibold text-foreground">Login com Telefone</h2>
            <Input
            type="tel"
            placeholder="+55 11 99999-9999"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="h-12" />
          
            <Button type="submit" className="w-full h-12" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar Código"}
            </Button>
          </motion.form>
        }

        {mode === "otp-verify" &&
        <motion.form
          key="otp-verify"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          onSubmit={handleOtpVerify}
          className="w-full max-w-sm space-y-4">
          
            <button type="button" onClick={() => setMode("phone-login")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
            <h2 className="font-display text-xl font-semibold text-foreground">Verificar Código</h2>
            <p className="text-sm text-muted-foreground">
              Insira o código enviado para {phone}
            </p>
            <Input
            type="text"
            placeholder="000000"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
            maxLength={6}
            className="h-12 text-center text-2xl tracking-[0.5em]" />
          
            <Button type="submit" className="w-full h-12" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar"}
            </Button>
          </motion.form>
        }
      </AnimatePresence>
    </div>);

};

export default Auth;