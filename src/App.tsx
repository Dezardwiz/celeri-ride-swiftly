import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import SplashScreen from "@/components/SplashScreen";
import Index from "./pages/Index.tsx";
import Auth from "./pages/Auth.tsx";
import DriverAuth from "./pages/DriverAuth.tsx";
import Driver from "./pages/Driver.tsx";
import NotFound from "./pages/NotFound.tsx";
import Admin from "./pages/Admin.tsx";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
};

const DriverProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
  if (!user) return <Navigate to="/driver/auth" replace />;
  return <>{children}</>;
};

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const DriverAuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/driver" replace />;
  return <>{children}</>;
};

const AppContent = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <SplashScreen visible={showSplash} />
      <BrowserRouter>
        <Routes>
          {/* Passenger routes */}
          <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />

          {/* Driver routes */}
          <Route path="/driver/auth" element={<DriverAuthRoute><DriverAuth /></DriverAuthRoute>} />
          <Route path="/driver" element={<DriverProtectedRoute><Driver /></DriverProtectedRoute>} />

          {/* Admin route */}
          <Route path="/admin" element={<Admin />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Passenger routes */}
            <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />

            {/* Driver routes */}
            <Route path="/driver/auth" element={<DriverAuthRoute><DriverAuth /></DriverAuthRoute>} />
            <Route path="/driver" element={<DriverProtectedRoute><Driver /></DriverProtectedRoute>} />

            {/* Admin route */}
            <Route path="/admin" element={<Admin />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
