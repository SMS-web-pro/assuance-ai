
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
// SÉLECTION DE VOIX GENRE-AWARE
// ============================================================

// Noms de voix masculines connus (français et internationales)
const MALE_VOICE_PATTERNS = [
  'thomas', 'paul', 'henri', 'jacques', 'lucas', 'antoine', 'gerard',
  'nicolas', 'philippe', 'michel', 'pierre', 'jean', 'marc', 'alex',
  'denis', 'daniel', 'robert', 'yves', 'arthur', 'maxime', 'mathieu',
  'vincent', 'sebastien', 'olivier', 'stephane', 'eric', 'francois',
  'male', 'homme', 'homme_1', 'homme_2', 'male_1', 'male_2',
  'david', 'kevin', 'sylvain', 'cedric', 'fabien', 'rachid', 'karim',
  'tariq', 'mohamed', 'ahmed', 'omar', 'ali', 'hassan'
];

// Noms de voix féminines connus
const FEMALE_VOICE_PATTERNS = [
  'amelie', 'marie', 'denise', 'sylvie', 'helene', 'julie', 'sophie',
  'claire', 'camille', 'isabelle', 'nathalie', 'cecile', 'michelle',
  'anne', 'elisabeth', 'valerie', 'sarah', 'laura', 'chloe', 'lea',
  'manon', 'elena', 'marie-claire', 'virginie', 'brigitte', 'diane',
  'female', 'femme', 'femme_1', 'femme_2', 'female_1', 'female_2',
  'audrey', 'catherine', 'christine', 'damien_f', 'emilie', 'fanny',
  'flavie', 'gaelle', 'ines', 'josephine', 'laetitia', 'morgane',
  'nadia', 'naima', 'olivia', 'pascale', 'priscilla', 'rosalie'
];

function detectVoiceGender(voice: SpeechSynthesisVoice): 'male' | 'female' | 'unknown' {
  const name = voice.name.toLowerCase();
  
  // Vérifier les patterns masculins
  for (const pattern of MALE_VOICE_PATTERNS) {
    if (name.includes(pattern)) return 'male';
  }
  
  // Vérifier les patterns féminins
  for (const pattern of FEMALE_VOICE_PATTERNS) {
    if (name.includes(pattern)) return 'female';
  }
  
  // Fallback: certains systèmes ont des voix nommées "Microsoft French (Male)" etc.
  if (name.includes('male') || name.includes('homme') || name.includes('masculin')) return 'male';
  if (name.includes('female') || name.includes('femme') || name.includes('feminin')) return 'female';
  
  return 'unknown';
}

function selectVoiceForAgent(
  agentName: string,
  profile: AgentVoiceProfile,
  gender: 'male' | 'female'
): SpeechSynthesisVoice | null {
  const allVoices = speechSynthesis.getVoices();
  if (allVoices.length === 0) return null;
  
  // 1. Filtrer les voix françaises
  const frenchVoices = allVoices.filter(v => 
    v.lang.startsWith('fr') || v.lang === 'fr'
  );
  
  const voicesToSearch = frenchVoices.length > 0 ? frenchVoices : allVoices;
  
  // 2. Pour chaque langue préférée, essayer de trouver une voix du bon genre
  for (const preferredLang of profile.preferredLangs) {
    const langVoices = voicesToSearch.filter(v => 
      v.lang === preferredLang || v.lang.startsWith(preferredLang)
    );
    
    if (langVoices.length === 0) continue;
    
    // Filtrer par genre
    const genderVoices = langVoices.filter(v => detectVoiceGender(v) === gender);
    
    if (genderVoices.length > 0) {
      // Retourner la première voix du bon genre pour cette langue
      return genderVoices[0];
    }
  }
  
  // 3. Fallback: essayer toutes les voix françaises avec le bon genre
  const allGenderVoices = voicesToSearch.filter(v => detectVoiceGender(v) === gender);
  if (allGenderVoices.length > 0) {
    return allGenderVoices[0];
  }
  
  // 4. Dernier fallback: première voix disponible (pitch s'occupera du genre)
  return voicesToSearch[0] || null;
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
      const selectedVoice = selectVoiceForAgent(expertName, profile, expertGender);
      
      console.log(`🔊 Voice: ${selectedVoice?.name || 'default'} (${selectedVoice?.lang}) [${detectVoiceGender(selectedVoice as SpeechSynthesisVoice)}] for ${expertName} (${expertGender}) - pitch:${profile.pitch} rate:${profile.rate}`);
      
      // Créer l'utterance
      const utterance = new SpeechSynthesisUtterance(text);
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      // Ajuster le pitch selon le genre pour renforcer la perception
      // Si la voix détectée ne correspond pas au genre souhaité, ajuster le pitch
      const detectedGender = selectedVoice ? detectVoiceGender(selectedVoice) : 'unknown';
      let finalPitch = profile.pitch;
      
      if (detectedGender !== 'unknown' && detectedGender !== expertGender) {
        // La voix n'est pas du bon genre, ajuster le pitch en conséquence
        if (expertGender === 'male') {
          // Voix féminine utilisée pour un homme → baisser le pitch
          finalPitch = Math.max(0.1, profile.pitch - 0.3);
          console.log(`🔧 Pitch ajusté vers ${finalPitch} (voix féminine pour homme)`);
        } else {
          // Voix masculine utilisée pour une femme → augmenter le pitch
          finalPitch = Math.min(2.0, profile.pitch + 0.3);
          console.log(`🔧 Pitch ajusté vers ${finalPitch} (voix masculine pour femme)`);
        }
      }
      
      utterance.pitch = finalPitch;
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
  }, [expertName, expertGender, language, getAgentProfile]);

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
