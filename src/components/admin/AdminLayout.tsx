import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AdminLayoutProps {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
}

export default function AdminLayout({ children, requireSuperAdmin = false }: AdminLayoutProps) {
  const supabase = useSupabaseClient();
  const user = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Vérifier si l'utilisateur est administrateur
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('is_super_admin')
          .eq('user_id', user.id)
          .single();

        if (adminError || !adminData) {
          console.error('Erreur de vérification admin:', adminError);
          setIsAdmin(false);
          
          // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
          if (location.pathname !== '/admin/login') {
            navigate('/admin/login', { replace: true });
          }
          return;
        }

        // Vérifier si un super admin est requis
        if (requireSuperAdmin && !adminData.is_super_admin) {
          toast.error('Accès refusé : droits insuffisants');
          navigate('/admin', { replace: true });
          return;
        }

        setIsAdmin(true);
        setIsSuperAdmin(adminData.is_super_admin);
      } catch (error) {
        console.error('Erreur lors de la vérification admin:', error);
        setIsAdmin(false);
        
        if (location.pathname !== '/admin/login') {
          navigate('/admin/login', { replace: true });
        }
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, location.pathname, requireSuperAdmin, supabase, navigate]);

  // Afficher un indicateur de chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-500" />
          <p className="mt-4 text-gray-600">Vérification des droits d'administration...</p>
        </div>
      </div>
    );
  }

  // Rediriger si l'utilisateur n'est pas administrateur
  if (!isAdmin && location.pathname !== '/admin/login') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 max-w-md mx-auto bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Accès refusé</h2>
          <p className="text-gray-600 mb-6">
            Vous n'avez pas les autorisations nécessaires pour accéder à cette page.
          </p>
          <button
            onClick={() => navigate('/admin/login', { replace: true })}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  // Afficher le contenu protégé si l'utilisateur est administrateur
  return <>{children}</>;
}
