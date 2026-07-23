import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import ApiKeysSection from "./settings/ApiKeysSection";
import NotificationSettings from "./settings/NotificationSettings";
import NotificationSoundSettings from "./settings/NotificationSoundSettings";
import CustomCodesSection from "./settings/CustomCodesSection";
import SystemSettings from "./settings/SystemSettings";
import SmtpSettings from "./settings/SmtpSettings";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface ApiKey {
  id: number;
  name: string;
  key: string;
  service: string;
  enabled: boolean;
  created_at: string;
}

interface CustomCode {
  id: number;
  name: string;
  code: string;
  location: 'head' | 'body' | 'footer';
}

const Settings = () => {
  const { toast } = useToast();
  
  // API Keys State
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);

  // Notification Settings State
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  
  // Notification Sound Settings State
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundsEnabled, setSoundsEnabled] = useState(true);
  const [notificationSound, setNotificationSound] = useState('default');
  const [chatSound, setChatSound] = useState('default');
  const [volume, setVolume] = useState(50);

  // System Settings State
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState('24');
  const [systemMessage, setSystemMessage] = useState('');

  // Custom Codes State
  const [customCodes, setCustomCodes] = useState<CustomCode[]>([]);
  // Ref to avoid saving on initial load
  const initialCodesLoad = useRef(true);

  // Auto-persist custom codes to Supabase whenever they change (except first load)
  useEffect(() => {
    if (initialCodesLoad.current) {
      initialCodesLoad.current = false;
      return;
    }

    const persistCodes = async () => {
      try {
        await supabase.from('app_settings').upsert(
          { key: 'custom_codes', value: JSON.stringify(customCodes) },
          { onConflict: 'key' }
        );
        console.log('✅ Custom codes synced');
      } catch (err) {
        console.error('❌ Error syncing custom codes:', err);
      }
    };

    // Lightweight debounce (prevents multiple rapid requests)
    const debounce = setTimeout(persistCodes, 500);
    return () => clearTimeout(debounce);
  }, [customCodes]);

  // SMTP Settings State
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUsername, setSmtpUsername] = useState('');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpSecurity, setSmtpSecurity] = useState('tls');
  const [smtpEnabled, setSmtpEnabled] = useState(false);
  const [senderName, setSenderName] = useState('AssureAI Support');
  const [senderEmail, setSenderEmail] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('app_settings')
        .select('key, value');

      if (error) {
        console.error('Erreur Supabase:', error);
        throw error;
      }

      console.log('Données chargées:', data);

      const settings = data.reduce((acc: any, setting: any) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {});

      // Appliquer les valeurs SMTP
      setSmtpEnabled(settings.smtp_enabled === 'true');
      setSmtpHost(settings.smtp_host || '');
      setSmtpPort(settings.smtp_port || '587');
      setSmtpUsername(settings.smtp_username || '');
      setSmtpPassword(settings.smtp_password || '');
      setSmtpSecurity(settings.smtp_security || 'tls');
      setSenderName(settings.sender_name || 'AssureAI Support');
      setSenderEmail(settings.sender_email || '');

      // Appliquer les paramètres de notification
      setNotificationsEnabled(settings.notifications_enabled !== 'false');
      setSoundsEnabled(settings.sounds_enabled !== 'false');
      setNotificationSound(settings.notification_sound || 'default');
      setChatSound(settings.chat_sound || 'default');
      setVolume(parseInt(settings.notification_volume) || 50);

      // Appliquer les paramètres de notification email/sms
      setEmailNotifications(settings.email_notifications !== 'false');
      setSmsNotifications(settings.sms_notifications === 'true');

      // Appliquer les paramètres système
      setMaintenanceMode(settings.maintenance_mode === 'true');
      setAutoBackup(settings.auto_backup !== 'false');
      setBackupFrequency(settings.backup_frequency || '24');
      setSystemMessage(settings.system_message || '');

      // Charger les clés API
      if (settings.api_keys) {
        try {
          const parsedApiKeys = JSON.parse(settings.api_keys);
          setApiKeys(Array.isArray(parsedApiKeys) ? parsedApiKeys : []);
        } catch (e) {
          console.error('Erreur parsing API keys:', e);
          setApiKeys([]);
        }
      }

      // Charger les codes personnalisés
      if (settings.custom_codes) {
        try {
          const parsedCustomCodes = JSON.parse(settings.custom_codes);
          setCustomCodes(Array.isArray(parsedCustomCodes) ? parsedCustomCodes : []);
        } catch (e) {
          console.error('Erreur parsing custom codes:', e);
          setCustomCodes([]);
        }
      }

    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors du chargement des paramètres",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      console.log('Début de la sauvegarde...');

      const settingsToUpdate = [
        { key: 'smtp_enabled', value: smtpEnabled.toString() },
        { key: 'smtp_host', value: smtpHost },
        { key: 'smtp_port', value: smtpPort },
        { key: 'smtp_username', value: smtpUsername },
        { key: 'smtp_password', value: smtpPassword },
        { key: 'smtp_security', value: smtpSecurity },
        { key: 'sender_name', value: senderName },
        { key: 'sender_email', value: senderEmail },
        { key: 'api_keys', value: JSON.stringify(apiKeys) },
        { key: 'notifications_enabled', value: notificationsEnabled.toString() },
        { key: 'sounds_enabled', value: soundsEnabled.toString() },
        { key: 'notification_sound', value: notificationSound },
        { key: 'chat_sound', value: chatSound },
        { key: 'notification_volume', value: volume.toString() },
        { key: 'email_notifications', value: emailNotifications.toString() },
        { key: 'sms_notifications', value: smsNotifications.toString() },
        { key: 'maintenance_mode', value: maintenanceMode.toString() },
        { key: 'auto_backup', value: autoBackup.toString() },
        { key: 'backup_frequency', value: backupFrequency },
        { key: 'system_message', value: systemMessage },
        { key: 'custom_codes', value: JSON.stringify(customCodes) }
      ];

      console.log('Paramètres à sauvegarder:', settingsToUpdate);

      for (const setting of settingsToUpdate) {
        const { error } = await supabase
          .from('app_settings')
          .upsert({
            key: setting.key,
            value: setting.value
          }, {
            onConflict: 'key'
          });

        if (error) {
          console.error('Erreur lors de la sauvegarde de', setting.key, ':', error);
          throw error;
        }
      }

      console.log('Sauvegarde réussie');
      toast({
        title: "Succès",
        description: "Paramètres sauvegardés avec succès"
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la sauvegarde des paramètres",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 w-full bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600 dark:text-gray-400">
            Chargement des paramètres...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 w-full bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Paramètres</h1>
        <Button 
          onClick={saveSettings} 
          disabled={isSaving}
          className="flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
        </Button>
      </div>

      <div className="space-y-6">
        <NotificationSoundSettings
          notificationsEnabled={notificationsEnabled}
          soundsEnabled={soundsEnabled}
          notificationSound={notificationSound}
          chatSound={chatSound}
          volume={volume}
          setNotificationsEnabled={setNotificationsEnabled}
          setSoundsEnabled={setSoundsEnabled}
          setNotificationSound={setNotificationSound}
          setChatSound={setChatSound}
          setVolume={setVolume}
        />

        <ApiKeysSection apiKeys={apiKeys} setApiKeys={setApiKeys} />
        
        <SmtpSettings
          smtpHost={smtpHost}
          smtpPort={smtpPort}
          smtpUsername={smtpUsername}
          smtpPassword={smtpPassword}
          smtpSecurity={smtpSecurity}
          smtpEnabled={smtpEnabled}
          senderName={senderName}
          senderEmail={senderEmail}
          setSmtpHost={setSmtpHost}
          setSmtpPort={setSmtpPort}
          setSmtpUsername={setSmtpUsername}
          setSmtpPassword={setSmtpPassword}
          setSmtpSecurity={setSmtpSecurity}
          setSmtpEnabled={setSmtpEnabled}
          setSenderName={setSenderName}
          setSenderEmail={setSenderEmail}
        />
        
        <NotificationSettings 
          emailNotifications={emailNotifications}
          smsNotifications={smsNotifications}
          setEmailNotifications={setEmailNotifications}
          setSmsNotifications={setSmsNotifications}
        />
        
        <SystemSettings
          maintenanceMode={maintenanceMode}
          autoBackup={autoBackup}
          backupFrequency={backupFrequency}
          systemMessage={systemMessage}
          setMaintenanceMode={setMaintenanceMode}
          setAutoBackup={setAutoBackup}
          setBackupFrequency={setBackupFrequency}
          setSystemMessage={setSystemMessage}
        />
        
        <CustomCodesSection customCodes={customCodes} setCustomCodes={setCustomCodes} />
      </div>
    </div>
  );
};

export default Settings;
