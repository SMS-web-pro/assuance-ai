
import { useState, useRef, useCallback, useEffect } from 'react';

interface UseNativeSpeechVoiceProps {
  onTranscript?: (text: string) => void;
  language?: string;
  expertGender?: 'male' | 'female';
  expertName?: string;
  isActive?: boolean;
}

// ============================================================
// CONFIGURATION VOCALE - VOIX FÉMININE NATURELLE
// ============================================================

const VOICE_CONFIG = {
  pitch: 1.0,      // Neutre, naturel
  rate: 0.92,      // Vitesse normale, professionnel
  volume: 1.0
};

// Patterns de voix féminines françaises (triées par qualité)
const FEMALE_VOICE_NAMES = [
  'Microsoft Marie - French (France)',
  'Microsoft Hortense - French (France)',
  'Marie', 'Hortense', 'Denise', 'Eloise', 'Sophie',
  'Camille', 'Julie', 'Amelie', 'Manon', 'Lea', 'Chloe',
  'Google français', 'Google France French', 'Google français (fr-FR)',
  'Marie (fr-FR)', 'french female', 'français'
];

// ============================================================
// NETTOYAGE DU TEXTE POUR SYNTHÈSE VOCALE
// ============================================================

function cleanTextForSpeech(text: string): string {
  if (!text) return '';
  
  let cleaned = text;
  
  // ========== ÉTAPE 1: SUPPRIMER LA SECTION FICHE RÉCAPITULATIVE ==========
  cleaned = cleaned.replace(/📋\s*FICHE\s*RÉCAPITULATIVE[\s\S]*/gi, '');
  cleaned = cleaned.replace(/FICHE\s*RÉCAPITULATIVE[\s\S]*/gi, '');
  cleaned = cleaned.replace(/#\s*FICHE[\s\S]*/gi, '');
  cleaned = cleaned.replace(/\*\*FICHE[\s\S]*/gi, '');
  
  // ========== ÉTAPE 2: CONVERTIR LES SYMBOLES EN MOTS (AVANT suppression) ==========
  // Pourcentages: "15%" → "15 pour cent"
  cleaned = cleaned.replace(/(\d+)\s*%/g, '$1 pour cent');
  // Devises
  cleaned = cleaned.replace(/€/g, ' euros');
  cleaned = cleaned.replace(/\$/g, ' dollars');
  cleaned = cleaned.replace(/£/g, ' livres');
  // Slash → "et" (Bonus/Malus → Bonus et Malus)
  cleaned = cleaned.replace(/(\w+)\s*\/\s*(\w+)/g, '$1 et $2');
  // Symboles en mots
  cleaned = cleaned.replace(/&/g, ' et ');
  cleaned = cleaned.replace(/@/g, ' arobase ');
  cleaned = cleaned.replace(/\+/g, ' plus ');
  
  // ========== ÉTAPE 3: SUPPRIMER LES BLOCS DE CODE ==========
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
  cleaned = cleaned.replace(/`[^`]*`/g, '');
  
  // ========== ÉTAPE 4: SUPPRIMER MARKDOWN ==========
  cleaned = cleaned.replace(/\*\*\*/g, '');
  cleaned = cleaned.replace(/\*\*/g, '');
  cleaned = cleaned.replace(/\*/g, '');
  cleaned = cleaned.replace(/___/g, '');
  cleaned = cleaned.replace(/__/g, '');
  cleaned = cleaned.replace(/_/g, '');
  cleaned = cleaned.replace(/^#{1,6}\s/gm, '');
  
  // ========== ÉTAPE 5: SUPPRIMER LIGNES HORIZONTALES ==========
  cleaned = cleaned.replace(/---+/g, '');
  cleaned = cleaned.replace(/___+/g, '');
  
  // ========== ÉTAPE 6: SUPPRIMER EMOJIS ==========
  cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}]/gu, '');
  cleaned = cleaned.replace(/[\u{1F300}-\u{1F5FF}]/gu, '');
  cleaned = cleaned.replace(/[\u{1F680}-\u{1F6FF}]/gu, '');
  cleaned = cleaned.replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '');
  cleaned = cleaned.replace(/[\u{2600}-\u{26FF}]/gu, '');
  cleaned = cleaned.replace(/[\u{2700}-\u{27BF}]/gu, '');
  
  // ========== ÉTAPE 7: SUPPRIMER SYMBOLES RESTANTS ==========
  cleaned = cleaned.replace(/[#@\^=<>{}[\]\\|~`]/g, '');
  
  // ========== ÉTAPE 8: PONCTUATION NATURELLE ==========
  // Points de suspension → pause
  cleaned = cleaned.replace(/\.\.\./g, ' . ');
  cleaned = cleaned.replace(/\.\./g, ' . ');
  // Nouvelles lignes → pauses (les bullet points, listes, etc.)
  cleaned = cleaned.replace(/\n\s*\n/g, ' . ');
  cleaned = cleaned.replace(/\n/g, ' , ');
  
  // ========== ÉTAPE 9: NETTOYAGE FINAL ==========
  cleaned = cleaned.replace(/\s+/g, ' ');
  cleaned = cleaned.replace(/ \./g, '.');
  cleaned = cleaned.replace(/ ,/g, ',');
  cleaned = cleaned.replace(/ ;/g, ';');
  cleaned = cleaned.replace(/ !/g, '!');
  cleaned = cleaned.replace(/ \?/g, '?');
  cleaned = cleaned.replace(/ :/g, ':');
  cleaned = cleaned.replace(/ - /g, ' ');
  cleaned = cleaned.replace(/ -/g, ' ');
  cleaned = cleaned.replace(/- /g, ' ');
  cleaned = cleaned.trim();
  
  return cleaned;
}

