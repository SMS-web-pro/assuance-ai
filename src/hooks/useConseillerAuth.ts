import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ConseillerSession {
  id: number;
  nom: string;
  email: string;
  specialite?: string;
  auth_user_id?: string;
}

export const useConseillerAuth = () => {
  const [conseillerSession, setConseillerSession] = useState<ConseillerSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkAuthStatus();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Conseiller auth state change:', event);
        if (event === 'SIGNED_OUT') {
          setConseillerSession(null);
          localStorage.removeItem('conseiller_session');
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
        console.error('Erreur de session:', sessionError);
        throw sessionError;
      }

      if (!session) {
        console.log('Aucune session trouvée');
        setConseillerSession(null);
        return;
      }

      console.log('Session trouvée, email utilisateur:', session.user.email);

      // Récupérer tous les conseillers pour debug
      const { data: allConseillers, error: debugError } = await supabase
        .from('conseillers')
        .select('email, nom');

      if (!debugError && allConseillers) {
        console.log('Conseillers disponibles:', allConseillers.map(c => c.email));
      }

      // Vérifier si l'utilisateur est un conseiller
      const { data: conseiller, error } = await supabase
        .from('conseillers')
        .select('*')
        .eq('email', session.user.email)
        .maybeSingle();

      if (error) {
        console.error('Erreur lors de la recherche du conseiller:', error);
        setConseillerSession(null);
        return;
      }

      if (!conseiller) {
        console.log('Utilisateur non trouvé dans les conseillers');
        console.log('Email recherché:', session.user.email);
        
        // Vérifier si c'est un admin connecté par erreur
        const adminEmails = ['admin@assuranceia.com', 'admin@example.com', 'sahabyoussef@gmail.com', 'demo.admin@gmail.com'];
        const isAdmin = adminEmails.includes(session.user.email?.toLowerCase() || '');
        
        if (isAdmin) {
          console.log('Utilisateur admin détecté, déconnexion et redirection vers la page conseiller');
          toast({
            title: "Session incorrecte",
            description: "Vous êtes connecté avec un compte administrateur. Veuillez vous connecter avec un compte conseiller.",
            variant: "destructive"
          });
          
          // Déconnecter l'utilisateur admin et rediriger
          await supabase.auth.signOut();
          localStorage.removeItem('admin_session');
          localStorage.removeItem('conseiller_session');
          window.location.href = "/conseiller";
          return;
        }
        
        // Afficher un message d'erreur plus informatif
        toast({
          title: "Accès non autorisé",
          description: `L'email ${session.user.email} n'est pas enregistré comme conseiller. Contactez l'administrateur.`,
          variant: "destructive"
        });
        
        setConseillerSession(null);
      } else {
        console.log('Connexion réussie pour le conseiller:', conseiller.nom);

        const sessionData = {
          id: conseiller.id,
          nom: conseiller.nom,
          email: conseiller.email,
          specialite: conseiller.specialite,
          auth_user_id: session.user.id
        };
        
        setConseillerSession(sessionData);
        localStorage.setItem('conseiller_session', JSON.stringify(sessionData));
      }
    } catch (error) {
      console.error('Erreur lors de la vérification auth:', error);
      setConseillerSession(null);
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Succès",
        description: "Votre mot de passe a été modifié avec succès",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erreur lors du changement de mot de passe:', error);
      
      let errorMessage = "Impossible de modifier le mot de passe";
      if (error.message?.includes('Password should be at least')) {
        errorMessage = "Le mot de passe doit contenir au moins 6 caractères";
      } else if (error.message?.includes('same as the old password')) {
        errorMessage = "Le nouveau mot de passe doit être différent de l'ancien";
      }

      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive"
      });

      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Erreur lors de la déconnexion:', error);
      }
      localStorage.removeItem('conseiller_session');
      setConseillerSession(null);
      window.location.href = "/conseiller";
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return {
    conseillerSession,
    isLoading,
    changePassword,
    logout,
    refreshAuth: checkAuthStatus
  };
};
