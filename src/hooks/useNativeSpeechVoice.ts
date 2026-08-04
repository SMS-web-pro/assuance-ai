
import { useState, useRef, useCallback, useEffect } from 'react';

interface UseNativeSpeechVoiceProps {
  onTranscript?: (text: string) => void;
  language?: string;
  expertGender?: 'male' | 'female';
  expertName?: string;
  isActive?: boolean;
}

// ============================================================
// CONFIGURATION VOCALE - UNE SEULE VOIX MASCULINE
// ============================================================

const VOICE_CONFIG = {
  pitch: 0.88,    // Légèrement grave, masculin
  rate: 0.90,     // Légèrement lent, clair et lisible
  volume: 1.0
};

// Patterns de voix masculines françaises (triées par qualité)
const MALE_VOICE_NAMES = [
  // Voix Microsoft de qualité (disponibles sur Windows/Edge)
  'Microsoft Thomas - French (France)',
  'Microsoft Antoine - French (Canada)',
  'Thomas',
  'Henri',
  'Paul',
  'Jacques',
  'Lucas',
  'Antoine',
  'Nicolas',
  'Philippe',
  'Michel',
  'Pierre',
  'Jean',
  'Marc',
  'Arthur',
  'Maxime',
  'Mathieu',
  'Vincent',
  'male'
];

// ============================================================
// SÉLECTION DE LA MEILLEURE VOIX MASCULINE
// ============================================================

let cachedMaleVoice: SpeechSynthesisVoice | null = null;

function findBestMaleVoice(): SpeechSynthesisVoice | null {
  // Cache pour éviter de rechercher à chaque fois
  if (cachedMaleVoice) return cachedMaleVoice;

  const allVoices = speechSynthesis.getVoices();
  if (allVoices.length === 0) return null;

  // 1. Chercher par nom exact parmi les voix françaises
  const frenchVoices = allVoices.filter(v => v.lang.startsWith('fr'));

  for (const preferredName of MALE_VOICE_NAMES) {
    const match = frenchVoices.find(v => 
      v.name.toLowerCase().includes(preferredName.toLowerCase())
    );
    if (match) {
      cachedMaleVoice = match;
      console.log(`✅ Voix masculine sélectionnée: ${match.name} (${match.lang})`);
      return match;
    }
  }

  // 2. Fallback: première voix française disponible
  if (frenchVoices.length > 0) {
    cachedMaleVoice = frenchVoices[0];
    console.log(`⚠️ Fallback voix française: ${frenchVoices[0].name} (${frenchVoices[0].lang})`);
    return frenchVoices[0];
  }

  // 3. Dernier fallback: première voix disponible
  cachedMaleVoice = allVoices[0];
  console.log(`⚠️ Fallback voix globale: ${allVoices[0]?.name}`);
  return allVoices[0];
}

// ============================================================
// HOOK PRINCIPAL
// ============================================================

export const useNativeSpeechVoice = ({ 
  onTranscript, 
  language = 'fr-FR',
  expertGender = 'male',
  expertName = '',
  isActive = false
}: UseNativeSpeechVoiceProps = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [lastMessage, setLastMessage] = useState<string>('');
  
  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isManualStopRef = useRef<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialiser le support vocal
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setIsSupported(false);
      return;
    }

    // Préchauffer les voix
    const loadVoices = () => {
      speechSynthesis.getVoices();
      findBestMaleVoice();
    };

    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
      speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Prononcer un texte
  const speak = useCallback(async (text: string, onEnd?: () => void) => {
    if (!text.trim() || !window.speechSynthesis) return;
    
    try {
      speechSynthesis.cancel();
      
      setIsSpeaking(true);
      setLastMessage(text);
      
      const voice = findBestMaleVoice();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      if (voice) {
        utterance.voice = voice;
      }
      
      utterance.pitch = VOICE_CONFIG.pitch;
      utterance.rate = VOICE_CONFIG.rate;
      utterance.volume = VOICE_CONFIG.volume;
      utterance.lang = language;
      
      console.log(`🔊 Lecture: "${text.substring(0, 30)}..." avec ${voice?.name || 'défaut'}`);
      
      utterance.onend = () => {
        setIsSpeaking(false);
        utteranceRef.current = null;
        onEnd?.();
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
        setIsSpeaking(false);
        utteranceRef.current = null;
      };
      
      utteranceRef.current = utterance;
      speechSynthesis.speak(utterance);
      
    } catch (error) {
      console.error('Speak error:', error);
      setIsSpeaking(false);
    }
  }, [language]);

  // Arrêter la lecture
  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    utteranceRef.current = null;
  }, []);

  // Rejouer le dernier message
  const replayLastMessage = useCallback(() => {
    if (lastMessage) {
      speak(lastMessage);
    }
  }, [lastMessage, speak]);

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

  // Nettoyer au démontage
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  return {
    isListening,
    isSpeaking,
    isSupported,
    lastMessage,
    speak,
    stopSpeaking,
    replayLastMessage,
    startListening,
    stopListening
  };
};
