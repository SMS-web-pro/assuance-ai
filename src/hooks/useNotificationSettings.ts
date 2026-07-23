
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface NotificationSettings {
  notificationsEnabled: boolean;
  soundsEnabled: boolean;
  notificationSound: string;
  chatSound: string;
  volume: number;
}

export const useNotificationSettings = () => {
  const [settings, setSettings] = useState<NotificationSettings>({
    notificationsEnabled: true,
    soundsEnabled: true,
    notificationSound: 'default',
    chatSound: 'default',
    volume: 50
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', [
          'notifications_enabled',
          'sounds_enabled',
          'notification_sound',
          'chat_sound',
          'notification_volume'
        ]);

      if (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
        // En cas d'erreur, on garde les valeurs par défaut
        return;
      }

      if (data && data.length > 0) {
        const settingsMap = data.reduce((acc: any, setting: any) => {
          acc[setting.key] = setting.value;
          return acc;
        }, {});

        setSettings({
          notificationsEnabled: settingsMap.notifications_enabled !== 'false',
          soundsEnabled: settingsMap.sounds_enabled !== 'false',
          notificationSound: settingsMap.notification_sound || 'default',
          chatSound: settingsMap.chat_sound || 'default',
          volume: parseInt(settingsMap.notification_volume) || 50
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres de notification:', error);
      // En cas d'erreur, on garde les valeurs par défaut
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = (key: keyof NotificationSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return {
    settings,
    isLoading,
    updateSetting,
    refreshSettings: loadSettings
  };
};
