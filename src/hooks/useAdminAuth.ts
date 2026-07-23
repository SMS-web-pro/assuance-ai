
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AdminSession {
  user_id: string;
  email: string;
  role: string;
  login_time: string;
}

export const useAdminAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);

  useEffect(() => {
    checkAuthStatus();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Admin auth state change:', event, session?.user?.email);
        if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          setAdminSession(null);
          localStorage.removeItem('admin_session');
        } else if (event === 'SIGNED_IN' && session) {
          checkAuthStatus();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      
      // Vérifier la session Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw sessionError;
      }

      if (!session) {
        console.log('Pas de session Supabase active');
        setIsAuthenticated(false);
        setAdminSession(null);
        localStorage.removeItem('admin_session');
        return;
      }

      // Vérifier la session admin locale
      const adminSessionData = localStorage.getItem('admin_session');
      if (!adminSessionData) {
        console.log('Pas de session admin locale');
        setIsAuthenticated(false);
        setAdminSession(null);
        return;
      }

      const parsedSession: AdminSession = JSON.parse(adminSessionData);
      
      // Vérifier que l'email correspond à un admin autorisé
      const adminEmails = ['admin@assuranceia.com', 'admin@example.com', 'sahabyoussef@gmail.com', 'demo.admin@gmail.com'];
      const isValidAdmin = adminEmails.includes(session.user.email?.toLowerCase() || '');

      if (!isValidAdmin) {
        console.log('Email non autorisé pour admin:', session.user.email);
        await logout();
        return;
      }

      console.log('Session admin valide pour:', session.user.email);
      setIsAuthenticated(true);
      setAdminSession(parsedSession);
    } catch (error) {
      console.error('Erreur lors de la vérification auth admin:', error);
      setIsAuthenticated(false);
      setAdminSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Erreur lors de la déconnexion:', error);
      }
      localStorage.removeItem('admin_session');
      setIsAuthenticated(false);
      setAdminSession(null);
      console.log('Déconnexion admin réussie');
    } catch (error) {
      console.error('Erreur lors de la déconnexion admin:', error);
    }
  };

  return {
    isAuthenticated,
    isLoading,
    adminSession,
    logout,
    refreshAuth: checkAuthStatus
  };
};
