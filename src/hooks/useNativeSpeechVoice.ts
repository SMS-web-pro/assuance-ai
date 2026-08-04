
import { useState, useRef, useCallback } from 'react';
import { edgeTTSService, AgentVoiceConfig } from '@/services/edgeTTSService';

interface UseNativeSpeechVoiceProps {
  onTranscript?: (text: string) => void;
  language?: string;
  expertGender?: 'male' | 'female';
  expertName?: string;
  isActive?: boolean;
}

export const useNativeSpeechVoice = ({ 
  onTranscript, 
  language = 'fr-FR',
  expertGender = 'female',
  expertName = '',
  isActive = false
}: UseNativeSpeechVoiceProps = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [lastMessage, setLastMessage] = useState<string>('');
  const [voiceConfig, setVoiceConfig] = useState<AgentVoiceConfig | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const isManualStopRef = useRef<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialiser la configuration de voix pour l'agent
  const initVoiceConfig = useCallback(() => {
    if (expertName) {
      const config = edgeTTSService.getVoiceConfig(expertName);
      setVoiceConfig(config);
      return config;
    }
    return null;
  }, [expertName]);

  // Prononcer un texte avec Edge TTS
  const speak = useCallback(async (text: string, onEnd?: () => void) => {
    if (!text.trim()) return;
    
    try {
      setIsSpeaking(true);
      setLastMessage(text);
      
      const agentName = expertName || '';
      
      await edgeTTSService.speak(text, agentName, () => {
        setIsSpeaking(false);
        onEnd?.();
      });
      
    } catch (error) {
      console.error('Edge TTS error:', error);
      setIsSpeaking(false);
    }
  }, [expertName]);

  // Arrêter la lecture
  const stopSpeaking = useCallback(() => {
    edgeTTSService.stop();
    setIsSpeaking(false);
  }, []);

  // Démarrer l'écoute vocale
  const startListening = useCallback(async () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        setIsSupported(false);
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        isManualStopRef.current = false;
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        onTranscript?.(transcript);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === 'aborted' || event.error === 'no-speech') {
          if (!isManualStopRef.current) {
            setTimeout(() => startListening(), 500);
          }
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (!isManualStopRef.current && recognitionRef.current) {
          setTimeout(() => startListening(), 100);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      
    } catch (error) {
      console.error('Speech recognition error:', error);
      setIsSupported(false);
    }
  }, [language, onTranscript]);

  // Arrêter l'écoute
  const stopListening = useCallback(() => {
    isManualStopRef.current = true;
    
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    
    setIsListening(false);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Initialiser la voix au montage
  useState(() => {
    initVoiceConfig();
  });

  return {
    isListening,
    isSpeaking,
    isSupported,
    lastMessage,
    voiceConfig,
    speak,
    stopSpeaking,
    startListening,
    stopListening
  };
};
