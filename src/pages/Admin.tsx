import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminDrivers } from "@/components/admin/AdminDrivers";
import { AdminRides } from "@/components/admin/AdminRides";
import { AdminTariffs } from "@/components/admin/AdminTariffs";
import { AdminReports } from "@/components/admin/AdminReports";
import { AdminPassengers } from "@/components/admin/AdminPassengers";
import { AdminFinance } from "@/components/admin/AdminFinance";
import { AdminMap } from "@/components/admin/AdminMap";
import { AdminCommission } from "@/components/admin/AdminCommission";
import { AdminCancellations } from "@/components/admin/AdminCancellations";
import { Shield, Users, Car, DollarSign, BarChart3, LogOut, UserCheck, Wallet, MapPin, Percent, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import geleriLogo from "@/assets/geleri-logo.jpeg";

const Admin = () => {
  const { user, loading, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      setIsAdmin(!!data);
    });
  }, [user]);

  if (loading || isAdmin === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return (
    <div className="flex h-screen items-center justify-center bg-background text-foreground">
      <div className="text-center space-y-2">
        <Shield className="h-12 w-12 mx-auto text-destructive" />
        <h1 className="text-xl font-bold">Acesso Negado</h1>
        <p className="text-muted-foreground">Você não tem permissão de administrador.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={geleriLogo} alt="Geleri" className="h-8 w-8 rounded-lg" />
          <h1 className="text-lg font-bold font-heading">Painel Administrativo</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={signOut}>
          <LogOut className="h-4 w-4 mr-1" /> Sair
        </Button>
      </header>

      <div className="p-4 max-w-6xl mx-auto">
        <Tabs defaultValue="drivers" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-9 bg-card overflow-x-auto">
            <TabsTrigger value="drivers" className="flex items-center gap-1 text-xs">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Motoristas</span>
            </TabsTrigger>
            <TabsTrigger value="passengers" className="flex items-center gap-1 text-xs">
              <UserCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Passageiros</span>
            </TabsTrigger>
            <TabsTrigger value="rides" className="flex items-center gap-1 text-xs">
              <Car className="h-4 w-4" />
              <span className="hidden sm:inline">Corridas</span>
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-1 text-xs">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Mapa</span>
            </TabsTrigger>
            <TabsTrigger value="tariffs" className="flex items-center gap-1 text-xs">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Tarifas</span>
            </TabsTrigger>
            <TabsTrigger value="finance" className="flex items-center gap-1 text-xs">
              <Wallet className="h-4 w-4" />
              <span className="hidden sm:inline">Financeiro</span>
            </TabsTrigger>
            <TabsTrigger value="commission" className="flex items-center gap-1 text-xs">
              <Percent className="h-4 w-4" />
              <span className="hidden sm:inline">Comissão</span>
            </TabsTrigger>
            <TabsTrigger value="cancellations" className="flex items-center gap-1 text-xs">
              <Ban className="h-4 w-4" />
              <span className="hidden sm:inline">Cancelamentos</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-1 text-xs">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Relatórios</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="drivers"><AdminDrivers /></TabsContent>
          <TabsContent value="passengers"><AdminPassengers /></TabsContent>
          <TabsContent value="rides"><AdminRides /></TabsContent>
          <TabsContent value="map"><AdminMap /></TabsContent>
          <TabsContent value="tariffs"><AdminTariffs /></TabsContent>
          <TabsContent value="finance"><AdminFinance /></TabsContent>
          <TabsContent value="commission"><AdminCommission /></TabsContent>
          <TabsContent value="cancellations"><AdminCancellations /></TabsContent>
          <TabsContent value="reports"><AdminReports /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
