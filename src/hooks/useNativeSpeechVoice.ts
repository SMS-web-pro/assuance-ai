
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
  pitch: 0.78,     // Plus grave pour masquer les voix féminines
  rate: 0.88,      // Légèrement lent, clair et lisible
  volume: 1.0
};

// Patterns de voix masculines - couvre tous les plateformes
const MALE_VOICE_PATTERNS = [
  // Windows / Edge
  'thomas', 'henri', 'paul', 'jacques', 'lucas', 'antoine', 'nicolas',
  'philippe', 'michel', 'pierre', 'jean', 'marc', 'arthur', 'maxime',
  'mathieu', 'vincent', 'sebastien', 'olivier', 'stephane', 'eric',
  'francois', 'david', 'kevin', 'sylvain', 'cedric', 'fabien',
  // Android / Google TTS
  'homme', 'male', 'masculin', 'google france french',
  'google français', 'google fr',
  // iOS
  'thomas (fr', 'paul (fr', 'henri (fr', 'lucas (fr', 'jacques (fr',
  // Generic
  'fr-fr-m', 'fr-m-'
];

// Patterns de voix féminines à éviter
const FEMALE_VOICE_PATTERNS = [
  'amelie', 'marie', 'denise', 'sylvie', 'helene', 'julie', 'sophie',
  'claire', 'camille', 'isabelle', 'nathalie', 'cecile', 'michelle',
  'anne', 'elisabeth', 'valerie', 'sarah', 'laura', 'chloe', 'lea',
  'manon', 'elena', 'virginie', 'brigitte', 'diane', 'audrey',
  'catherine', 'christine', 'emilie', 'fanny', 'ines', 'josephine',
  'femme', 'female', 'feminin', 'voix feminine', 'google uk english female',
  'fr-fr-f', 'fr-f-'
];

// ============================================================
// DÉTECTION GENRE VOIX
// ============================================================

function detectVoiceGender(voice: SpeechSynthesisVoice): 'male' | 'female' | 'unknown' {
  const name = voice.name.toLowerCase();
  const lang = voice.lang.toLowerCase();
  
  // Vérifier d'abord si c'est une voix masculine
  for (const pattern of MALE_VOICE_PATTERNS) {
    if (name.includes(pattern)) return 'male';
  }
  
  // Vérifier si c'est une voix féminine
  for (const pattern of FEMALE_VOICE_PATTERNS) {
    if (name.includes(pattern)) return 'female';
  }
  
  // Heuristique: sur iOS, les voix "français" sans nom spécifique sont souvent féminines
  if (lang.startsWith('fr') && !name.includes('male') && !name.includes('homme')) {
    return 'female'; // Par défaut, considérer comme féminine pour forcer l'ajustement pitch
  }
  
  return 'unknown';
}

// ============================================================
// SÉLECTION VOIX MASCULINE (PERSISTANTE)
// ============================================================

// Cache global persistant - ne JAMAIS être réinitialisé pendant la session
let globalMaleVoice: SpeechSynthesisVoice | null = null;
let globalVoiceFound = false;

