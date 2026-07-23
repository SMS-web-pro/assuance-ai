
import { toast } from "sonner";

interface NotificationSettings {
  notificationsEnabled?: boolean;
  soundsEnabled?: boolean;
  notificationSound?: string;
  chatSound?: string;
  volume?: number;
}

export const useNotificationSound = (settings?: NotificationSettings) => {
  const defaultSettings = {
    notificationsEnabled: true,
    soundsEnabled: true,
    notificationSound: 'default',
    chatSound: 'default',
    volume: 50,
    ...settings
  };

  const generateSound = (type: 'notification' | 'chat', soundType: string, volume: number) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Augmenter significativement le volume de base
      const baseVolume = Math.max(volume / 100 * 0.3, 0.1); // Volume minimum de 0.1
      
      if (type === 'notification') {
        switch (soundType) {
          case 'gentle':
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(baseVolume, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.4);
            break;
          case 'modern':
            oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.05);
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(baseVolume, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.35);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.35);
            break;
          case 'classic':
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(baseVolume, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.4);
            break;
          case 'subtle':
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(500, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(baseVolume * 0.8, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
            break;
          default:
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
            gainNode.gain.setValueAtTime(baseVolume, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.4);
        }
      } else {
        // Sons de chat avec volume augmenté
        const chatVolume = Math.max(volume / 100 * 0.25, 0.08);
        switch (soundType) {
          case 'gentle':
            oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime + 0.05);
            gainNode.gain.setValueAtTime(chatVolume, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
            break;
          case 'modern':
            oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.03);
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime + 0.06);
            gainNode.gain.setValueAtTime(chatVolume, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
            break;
          case 'classic':
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(500, audioContext.currentTime + 0.05);
            gainNode.gain.setValueAtTime(chatVolume, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
            break;
          case 'subtle':
            oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(250, audioContext.currentTime + 0.05);
            gainNode.gain.setValueAtTime(chatVolume * 0.7, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.4);
            break;
          default:
            oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(500, audioContext.currentTime + 0.05);
            gainNode.gain.setValueAtTime(chatVolume, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.3);
        }
      }
    } catch (error) {
      console.warn('Impossible de jouer le son:', error);
    }
  };

  const playNotificationSound = () => {
    if (defaultSettings.soundsEnabled) {
      // Essayer de jouer le fichier audio d'abord avec volume augmenté
      try {
        const audio = new Audio('/notification.mp3');
        audio.volume = Math.min(defaultSettings.volume / 100 * 0.8, 1.0); // Volume plus élevé
        audio.play().catch(() => {
          // Fallback vers le son généré
          generateSound('notification', defaultSettings.notificationSound, defaultSettings.volume);
        });
      } catch (error) {
        // Fallback vers le son généré
        generateSound('notification', defaultSettings.notificationSound, defaultSettings.volume);
      }
    }
  };

  const playChatSound = () => {
    if (defaultSettings.soundsEnabled) {
      // Essayer de jouer le fichier audio d'abord avec volume augmenté
      try {
        const audio = new Audio('/chat.mp3');
        audio.volume = Math.min(defaultSettings.volume / 100 * 0.7, 1.0); // Volume plus élevé
        audio.play().catch(() => {
          // Fallback vers le son généré
          generateSound('chat', defaultSettings.chatSound, defaultSettings.volume);
        });
      } catch (error) {
        // Fallback vers le son généré
        generateSound('chat', defaultSettings.chatSound, defaultSettings.volume);
      }
    }
  };

  const showNotificationToast = (message: string, description?: string) => {
    if (!defaultSettings.notificationsEnabled) return;

    playNotificationSound();
    toast.success(message, {
      position: "bottom-right",
      description: description || "Nouvelle notification système",
      duration: 5000,
    });
  };

  const showChatToast = (message: string, description?: string) => {
    if (!defaultSettings.notificationsEnabled) return;

    playChatSound();
    toast.info(message, {
      position: "bottom-right", 
      description: description || "Nouveau message reçu",
      duration: 4000,
    });
  };

  const showErrorToast = (message: string, description?: string) => {
    if (!defaultSettings.notificationsEnabled) return;

    // Son d'erreur plus fort et plus long
    generateSound('notification', 'classic', Math.min(defaultSettings.volume + 30, 100));
    toast.error(message, {
      position: "bottom-right",
      description: description || "Erreur système",
      duration: 6000,
    });
  };

  const showWarningToast = (message: string, description?: string) => {
    if (!defaultSettings.notificationsEnabled) return;

    generateSound('notification', 'subtle', Math.min(defaultSettings.volume + 20, 100));
    toast.warning(message, {
      position: "bottom-right",
      description: description || "Avertissement",
      duration: 5000,
    });
  };

  return {
    playNotificationSound,
    playChatSound,
    showNotificationToast,
    showChatToast,
    showErrorToast,
    showWarningToast,
    isEnabled: defaultSettings.notificationsEnabled,
    soundsEnabled: defaultSettings.soundsEnabled
  };
};
