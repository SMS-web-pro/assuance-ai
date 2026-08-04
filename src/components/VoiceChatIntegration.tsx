
import React, { useCallback, useEffect, useRef } from 'react';
import { useElevenLabsVoice } from '@/hooks/useElevenLabsVoice';
import SimpleVoiceControls from './SimpleVoiceControls';

interface VoiceChatIntegrationProps {
  onSendMessage: (message: string) => void;
  onReceiveResponse?: (response: string) => void;
  lastAgentMessage?: string;
  insuranceType?: string;
}

const VoiceChatIntegration: React.FC<VoiceChatIntegrationProps> = ({
  onSendMessage,
  onReceiveResponse,
  lastAgentMessage,
  insuranceType = ''
}) => {
  const lastProcessedMessageRef = useRef<string>('');

  // Un seul agent vocal masculin pour toutes les assurances
  const expertGender = 'male';
  const expertName = 'Conseiller AssureAI';

  console.log(`🎭 Agent vocal: ${expertName} (${expertGender}) pour ${insuranceType}`);

  const handleTranscript = useCallback((transcript: string) => {
    console.log('🎤 Transcription reçue:', transcript);
    if (transcript && transcript.trim().length > 0) {
      const cleanMessage = transcript.trim();
      console.log('💬 Envoi du message au chat:', cleanMessage);
      onSendMessage(cleanMessage);
    }
  }, [onSendMessage]);

  const voice = useElevenLabsVoice({
    onTranscript: handleTranscript,
    language: 'fr-FR',
    expertGender,
    expertName
  });

  useEffect(() => {
    if (lastAgentMessage && lastAgentMessage.trim() && lastAgentMessage !== lastProcessedMessageRef.current) {
      console.log(`🤖 Nouveau message détecté:`, lastAgentMessage.substring(0, 50) + '...');
      lastProcessedMessageRef.current = lastAgentMessage;

      setTimeout(() => {
        voice.speak(lastAgentMessage);
        if (onReceiveResponse) {
          onReceiveResponse(lastAgentMessage);
        }
      }, 100);
    }
  }, [lastAgentMessage, voice.speak, onReceiveResponse]);

  useEffect(() => {
    if (!lastAgentMessage || lastAgentMessage.trim() === '') {
      lastProcessedMessageRef.current = '';
    }
  }, [lastAgentMessage]);

  return (
    <div className="space-y-4">
      <SimpleVoiceControls
        isListening={voice.isListening}
        isSpeaking={voice.isSpeaking}
        isSupported={voice.isSupported}
        onStartListening={voice.startListening}
        onStopListening={voice.stopListening}
        onStopSpeaking={voice.stopSpeaking}
        onReplayLastMessage={voice.replayLastMessage}
        hasLastMessage={voice.hasLastMessage}
      />
    </div>
  );
};

export default VoiceChatIntegration;
