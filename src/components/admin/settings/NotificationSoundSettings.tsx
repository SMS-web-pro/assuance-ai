
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";

interface NotificationSoundSettingsProps {
  notificationsEnabled: boolean;
  soundsEnabled: boolean;
  notificationSound: string;
  chatSound: string;
  volume: number;
  setNotificationsEnabled: (value: boolean) => void;
  setSoundsEnabled: (value: boolean) => void;
  setNotificationSound: (value: string) => void;
  setChatSound: (value: string) => void;
  setVolume: (value: number) => void;
}

const NotificationSoundSettings = ({
  notificationsEnabled,
  soundsEnabled,
  notificationSound,
  chatSound,
  volume,
  setNotificationsEnabled,
  setSoundsEnabled,
  setNotificationSound,
  setChatSound,
  setVolume
}: NotificationSoundSettingsProps) => {
  
  const soundOptions = [
    { value: 'default', label: 'Son par défaut' },
    { value: 'gentle', label: 'Doux' },
    { value: 'modern', label: 'Moderne' },
    { value: 'classic', label: 'Classique' },
    { value: 'subtle', label: 'Subtil' }
  ];

  const testNotificationSound = () => {
    if (soundsEnabled) {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Volume plus fort pour les tests
        const testVolume = Math.max(volume / 100 * 0.3, 0.15);
        
        // Différents sons selon le type sélectionné
        switch (notificationSound) {
          case 'gentle':
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1);
            break;
          case 'modern':
            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.05);
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1);
            break;
          case 'classic':
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
            break;
          case 'subtle':
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(500, audioContext.currentTime + 0.1);
            break;
          default:
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        }
        
        gainNode.gain.setValueAtTime(testVolume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
      } catch (error) {
        console.warn('Impossible de jouer le son de test:', error);
      }
    }
  };

  const testChatSound = () => {
    if (soundsEnabled) {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Volume plus fort pour les tests
        const testVolume = Math.max(volume / 100 * 0.25, 0.12);
        
        // Différents sons selon le type sélectionné
        switch (chatSound) {
          case 'gentle':
            oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime + 0.05);
            break;
          case 'modern':
            oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.03);
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime + 0.06);
            break;
          case 'classic':
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(500, audioContext.currentTime + 0.05);
            break;
          case 'subtle':
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(250, audioContext.currentTime + 0.05);
            break;
          default:
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(500, audioContext.currentTime + 0.05);
        }
        
        gainNode.gain.setValueAtTime(testVolume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } catch (error) {
        console.warn('Impossible de jouer le son de test:', error);
      }
    }
  };

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
          {soundsEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          Paramètres de notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <Label className="text-gray-700 dark:text-gray-300">Activer les notifications</Label>
          <Switch
            checked={notificationsEnabled}
            onCheckedChange={setNotificationsEnabled}
          />
        </div>

        {notificationsEnabled && (
          <>
            <div className="flex items-center justify-between">
              <Label className="text-gray-700 dark:text-gray-300">Sons de notification</Label>
              <Switch
                checked={soundsEnabled}
                onCheckedChange={setSoundsEnabled}
              />
            </div>

            {soundsEnabled && (
              <>
                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">Volume des sons</Label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={(e) => setVolume(parseInt(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-12">
                      {volume}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Volume renforcé - Les sons sont maintenant plus audibles
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">Son des notifications système</Label>
                  <div className="flex gap-2">
                    <Select value={notificationSound} onValueChange={setNotificationSound}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {soundOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={testNotificationSound}
                      disabled={!soundsEnabled}
                    >
                      Tester
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-gray-300">Son des messages de chat</Label>
                  <div className="flex gap-2">
                    <Select value={chatSound} onValueChange={setChatSound}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {soundOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={testChatSound}
                      disabled={!soundsEnabled}
                    >
                      Tester
                    </Button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationSoundSettings;
