
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Mail, MessageSquare } from "lucide-react";

interface NotificationSettingsProps {
  emailNotifications: boolean;
  smsNotifications: boolean;
  setEmailNotifications: (value: boolean) => void;
  setSmsNotifications: (value: boolean) => void;
}

const NotificationSettings = ({
  emailNotifications,
  smsNotifications,
  setEmailNotifications,
  setSmsNotifications
}: NotificationSettingsProps) => {
  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Notifications par email et SMS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-gray-500" />
            <Label className="text-gray-700 dark:text-gray-300">
              Notifications par email
            </Label>
          </div>
          <Switch
            checked={emailNotifications}
            onCheckedChange={setEmailNotifications}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-gray-500" />
            <Label className="text-gray-700 dark:text-gray-300">
              Notifications par SMS
            </Label>
          </div>
          <Switch
            checked={smsNotifications}
            onCheckedChange={setSmsNotifications}
          />
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-400 mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p>
            • Les notifications par email seront envoyées pour les nouvelles demandes et rappels
          </p>
          <p>
            • Les notifications par SMS nécessitent une configuration supplémentaire
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
