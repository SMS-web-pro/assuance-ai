
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
}

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Vérifier si les notifications sont supportées
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    } else {
      console.log('Les notifications push ne sont pas supportées par ce navigateur');
    }
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      toast.error('Les notifications ne sont pas supportées par votre navigateur');
      return false;
    }

    if (permission === 'granted') {
      return true;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast.success('Notifications activées avec succès');
        return true;
      } else if (result === 'denied') {
        toast.error('Notifications refusées. Vous pouvez les réactiver dans les paramètres du navigateur.');
        return false;
      } else {
        toast.info('Permission de notification en attente');
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de la demande de permission:', error);
      toast.error('Erreur lors de l\'activation des notifications');
      return false;
    }
  };

  const sendNotification = (options: PushNotificationOptions) => {
    if (!isSupported || permission !== 'granted') {
      console.log('Notifications non autorisées ou non supportées');
      return;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        badge: options.badge || '/favicon.ico',
        tag: options.tag || 'default',
        requireInteraction: true,
        silent: false
      });

      // Auto-fermer après 5 secondes
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Gérer le clic sur la notification
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification:', error);
    }
  };

  return {
    isSupported,
    permission,
    requestPermission,
    sendNotification
  };
};
