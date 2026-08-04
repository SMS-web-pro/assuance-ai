
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

  // Un seul agent vocal masculin pour toutes les assurances
  const voiceSystem = useVoiceSystem({
    onTranscript: (text: string) => {
      if (isActive && text.trim()) {
        console.log(`🎤 Message vocal reçu:`, text);
        onSendMessage(text);
      }
    },
    language: 'fr-FR',
    expertGender: 'male',
    expertName: 'Agent Vocal',
    isActive
  });

  // Réinitialiser le message traité quand le type d'assurance change
  useEffect(() => {
    setLastProcessedMessage('');
  }, [insuranceType]);

  // Déclencher la lecture vocale automatique
  useEffect(() => {
    if (!isActive) return;

    if (lastAgentMessage && 
        lastAgentMessage.trim() && 
        lastAgentMessage !== lastProcessedMessage &&
        lastAgentMessage.length > 10) {
      
      console.log(`🤖 Nouveau message détecté:`, lastAgentMessage.substring(0, 50) + '...');
      
      setTimeout(() => {
        if (isActive && voiceSystem.speak) {
          voiceSystem.speak(lastAgentMessage);
        }
      }, 500);
      
      setLastProcessedMessage(lastAgentMessage);
    }
  }, [lastAgentMessage, lastProcessedMessage, isActive, voiceSystem.speak]);

  // Réinitialiser quand l'agent devient actif
  useEffect(() => {
    if (isActive) {
      setLastProcessedMessage('');
    }
  }, [isActive]);

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
