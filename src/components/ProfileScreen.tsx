import { ArrowLeft, Phone, Mail, LogOut, Pencil, Loader2, ChevronRight, Gift, Copy, Share2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ProfileScreenProps {
  onBack: () => void;
}

const ProfileScreen = ({ onBack }: ProfileScreenProps) => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<{ full_name: string | null; phone: string | null; referral_code: string | null; referred_by: string | null } | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [referralInput, setReferralInput] = useState("");
  const [applyingReferral, setApplyingReferral] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("full_name, phone, referral_code, referred_by")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => setProfile(data as any));
  }, [user]);

  const displayName = profile?.full_name || user?.user_metadata?.full_name || "Usuário";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const menuItems = [
    { icon: Phone, label: "Telefone", value: profile?.phone || user?.phone || "Não informado" },
    { icon: Mail, label: "Email", value: user?.email || "Não informado" },
  ];

  const handleLogout = async () => {
    await signOut();
  };

  const openEdit = () => {
    setEditName(profile?.full_name ?? "");
    setEditPhone(profile?.phone ?? "");
    setEditOpen(true);
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: editName.trim() || null, phone: editPhone.trim() || null })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setProfile((p) => p ? { ...p, full_name: editName.trim() || null, phone: editPhone.trim() || null } : p);
    toast.success("Perfil atualizado");
    setEditOpen(false);
  };

  const copyCode = async () => {
    if (!profile?.referral_code) return;
    await navigator.clipboard.writeText(profile.referral_code);
    toast.success("Código copiado!");
  };

  const shareCode = async () => {
    if (!profile?.referral_code) return;
    const text = `Use meu código ${profile.referral_code} no CELERI e ganhe R$ 5 na primeira corrida! 🛵`;
    if ((navigator as any).share) {
      try { await (navigator as any).share({ title: "CELERI", text }); } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      toast.success("Mensagem copiada!");
    }
  };

  const applyReferral = async () => {
    if (!referralInput.trim()) return;
    setApplyingReferral(true);
    const { data, error } = await supabase.rpc("apply_referral_code", { _code: referralInput.trim().toUpperCase() });
    setApplyingReferral(false);
    const res = data as any;
    if (error || !res?.ok) {
      const reason = res?.reason;
      toast.error(
        reason === "invalid_code" ? "Código inválido" :
        reason === "self_referral" ? "Você não pode indicar a si mesmo" :
        reason === "already_referred" ? "Você já foi indicado" :
        "Erro ao aplicar código"
      );
      return;
    }
    toast.success("Código aplicado! Ganhe R$ 5 ao concluir sua primeira corrida.");
    setProfile((p) => p ? { ...p, referred_by: "applied" } : p);
    setReferralInput("");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-40 flex flex-col bg-background"
    >
      <div className="border-b border-border p-4 flex items-center gap-3">
        <button onClick={onBack} className="text-foreground p-1">
          <ArrowLeft size={20} />
        </button>
        <h2 className="font-display text-lg uppercase tracking-wider">Perfil</h2>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-20">
        <div className="flex flex-col items-center py-8 border-b border-border">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary font-display text-2xl text-primary-foreground">
            {initials}
          </div>
          <h3 className="mt-3 font-display text-lg uppercase tracking-wider text-foreground">
            {displayName}
          </h3>
          <p className="text-sm text-muted-foreground">Passageiro</p>
          <button
            onClick={openEdit}
            className="mt-3 flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-accent">
            <Pencil size={12} />
            Editar perfil
          </button>
        </div>

        <div className="divide-y divide-border">
          {menuItems.map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-4">
              <item.icon size={18} className="text-muted-foreground" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm text-foreground">{item.value}</p>
              </div>
              <ChevronRight size={14} className="text-muted-foreground" />
            </div>
          ))}
        </div>

        {/* Referral block */}
        <div className="mx-4 mt-4 rounded-xl border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-4">
          <div className="flex items-center gap-2 mb-2">
            <Gift size={16} className="text-primary" />
            <h4 className="font-display text-xs uppercase tracking-wider text-foreground">Indique e ganhe</h4>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Você ganha <strong className="text-primary">R$ 5</strong> e seu amigo também, quando ele fizer a primeira corrida.
          </p>
          {profile?.referral_code && (
            <div className="mb-3 flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
              <span className="flex-1 font-display text-base tracking-widest text-foreground">{profile.referral_code}</span>
              <button onClick={copyCode} className="text-muted-foreground hover:text-foreground" aria-label="Copiar">
                <Copy size={14} />
              </button>
              <button onClick={shareCode} className="text-muted-foreground hover:text-foreground" aria-label="Compartilhar">
                <Share2 size={14} />
              </button>
            </div>
          )}
          {!profile?.referred_by && (
            <div className="flex gap-2">
              <Input
                value={referralInput}
                onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                placeholder="Tem um código? Digite aqui"
                className="h-9 text-xs uppercase tracking-wider"
              />
              <Button onClick={applyReferral} disabled={applyingReferral || !referralInput.trim()} size="sm" className="h-9">
                {applyingReferral ? <Loader2 size={14} className="animate-spin" /> : "Aplicar"}
              </Button>
            </div>
          )}
        </div>

        <div className="p-4 mt-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-border py-3 font-display text-sm uppercase tracking-wider text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>

        <div className="p-4 text-center">
          <p className="text-xs text-muted-foreground">desenvolvido por payn</p>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar perfil</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Nome completo</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Seu nome" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Telefone</label>
              <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="+55 38 99999-9999" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={saveProfile} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default ProfileScreen;
