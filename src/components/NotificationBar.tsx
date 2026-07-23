
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, Bell, Mail, Calendar, BellOff } from "lucide-react";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { useNotificationSettings } from "@/hooks/useNotificationSettings";
import HeaderInsuranceCarousel from "./HeaderInsuranceCarousel";

interface Notification {
  id: string;
  type: 'demande' | 'rappel' | 'email';
  message: string;
  timestamp: string;
  icon: any;
}

const NotificationBar = () => {
  const location = useLocation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [previousNotificationsCount, setPreviousNotificationsCount] = useState(0);
  
  // Utiliser les paramètres de notification
  const { settings, isLoading: settingsLoading } = useNotificationSettings();
  const { showNotificationToast } = useNotificationSound(settings);

  // Si on est sur la page d'accueil (/ ou /prospect), afficher le carrousel d'assurances
  const isHomePage = location.pathname === '/' || location.pathname === '/prospect';
  if (isHomePage) {
    return <HeaderInsuranceCarousel />;
  }

  useEffect(() => {
    if (!settingsLoading) {
      loadNotifications();
      
      // Mise à jour automatique seulement si les notifications sont activées
      if (settings.notificationsEnabled) {
        const interval = setInterval(loadNotifications, 30000);
        
        // Défilement automatique
        const scrollInterval = setInterval(() => {
          setCurrentIndex((prev) => (prev + 1) % Math.max(notifications.length, 1));
        }, 4000);

        return () => {
          clearInterval(interval);
          clearInterval(scrollInterval);
        };
      }
    }
  }, [notifications.length, settings.notificationsEnabled, settingsLoading]);

  // Vérifier les nouvelles notifications
  useEffect(() => {
    if (settings.notificationsEnabled && notifications.length > previousNotificationsCount && previousNotificationsCount > 0) {
      const newNotificationsCount = notifications.length - previousNotificationsCount;
      showNotificationToast(
        `${newNotificationsCount} nouvelle${newNotificationsCount > 1 ? 's' : ''} notification${newNotificationsCount > 1 ? 's' : ''}`,
        "Nouvelles activités détectées"
      );
    }
    setPreviousNotificationsCount(notifications.length);
  }, [notifications.length, previousNotificationsCount, showNotificationToast, settings.notificationsEnabled]);

  const loadNotifications = async () => {
    try {
      const newNotifications: Notification[] = [];

      // Nouvelles demandes (dernières 24h)
      const { data: demandes } = await supabase
        .from('demandes_assurance')
        .select('id, type_assurance, nom, prenom, date_creation')
        .gte('date_creation', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('date_creation', { ascending: false })
        .limit(5);

      demandes?.forEach(demande => {
        newNotifications.push({
          id: `demande-${demande.id}`,
          type: 'demande',
          message: `Nouvelle demande ${demande.type_assurance} de ${demande.prenom} ${demande.nom}`,
          timestamp: demande.date_creation,
          icon: AlertCircle
        });
      });

      // Rappels à venir (prochaines 24h)
      const { data: rappels } = await supabase
        .from('rappels_clients')
        .select(`
          id, titre, date_rappel, type_rappel,
          demandes_assurance (nom, prenom, type_assurance)
        `)
        .gte('date_rappel', new Date().toISOString())
        .lte('date_rappel', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString())
        .eq('statut', 'planifie')
        .order('date_rappel', { ascending: true })
        .limit(3);

      rappels?.forEach(rappel => {
        const demande = rappel.demandes_assurance as any;
        newNotifications.push({
          id: `rappel-${rappel.id}`,
          type: 'rappel',
          message: `Rappel ${rappel.type_rappel}: ${rappel.titre} - ${demande?.prenom} ${demande?.nom}`,
          timestamp: rappel.date_rappel,
          icon: Calendar
        });
      });

      // Emails programmés envoyés (dernières 6h)
      const { data: emails } = await supabase
        .from('rappels_clients')
        .select(`
          id, email_subject, email_sent_at,
          demandes_assurance (nom, prenom, email)
        `)
        .eq('email_sent', true)
        .gte('email_sent_at', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
        .order('email_sent_at', { ascending: false })
        .limit(3);

      emails?.forEach(email => {
        const demande = email.demandes_assurance as any;
        newNotifications.push({
          id: `email-${email.id}`,
          type: 'email',
          message: `Email envoyé: "${email.email_subject}" à ${demande?.prenom} ${demande?.nom}`,
          timestamp: email.email_sent_at,
          icon: Mail
        });
      });

      // Trier par timestamp décroissant
      newNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setNotifications(newNotifications);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    }
  };

  if (settingsLoading) {
    return (
      <div className="text-sm text-center">
        <div className="text-gray-500 font-medium flex items-center justify-center gap-2">
          <Bell className="h-4 w-4 animate-pulse" />
          <span>Chargement...</span>
        </div>
      </div>
    );
  }

  if (!settings.notificationsEnabled) {
    return (
      <div className="text-sm text-center">
        <div className="text-gray-400 font-medium flex items-center justify-center gap-2">
          <BellOff className="h-4 w-4" />
          <span>Notifications désactivées</span>
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-sm text-center">
        <div className="text-green-600 font-medium flex items-center justify-center gap-2">
          <Bell className="h-4 w-4" />
          <span>Système de notifications actif - Aucune nouvelle activité</span>
        </div>
      </div>
    );
  }

  const currentNotification = notifications[currentIndex];
  const Icon = currentNotification?.icon;

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'demande': return 'text-blue-600';
      case 'rappel': return 'text-orange-600';
      case 'email': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getNotificationBg = (type: string) => {
    switch (type) {
      case 'demande': return 'bg-blue-50';
      case 'rappel': return 'bg-orange-50';
      case 'email': return 'bg-green-50';
      default: return 'bg-gray-50';
    }
  };

  return (
    <div className="text-sm text-center relative overflow-hidden">
      <div className={`${getNotificationBg(currentNotification.type)} px-4 py-1 rounded-lg transition-all duration-500 transform`}>
        <div className={`${getNotificationColor(currentNotification.type)} font-medium flex items-center justify-center gap-2`}>
          <Icon className="h-4 w-4 animate-pulse" />
          <span className="animate-fade-in">{currentNotification.message}</span>
          <div className="text-xs text-muted-foreground ml-2">
            ({notifications.length} notification{notifications.length > 1 ? 's' : ''})
          </div>
        </div>
      </div>
      
      {/* Indicateur de progression */}
      <div className="flex justify-center mt-1 gap-1">
        {notifications.map((_, index) => (
          <div
            key={index}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              index === currentIndex ? 'bg-primary' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default NotificationBar;
