
import React, { useEffect, useState } from 'react';
import { useVoiceSystem } from '@/hooks/useVoiceSystem';
import NativeVoiceControls from './NativeVoiceControls';

interface NativeVoiceChatIntegrationProps {
  onSendMessage: (message: string) => void;
  lastAgentMessage: string;
  insuranceType: string;
  isActive?: boolean;
}

const NativeVoiceChatIntegration: React.FC<NativeVoiceChatIntegrationProps> = ({
  onSendMessage,
  lastAgentMessage,
  insuranceType,
  isActive = false
}) => {
  const [lastProcessedMessage, setLastProcessedMessage] = useState<string>('');

  // Mapping des types d'assurance vers les agents
  const getAgentInfo = (type: string) => {
    const agents = {
      'Assurance Auto': { name: 'Marc Dubois', gender: 'male' as const },
      'Assurance Habitation': { name: 'Sophie Martin', gender: 'female' as const },
      'Assurance Santé': { name: 'Dr. Claire Rousseau', gender: 'female' as const },
      'Assurance Moto': { name: 'Alex Moreau', gender: 'male' as const },
      'Assurance Emprunteur': { name: 'Pierre Delacroix', gender: 'male' as const },
      'Assurance Voyage': { name: 'Camille Durand', gender: 'female' as const }
    };
    return agents[type as keyof typeof agents] || { name: 'Assistant', gender: 'female' as const };
  };

  const agentInfo = getAgentInfo(insuranceType);
  
  console.log(`🎭 Agent ${agentInfo.name} (${agentInfo.gender}) pour ${insuranceType} - ${isActive ? 'ACTIF' : 'INACTIF'} - Synthèse vocale native`);

  // Utiliser le système vocal seulement si l'agent est actif
  const voiceSystem = useVoiceSystem({
    onTranscript: (text: string) => {
      if (isActive && text.trim()) {
        console.log(`🎤 Message vocal reçu pour ${agentInfo.name}:`, text);
        onSendMessage(text);
      }
    },
    language: 'fr-FR',
    expertGender: agentInfo.gender,
    expertName: agentInfo.name,
    isActive
  });

  // Déclencher la lecture vocale automatique seulement si l'agent est actif
  useEffect(() => {
    if (!isActive) {
      console.log(`🔇 Agent ${agentInfo.name} inactif - pas de lecture vocale`);
      return;
    }

    if (lastAgentMessage && 
        lastAgentMessage.trim() && 
        lastAgentMessage !== lastProcessedMessage &&
        lastAgentMessage.length > 10) {
      
      console.log(`🤖 Nouveau message de l'agent ${agentInfo.name} (${agentInfo.gender}) détecté (native):`, lastAgentMessage.substring(0, 50) + '...');
      
      // Petite pause avant la lecture pour éviter les conflits
      setTimeout(() => {
        if (isActive && voiceSystem.speak) {
          voiceSystem.speak(lastAgentMessage);
        }
      }, 500);
      
      setLastProcessedMessage(lastAgentMessage);
    }
  }, [lastAgentMessage, lastProcessedMessage, agentInfo.name, agentInfo.gender, isActive, voiceSystem.speak]);

  // Réinitialiser le message de référence quand l'agent devient actif
  useEffect(() => {
    if (isActive) {
      console.log(`🔄 Réinitialisation du message de référence pour ${agentInfo.name} (native)`);
      setLastProcessedMessage('');
    }
  }, [isActive, agentInfo.name]);

  // Si l'agent n'est pas actif, ne pas afficher les contrôles
  if (!isActive) {
    return null;
  }

  return (
    <NativeVoiceControls
      isListening={voiceSystem.isListening}
      isSpeaking={voiceSystem.isSpeaking}
      isSupported={voiceSystem.isSupported}
      onStartListening={voiceSystem.startListening}
      onStopListening={voiceSystem.stopListening}
      onStopSpeaking={voiceSystem.stopSpeaking}
      onReplayLastMessage={voiceSystem.replayLastMessage}
      hasLastMessage={!!voiceSystem.lastMessage}
      onVoiceMessage={onSendMessage}
    />
  );
};

export default NativeVoiceChatIntegration;
