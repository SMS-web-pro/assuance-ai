
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellOff } from 'lucide-react';
import { useDemandesNotifications } from '@/hooks/useDemandesNotifications';

interface NotificationPermissionButtonProps {
  userType: 'admin' | 'conseiller';
  conseillerNom?: string;
  className?: string;
}

export const NotificationPermissionButton = ({ 
  userType, 
  conseillerNom,
  className = '' 
}: NotificationPermissionButtonProps) => {
  const { isListening, startListening, stopListening, permission } = useDemandesNotifications(
    userType, 
    conseillerNom
  );

  const handleToggleNotifications = async () => {
    if (isListening) {
      stopListening();
    } else {
      await startListening();
    }
  };

  const getButtonText = () => {
    if (permission === 'denied') {
      return 'Notifications bloquées - Cliquez pour débloquer';
    }
    return isListening ? 'Désactiver notifications' : 'Activer notifications';
  };

  const getButtonIcon = () => {
    return isListening ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />;
  };

  const handlePermissionDenied = () => {
    alert(`🔔 Pour activer les notifications :

1. Cliquez sur l'icône de cadenas 🔒 dans la barre d'adresse
2. Changez "Notifications" de "Bloquer" à "Autoriser"  
3. Rafraîchissez la page
4. Cliquez à nouveau sur ce bouton

Ou allez dans les paramètres de votre navigateur :
• Chrome/Edge : Paramètres → Confidentialité → Notifications
• Firefox : Paramètres → Vie privée → Notifications`);
  };

  return (
    <Button
      variant={isListening ? "default" : permission === 'denied' ? "destructive" : "outline"}
      size="sm"
      onClick={permission === 'denied' ? handlePermissionDenied : handleToggleNotifications}
      className={className}
    >
      {getButtonIcon()}
      <span className="ml-2">{getButtonText()}</span>
    </Button>
  );
};