function findBestMaleVoice(): SpeechSynthesisVoice | null {
  // Si on a déjà trouvé une voix, la retourner
  if (globalVoiceFound && globalMaleVoice) {
    return globalMaleVoice;
  }

  const allVoices = speechSynthesis.getVoices();
  if (allVoices.length === 0) return null;

  console.log(`🔍 Recherche voix masculine parmi ${allVoices.length} voix...`);

  // 1. Chercher une voix masculine par nom (priorité absolue)
  for (const pattern of MALE_VOICE_PATTERNS) {
    const match = allVoices.find(v => {
      const name = v.name.toLowerCase();
      const lang = v.lang.toLowerCase();
      return (name.includes(pattern) || lang.includes(pattern)) && lang.startsWith('fr');
    });
    
    if (match) {
      globalMaleVoice = match;
      globalVoiceFound = true;
      console.log(`✅ Voix masculine trouvée: "${match.name}" (${match.lang})`);
      return match;
    }
  }

  // 2. Chercher une voix masculine sans filtre de langue
  for (const pattern of MALE_VOICE_PATTERNS) {
    const match = allVoices.find(v => v.name.toLowerCase().includes(pattern));
    if (match) {
      globalMaleVoice = match;
      globalVoiceFound = true;
      console.log(`✅ Voix masculine (non-fr) trouvée: "${match.name}" (${match.lang})`);
      return match;
    }
  }

  // 3. Détecter le genre des voix françaises disponibles
  const frenchVoices = allVoices.filter(v => v.lang.startsWith('fr'));
  
  for (const voice of frenchVoices) {
    const gender = detectVoiceGender(voice);
    if (gender === 'male') {
      globalMaleVoice = voice;
      globalVoiceFound = true;
      console.log(`✅ Voix masculine détectée: "${voice.name}" (${voice.lang})`);
      return voice;
    }
  }

  // 4. Dernier fallback: première voix française + pitch très bas
  if (frenchVoices.length > 0) {
    globalMaleVoice = frenchVoices[0];
    globalVoiceFound = true;
    console.log(`⚠️ Fallback voix française: "${frenchVoices[0].name}" (${frenchVoices[0].lang}) - pitch réduit`);
    return frenchVoices[0];
  }

  // 5. Absolument rien trouvé
  console.log(`❌ Aucune voix française trouvée`);
  return null;
}

// Forcer le rechargement des voix (pour mobile)
function forceVoiceReload(): void {
  globalVoiceFound = false;
  globalMaleVoice = null;
  speechSynthesis.getVoices();
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
  const initDoneRef = useRef<boolean>(false);

  // Initialiser le support vocal (UNE SEULE FOIS)
  useEffect(() => {
    if (initDoneRef.current) return;
    initDoneRef.current = true;
    
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setIsSupported(false);
      return;
    }

    console.log(`🎤 Initialisation voix mobile pour: ${expertName || 'Agent'}`);

    // Sur mobile, les voix sont chargées asynchronement
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      console.log(`📋 ${voices.length} voix disponibles`);
      
      if (voices.length > 0 && !globalVoiceFound) {
        findBestMaleVoice();
      }
    };

    // Premier essai
    loadVoices();

    // Écouter le chargement asynchrone des voix (critique sur mobile)
    speechSynthesis.onvoiceschanged = loadVoices;

    // Forcer un rechargement après un délai (mobile parfois lent)
    setTimeout(() => {
      if (!globalVoiceFound) {
        console.log(`🔄 Rechargement forcé des voix...`);
        forceVoiceReload();
        loadVoices();
      }
    }, 500);

    return () => {
      speechSynthesis.onvoiceschanged = null;
    };
  }, []); // Pas de dépendances - ne jamais ré-exécuter

  // Prononcer un texte
  const speak = useCallback(async (text: string, onEnd?: () => void) => {
    if (!text.trim() || !window.speechSynthesis) return;
    
    try {
      // Toujours annuler en cours
      speechSynthesis.cancel();
      
      setIsSpeaking(true);
      setLastMessage(text);
      
      // Récupérer la voix (cache global)
      let voice = findBestMaleVoice();
      
      // Si pas de voix trouvée, essayer de recharger
      if (!voice) {
        forceVoiceReload();
        voice = findBestMaleVoice();
      }
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      if (voice) {
        utterance.voice = voice;
        console.log(`🔊 Voix: "${voice.name}" (${voice.lang})`);
      } else {
        console.log(`🔊 Voix par défaut (pas de voix masculine trouvée)`);
      }
      
      // Ajuster le pitch si la voix est féminine (pour forcer le son masculin)
      let finalPitch = VOICE_CONFIG.pitch;
      if (voice) {
        const detectedGender = detectVoiceGender(voice);
        if (detectedGender === 'female') {
          // Voix féminine détectée, réduire le pitch drastiquement
          finalPitch = 0.55;
          console.log(`🔧 Pitch réduit à ${finalPitch} (voix féminine détectée)`);
        }
      }
      
      utterance.pitch = finalPitch;
      utterance.rate = VOICE_CONFIG.rate;
      utterance.volume = VOICE_CONFIG.volume;
      utterance.lang = language;
      
      utterance.onend = () => {
        setIsSpeaking(false);
        utteranceRef.current = null;
        onEnd?.();
      };
      
      utterance.onerror = (event) => {
        console.error('Speech error:', event.error);
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
