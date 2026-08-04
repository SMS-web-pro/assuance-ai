
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useElevenLabsVoice } from '@/hooks/useElevenLabsVoice';
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
  const lastProcessedMessageRef = useRef<string>('');

  // Un seul agent vocal masculin via ElevenLabs
  const voice = useElevenLabsVoice({
    onTranscript: (text: string) => {
      if (isActive && text.trim()) {
        console.log(`🎤 Message vocal reçu:`, text);
        onSendMessage(text);
      }
    },
    language: 'fr-FR',
    expertGender: 'male',
    expertName: 'Conseiller AssureAI'
  });

  // Réinitialiser le message traité quand le type d'assurance change
  useEffect(() => {
    setLastProcessedMessage('');
    lastProcessedMessageRef.current = '';
  }, [insuranceType]);

  // Déclencher la lecture vocale automatique
  useEffect(() => {
    if (!isActive) return;

    if (lastAgentMessage && 
        lastAgentMessage.trim() && 
        lastAgentMessage !== lastProcessedMessageRef.current &&
        lastAgentMessage.length > 10) {
      
      console.log(`🤖 Nouveau message détecté:`, lastAgentMessage.substring(0, 50) + '...');
      lastProcessedMessageRef.current = lastAgentMessage;
      
      setTimeout(() => {
        if (isActive) {
          voice.speak(lastAgentMessage);
        }
      }, 300);
      
      setLastProcessedMessage(lastAgentMessage);
    }
  }, [lastAgentMessage, isActive, voice.speak]);

  // Réinitialiser quand l'agent devient actif
  useEffect(() => {
    if (isActive) {
      setLastProcessedMessage('');
      lastProcessedMessageRef.current = '';
    }
  }, [isActive]);

  if (!isActive) {
    return null;
  }

  return (
    <NativeVoiceControls
      isListening={voice.isListening}
      isSpeaking={voice.isSpeaking}
      isSupported={voice.isSupported}
      onStartListening={voice.startListening}
      onStopListening={voice.stopListening}
      onStopSpeaking={voice.stopSpeaking}
      onReplayLastMessage={voice.replayLastMessage}
      hasLastMessage={voice.hasLastMessage}
      onVoiceMessage={onSendMessage}
    />
  );
};

export default NativeVoiceChatIntegration;
