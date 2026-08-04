
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
  pitch: 0.85,    // Grave, masculin
  rate: 0.88,     // Lent pour clarté
  volume: 1.0
};

// ============================================================
// SÉLECTION DE VOIX AVANCÉE (basée sur useOptimizedVoice)
// ============================================================

let cachedMaleVoice: SpeechSynthesisVoice | null = null;

function selectBestMaleFrenchVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (cachedMaleVoice) return cachedMaleVoice;
  if (voices.length === 0) return null;

  // 1. Filtrer les voix françaises natives (locale = meilleure qualité)
  const nativeFrenchVoices = voices.filter(voice => {
    const lang = voice.lang.toLowerCase();
    const name = voice.name.toLowerCase();
    return (lang === 'fr-fr' || lang === 'fr') && 
           !name.includes('english') && 
           !name.includes('anglais') &&
           !name.includes('en-');
  });

  console.log(`🔍 Voix françaises natives trouvées: ${nativeFrenchVoices.length}`);

  if (nativeFrenchVoices.length === 0) {
    // Fallback: toutes les voix françaises
    const allFrenchVoices = voices.filter(v => v.lang.startsWith('fr'));
    if (allFrenchVoices.length > 0) {
      cachedMaleVoice = allFrenchVoices[0];
      return cachedMaleVoice;
    }
    cachedMaleVoice = voices[0];
    return cachedMaleVoice;
  }

  // 2. Scoring pour trouver la meilleure voix masculine
  const maleKeywords = ['paul', 'thomas', 'henri', 'bernard', 'françois', 'michel', 'pierre', 'daniel', 'jacques', 'lucas', 'antoine', 'nicolas', 'philippe', 'marc', 'arthur', 'maxime', 'mathieu', 'vincent', 'sebastien', 'olivier', 'stephane', 'eric', 'david', 'kevin', 'sylvain', 'cedric', 'fabien'];
  const femaleKeywords = ['julie', 'marie', 'sophie', 'claire', 'florence', 'virginie', 'hortense', 'amélie', 'aurélie', 'denise', 'sylvie', 'helene', 'cecile', 'michelle', 'anne', 'elisabeth', 'valerie', 'sarah', 'laura', 'chloe', 'lea', 'manon', 'elena'];

  const scoredVoices = nativeFrenchVoices.map(voice => {
    let score = 100;
    const name = voice.name.toLowerCase();

    // Bonus voix Microsoft premium
    if (name.includes('microsoft')) {
      if (name.includes('paul')) score += 180;
      else if (name.includes('henri')) score += 160;
    }

    // Bonus voix Apple (iOS/macOS)
    if (name.includes('thomas')) score += 150;

    // Bonus pour voix masculine
    const matchingMale = maleKeywords.find(k => name.includes(k));
    if (matchingMale) {
      score += 120;
      console.log(`✨ Voix masculine identifiée: ${voice.name} (${matchingMale})`);
    }

    // Pénalité forte pour voix féminine
    const matchingFemale = femaleKeywords.find(k => name.includes(k));
    if (matchingFemale) {
      score -= 150;
    }

    // Bonus qualité
    if (name.includes('enhanced') || name.includes('premium') || name.includes('hd')) {
      score += 40;
    }
    if (voice.localService) {
      score += 50;
    }

    return { voice, score };
  });

  scoredVoices.sort((a, b) => b.score - a.score);

  console.log(`🏆 Top 3 voix masculines:`);
  scoredVoices.slice(0, 3).forEach((v, i) => {
    console.log(`  ${i + 1}. ${v.voice.name} - Score: ${v.score}`);
  });

  cachedMaleVoice = scoredVoices[0]?.voice || nativeFrenchVoices[0];
  return cachedMaleVoice;
}

// ============================================================
// NETTOYAGE DU TEXTE FRANÇAIS
// ============================================================

function cleanTextForFrenchSpeech(text: string): string {
  if (!text) return '';
  
  let cleaned = text;
  
  const corrections: Record<string, string> = {
    'prenom': 'prénom',
    'numero': 'numéro',
    'telephone': 'téléphone',
    'medecin': 'médecin',
    'securite': 'sécurité',
    'societe': 'société',
    'activite': 'activité',
    'qualite': 'qualité',
    'vehicule': 'véhicule',
    'email': 'courrier électronique',
    'RDV': 'rendez-vous',
    'TVA': 'taxe sur la valeur ajoutée',
    'ok': 'd\'accord',
    'OK': 'd\'accord',
    'Mr': 'Monsieur',
    'Mrs': 'Madame'
  };

  Object.entries(corrections).forEach(([wrong, correct]) => {
    const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
    cleaned = cleaned.replace(regex, correct);
  });

  return cleaned;
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

    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      selectBestMaleFrenchVoice(voices);
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
      
      // Nettoyer le texte pour une meilleure prononciation
      const cleanedText = cleanTextForFrenchSpeech(text);
      setLastMessage(cleanedText);
      
      const voices = speechSynthesis.getVoices();
      const voice = selectBestMaleFrenchVoice(voices);
      
      const utterance = new SpeechSynthesisUtterance(cleanedText);
      
      if (voice) {
        utterance.voice = voice;
      }
      
      utterance.pitch = VOICE_CONFIG.pitch;
      utterance.rate = VOICE_CONFIG.rate;
      utterance.volume = VOICE_CONFIG.volume;
      utterance.lang = language;
      
      console.log(`🔊 Lecture: "${cleanedText.substring(0, 30)}..." avec ${voice?.name || 'défaut'}`);
      
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