// ============================================================
// SÉLECTION DE LA MEILLEURE VOIX
// ============================================================

let cachedVoice: SpeechSynthesisVoice | null = null;
let voiceFound = false;

function findBestVoice(): SpeechSynthesisVoice | null {
  if (voiceFound && cachedVoice) return cachedVoice;

  const allVoices = speechSynthesis.getVoices();
  if (allVoices.length === 0) return null;

  console.log(`🔍 Recherche voix parmi ${allVoices.length} voix...`);

  // 1. Chercher par nom exact (priorité)
  for (const preferredName of FEMALE_VOICE_NAMES) {
    const match = allVoices.find(v => {
      const name = v.name.toLowerCase();
      const lang = v.lang.toLowerCase();
      return (name.includes(preferredName.toLowerCase()) || 
              lang.includes(preferredName.toLowerCase())) && 
             lang.startsWith('fr');
    });
    
    if (match) {
      cachedVoice = match;
      voiceFound = true;
      console.log(`✅ Voix sélectionnée: "${match.name}" (${match.lang})`);
      return match;
    }
  }

  // 2. Première voix française disponible
  const frenchVoices = allVoices.filter(v => v.lang.startsWith('fr'));
  if (frenchVoices.length > 0) {
    cachedVoice = frenchVoices[0];
    voiceFound = true;
    console.log(`⚠️ Fallback voix française: "${frenchVoices[0].name}" (${frenchVoices[0].lang})`);
    return frenchVoices[0];
  }

  // 3. Première voix globale
  cachedVoice = allVoices[0];
  voiceFound = true;
  console.log(`⚠️ Fallback global: "${allVoices[0]?.name}"`);
  return allVoices[0];
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
  const initDoneRef = useRef<boolean>(false);

  // Initialiser (UNE SEULE FOIS)
  useEffect(() => {
    if (initDoneRef.current) return;
    initDoneRef.current = true;
    
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setIsSupported(false);
      return;
    }

    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      console.log(`📋 ${voices.length} voix disponibles`);
      if (voices.length > 0 && !voiceFound) {
        findBestVoice();
      }
    };

    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;

    // Rechargement forcé (mobile parfois lent)
    setTimeout(loadVoices, 300);

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
      
      // Nettoyer le texte avant de lire
      const cleanedText = cleanTextForSpeech(text);
      
      // Si le texte est vide après nettoyage, ne rien dire
      if (!cleanedText.trim()) {
        setIsSpeaking(false);
        onEnd?.();
        return;
      }
      
      setLastMessage(cleanedText);
      
      const voice = findBestVoice();
      
      const utterance = new SpeechSynthesisUtterance(cleanedText);
      
      if (voice) {
        utterance.voice = voice;
        console.log(`🔊 Voix: "${voice.name}" (${voice.lang})`);
      }
      
      utterance.pitch = VOICE_CONFIG.pitch;
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
