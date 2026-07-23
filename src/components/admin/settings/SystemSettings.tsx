
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface SystemSettingsProps {
  maintenanceMode: boolean;
  autoBackup: boolean;
  backupFrequency: string;
  systemMessage: string;
  setMaintenanceMode: (value: boolean) => void;
  setAutoBackup: (value: boolean) => void;
  setBackupFrequency: (value: string) => void;
  setSystemMessage: (value: string) => void;
}

const SystemSettings = ({
  maintenanceMode,
  autoBackup,
  backupFrequency,
  systemMessage,
  setMaintenanceMode,
  setAutoBackup,
  setBackupFrequency,
  setSystemMessage
}: SystemSettingsProps) => {
  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white">Paramètres Système</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-gray-700 dark:text-gray-300">Mode maintenance</Label>
          <Switch
            checked={maintenanceMode}
            onCheckedChange={setMaintenanceMode}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label className="text-gray-700 dark:text-gray-300">Sauvegarde automatique</Label>
          <Switch
            checked={autoBackup}
            onCheckedChange={setAutoBackup}
          />
        </div>
        
        <div>
          <Label className="text-gray-700 dark:text-gray-300">Fréquence de sauvegarde (heures)</Label>
          <Input
            type="number"
            value={backupFrequency}
            onChange={(e) => setBackupFrequency(e.target.value)}
            className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
          />
        </div>
        
        <div>
          <Label className="text-gray-700 dark:text-gray-300">Message système</Label>
          <Textarea
            value={systemMessage}
            onChange={(e) => setSystemMessage(e.target.value)}
            placeholder="Message à afficher aux utilisateurs..."
            className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemSettings;
