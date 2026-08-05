
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
  
  // 1. Supprimer TOUTE la section FICHE RÉCAPITULATIVE (ne pas la lire)
  // Catch toutes les variantes: avec/sans emoji, markdown, majuscules, etc.
  cleaned = cleaned.replace(/📋\s*FICHE\s*RÉCAPITULATIVE[\s\S]*/gi, '');
  cleaned = cleaned.replace(/FICHE\s*RÉCAPITULATIVE[\s\S]*/gi, '');
  cleaned = cleaned.replace(/#\s*FICHE[\s\S]*/gi, '');
  cleaned = cleaned.replace(/\*\*FICHE[\s\S]*/gi, '');
  
  // 2. Supprimer les blocs de code
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
  cleaned = cleaned.replace(/`[^`]*`/g, '');
  
  // 3. Supprimer les emojis et symboles visuels
  cleaned = cleaned.replace(/[📋📊✅❌⚠️🔧💡🎯📌🔍📊🎙️🔴🟢🟡🔵]/g, '');
  
  // 4. Supprimer les marqueurs markdown
  cleaned = cleaned.replace(/\*\*\*/g, '');
  cleaned = cleaned.replace(/\*\*/g, '');
  cleaned = cleaned.replace(/\*/g, '');
  cleaned = cleaned.replace(/___/g, '');
  cleaned = cleaned.replace(/__/g, '');
  cleaned = cleaned.replace(/_/g, '');
  
  // 5. Supprimer les symboles techniques
  cleaned = cleaned.replace(/[#@$%^&=<>{}[\]\\|~`]/g, '');
  
  // 6. Convertir les symboles en mots (pour que la voix les lise correctement)
  cleaned = cleaned.replace(/€/g, ' euros');
  cleaned = cleaned.replace(/\$/g, ' dollars');
  // Pourcentages: "15%" → "15 pour cent", "20 %" → "20 pour cent"
  cleaned = cleaned.replace(/(\d+)\s*%/g, '$1 pour cent');
  cleaned = cleaned.replace(/&/g, ' et ');
  cleaned = cleaned.replace(/@/g, ' arobase ');
  
  // 7. Convertir la ponctuation en pauses naturelles (SSML-like)
  // Points de suspension → pause longue
  cleaned = cleaned.replace(/\.\.\./g, ' euh... ');
  // Point → pause courte
  cleaned = cleaned.replace(/\./g, ' . ');
  // Virgule → micro-pause
  cleaned = cleaned.replace(/,/g, ' , ');
  // Point-virgule → pause moyenne
  cleaned = cleaned.replace(/;/g, ' ; ');
  // Point d'exclamation → pause + enthousiasme
  cleaned = cleaned.replace(/!/g, ' ! ');
  // Point d'interrogation → pause
  cleaned = cleaned.replace(/\?/g, ' ? ');
  // Deux points → pause d'attente
  cleaned = cleaned.replace(/:/g, ' : ');
  // Tiret → pause
  cleaned = cleaned.replace(/ - /g, ' . ');
  
  // 8. Nettoyer les espaces multiples et ponctuation excessive
  cleaned = cleaned.replace(/\s+/g, ' ');
  cleaned = cleaned.replace(/ \. /g, '. ');
  cleaned = cleaned.replace(/ , /g, ', ');
  cleaned = cleaned.replace(/ ; /g, '; ');
  cleaned = cleaned.replace(/ ! /g, '! ');
  cleaned = cleaned.replace(/ \? /g, '? ');
  cleaned = cleaned.replace(/ : /g, ': ');
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
