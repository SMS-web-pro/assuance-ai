
import React, { useEffect, useRef } from 'react';
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
  // Utiliser une ref pour track le dernier message traité (évite les re-renders)
  const lastProcessedRef = useRef<string>('');

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

  // Déclencher la lecture vocale automatique
  // PAS de dépendance à insuranceType pour éviter le reset
  useEffect(() => {
    if (!isActive) return;

    if (lastAgentMessage && 
        lastAgentMessage.trim() && 
        lastAgentMessage !== lastProcessedRef.current &&
        lastAgentMessage.length > 10) {
      
      console.log(`🤖 Nouveau message détecté:`, lastAgentMessage.substring(0, 50) + '...');
      
      // Marquer comme traité AVANT de parler
      lastProcessedRef.current = lastAgentMessage;
      
      // Petit délai pour éviter les conflits
      setTimeout(() => {
        if (isActive && voiceSystem.speak) {
          voiceSystem.speak(lastAgentMessage);
        }
      }, 500);
    }
  }, [lastAgentMessage, isActive, voiceSystem.speak]);

  // Reset seulement quand le message est vidé (pas quand insuranceType change)
  useEffect(() => {
    if (!lastAgentMessage || lastAgentMessage.trim() === '') {
      lastProcessedRef.current = '';
    }
  }, [lastAgentMessage]);

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
