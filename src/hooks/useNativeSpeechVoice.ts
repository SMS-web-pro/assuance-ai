
import { useState, useRef, useCallback, useEffect } from 'react';

interface UseNativeSpeechVoiceProps {
  onTranscript?: (text: string) => void;
  language?: string;
  expertGender?: 'male' | 'female';
  expertName?: string;
  isActive?: boolean;
}

// ============================================================
// CONFIGURATION DES VOIX PAR AGENT
// ============================================================

interface AgentVoiceProfile {
  // Pitch: 0.1 (grave) à 2.0 (aigu). Défaut: 1.0
  pitch: number;
  // Rate: 0.1 (lent) à 10 (rapide). Défaut: 1.0
  rate: number;
  // Volume: 0 (muet) à 1 (max). Défaut: 1.0
  volume: number;
  // Index de la voix préférée dans la liste des voix françaises (0-based)
  voicePreferenceIndex: number;
  // Langues préférées (dans l'ordre de priorité)
  preferredLangs: string[];
}

const AGENT_PROFILES: Record<string, AgentVoiceProfile> = {
  // === HOMMES ===
  'Marc Dubois': {
    pitch: 0.85,    // Plus grave
    rate: 0.92,     // Légèrement plus lent, posé
    volume: 1.0,
    voicePreferenceIndex: 0,
    preferredLangs: ['fr-FR', 'fr-CA', 'fr-BE', 'fr']
  },
  'Alex Moreau': {
    pitch: 1.05,    // Légèrement aigu, jeune
    rate: 1.08,     // Plus rapide, dynamique
    volume: 1.0,
    voicePreferenceIndex: 1,
    preferredLangs: ['fr-CA', 'fr-FR', 'fr-BE', 'fr']
  },
  'Pierre Delacroix': {
    pitch: 0.75,    // Très grave, sérieux
    rate: 0.85,     // Lent, expérimenté
    volume: 0.95,
    voicePreferenceIndex: 2,
    preferredLangs: ['fr-BE', 'fr-FR', 'fr-CA', 'fr']
  },

  // === FEMMES ===
  'Sophie Martin': {
    pitch: 1.15,    // Légèrement aigu, chaleureux
    rate: 0.95,     // Doux
    volume: 1.0,
    voicePreferenceIndex: 0,
    preferredLangs: ['fr-FR', 'fr-CA', 'fr-BE', 'fr']
  },
  'Dr. Claire Rousseau': {
    pitch: 1.0,     // Neutre, professionnel
    rate: 0.9,      // Posé, expert
    volume: 1.0,
    voicePreferenceIndex: 1,
    preferredLangs: ['fr-CA', 'fr-FR', 'fr-BE', 'fr']
  },
  'Camille Durand': {
    pitch: 1.25,    // Plus aigu, énergique
    rate: 1.05,     // Rapide, vivant
    volume: 1.0,
    voicePreferenceIndex: 2,
    preferredLangs: ['fr-FR', 'fr-CA', 'fr-BE', 'fr']
  }
};

const DEFAULT_PROFILE: AgentVoiceProfile = {
  pitch: 1.0,
  rate: 1.0,
  volume: 1.0,
  voicePreferenceIndex: 0,
  preferredLangs: ['fr-FR', 'fr']
};

// ============================================================
// SÉLECTION DE VOIX OPTIMISÉE
// ============================================================

let cachedFrenchVoices: SpeechSynthesisVoice[] = [];

function getFrenchVoices(): SpeechSynthesisVoice[] {
  if (cachedFrenchVoices.length > 0) return cachedFrenchVoices;
  
  const allVoices = speechSynthesis.getVoices();
  
  // Filtrer les voix françaises
  const frenchVoices = allVoices.filter(v => 
    v.lang.startsWith('fr') || v.lang === 'fr'
  );
  
  if (frenchVoices.length > 0) {
    cachedFrenchVoices = frenchVoices;
    return frenchVoices;
  }
  
  // Fallback: toutes les voix disponibles
  cachedFrenchVoices = allVoices;
  return allVoices;
}

function selectVoiceForAgent(
  agentName: string,
  profile: AgentVoiceProfile
): SpeechSynthesisVoice | null {
  const frenchVoices = getFrenchVoices();
  if (frenchVoices.length === 0) return null;
  
  // Essayer de trouver une voix correspondant à la langue préférée
  for (const preferredLang of profile.preferredLangs) {
    const matchingVoices = frenchVoices.filter(v => 
      v.lang === preferredLang || v.lang.startsWith(preferredLang)
    );
    
    if (matchingVoices.length > 0) {
      // Utiliser l'index de préférence (mod par le nombre de voix disponibles)
      const voiceIndex = profile.voicePreferenceIndex % matchingVoices.length;
      return matchingVoices[voiceIndex];
    }
  }
  
  // Fallback: utiliser l'index de préférence sur toutes les voix
  const voiceIndex = profile.voicePreferenceIndex % frenchVoices.length;
  return frenchVoices[voiceIndex];
}

// ============================================================
// HOOK PRINCIPAL
// ============================================================

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
  
  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isManualStopRef = useRef<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Charger les voix au montage
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setIsSupported(false);
      return;
    }

    // Charger les voix (elles peuvent ne pas être disponibles immédiatement)
    const loadVoices = () => {
      getFrenchVoices();
    };

    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
      speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Obtenir le profil de l'agent
  const getAgentProfile = useCallback((): AgentVoiceProfile => {
    return AGENT_PROFILES[expertName] || DEFAULT_PROFILE;
  }, [expertName]);

  // Prononcer un texte avec Web Speech API
  const speak = useCallback(async (text: string, onEnd?: () => void) => {
    if (!text.trim() || !window.speechSynthesis) return;
    
    try {
      // Arrêter toute lecture en cours
      speechSynthesis.cancel();
      
      setIsSpeaking(true);
      setLastMessage(text);
      
      const profile = getAgentProfile();
      const selectedVoice = selectVoiceForAgent(expertName, profile);
      
      console.log(`🔊 Voice: ${selectedVoice?.name || 'default'} (${selectedVoice?.lang}) for ${expertName} - pitch:${profile.pitch} rate:${profile.rate}`);
      
      // Créer l'utterance
      const utterance = new SpeechSynthesisUtterance(text);
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      utterance.pitch = profile.pitch;
      utterance.rate = profile.rate;
      utterance.volume = profile.volume;
      utterance.lang = language;
      
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
  }, [expertName, language, getAgentProfile]);

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
