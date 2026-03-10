import { ArrowLeft, User, Star, Phone, Mail, LogOut, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface ProfileScreenProps {
  onBack: () => void;
}

const ProfileScreen = ({ onBack }: ProfileScreenProps) => {
  const menuItems = [
    { icon: Phone, label: "Telefone", value: "+55 92 9****-1234" },
    { icon: Mail, label: "Email", value: "usuario@email.com" },
    { icon: Star, label: "Minha avaliação", value: "4.8 ★" },
  ];

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
        {/* Avatar section */}
        <div className="flex flex-col items-center py-8 border-b border-border">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary font-display text-2xl text-primary-foreground">
            JP
          </div>
          <h3 className="mt-3 font-display text-lg uppercase tracking-wider text-foreground">
            João Pedro
          </h3>
          <p className="text-sm text-muted-foreground">Passageiro desde Mar 2026</p>
        </div>

        {/* Menu items */}
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

        {/* Logout */}
        <div className="p-4 mt-4">
          <button className="flex w-full items-center justify-center gap-2 rounded-md border border-border py-3 font-display text-sm uppercase tracking-wider text-destructive transition-colors hover:bg-destructive/10">
            <LogOut size={16} />
            Sair
          </button>
        </div>

        {/* Footer */}
        <div className="p-4 text-center">
          <p className="text-xs text-muted-foreground">desenvolvido por payn</p>
        </div>
      </div>
    </motion.div>
  );
};

export default ProfileScreen;
