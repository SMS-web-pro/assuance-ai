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
  // Utiliser une ref pour éviter les boucles infinies
  const lastProcessedMessageRef = useRef<string>('');

  // Déterminer le genre de l'agent selon le type d'assurance avec type strict
  const getExpertGender = useCallback((type: string): 'male' | 'female' => {
    const typeMapping: Record<string, 'male' | 'female'> = {
      'Assurance Auto': 'male',
      // Marc Dubois
      'Assurance Habitation': 'female',
      // Sophie Martin
      'Assurance Santé': 'female',
      // Dr. Claire Rousseau
      'Assurance Moto': 'male',
      // Alex Moreau
      'Assurance Emprunteur': 'male',
      // Pierre Delacroix
      'Assurance Voyage': 'female' // Camille Durand
    };
    return typeMapping[type] || 'female';
  }, []);

  // Obtenir le nom de l'expert selon le type d'assurance
  const getExpertName = useCallback((type: string): string => {
    const nameMapping: Record<string, string> = {
      'Assurance Auto': 'Marc Dubois',
      'Assurance Habitation': 'Sophie Martin',
      'Assurance Santé': 'Dr. Claire Rousseau',
      'Assurance Moto': 'Alex Moreau',
      'Assurance Emprunteur': 'Pierre Delacroix',
      'Assurance Voyage': 'Camille Durand'
    };
    return nameMapping[type] || 'Agent';
  }, []);
  const expertGender = getExpertGender(insuranceType);
  const expertName = getExpertName(insuranceType);
  console.log(`🎭 Agent ${expertName} (${expertGender}) pour ${insuranceType}`);

  // Fonction pour traiter la transcription et l'envoyer au chat
  const handleTranscript = useCallback((transcript: string) => {
    console.log('🎤 Transcription reçue:', transcript);
    if (transcript && transcript.trim().length > 0) {
      // Nettoyer et envoyer le message au chat
      const cleanMessage = transcript.trim();
      console.log('💬 Envoi du message au chat:', cleanMessage);
      onSendMessage(cleanMessage);
    }
  }, [onSendMessage]);

  // Initialiser le système vocal avec le bon genre d'expert
  const voice = useElevenLabsVoice({
    onTranscript: handleTranscript,
    language: 'fr-FR',
    expertGender: expertGender,
    expertName: expertName
  });

  // Effet pour traiter les nouveaux messages de l'agent - VERSION CORRIGÉE
  useEffect(() => {
    // Vérifier si on a un nouveau message et s'il est différent du dernier traité
    if (lastAgentMessage && lastAgentMessage.trim() && lastAgentMessage !== lastProcessedMessageRef.current) {
      console.log(`🤖 Nouveau message de l'agent ${expertName} (${expertGender}) détecté:`, lastAgentMessage.substring(0, 50) + '...');

      // Marquer ce message comme traité AVANT de le faire parler
      lastProcessedMessageRef.current = lastAgentMessage;

      // Faire parler le message avec un petit délai pour éviter les conflits
      setTimeout(() => {
        voice.speak(lastAgentMessage);
        if (onReceiveResponse) {
          onReceiveResponse(lastAgentMessage);
        }
      }, 100);
    }
  }, [lastAgentMessage, voice.speak, onReceiveResponse, expertName, expertGender]);

  // Réinitialiser la ref quand le type d'assurance change (détecté par un message vide)
  useEffect(() => {
    if (!lastAgentMessage || lastAgentMessage.trim() === '') {
      console.log(`🔄 Réinitialisation du message de référence pour ${expertName}`);
      lastProcessedMessageRef.current = '';
    }
  }, [lastAgentMessage, expertName]);
  return <div className="space-y-4">
      <SimpleVoiceControls isListening={voice.isListening} isSpeaking={voice.isSpeaking} isSupported={voice.isSupported} onStartListening={voice.startListening} onStopListening={voice.stopListening} onStopSpeaking={voice.stopSpeaking} onReplayLastMessage={voice.replayLastMessage} hasLastMessage={voice.hasLastMessage} />
      
      {/* Message d'aide avec informations sur l'agent */}
      
    </div>;
};
export default VoiceChatIntegration;