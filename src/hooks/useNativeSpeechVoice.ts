
import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

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
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isManualStopRef = useRef<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasSpokenNameRef = useRef<boolean>(false);
  const { toast } = useToast();

  const loadAvailableVoices = useCallback(() => {
    if (!isActive) return;

    const updateVoices = () => {
      const voices = speechSynthesis.getVoices();
      
      if (voices.length === 0) {
        setTimeout(updateVoices, 100);
        return;
      }
      
      const frenchVoices = voices.filter(voice => {
        const lang = voice.lang.toLowerCase();
        return lang.startsWith('fr-fr') || lang.startsWith('fr_fr') || lang === 'fr';
      });
      
      console.log('🎵 Voix françaises détectées:', frenchVoices.length);
      setAvailableVoices(frenchVoices);
      selectOptimalVoice(frenchVoices, expertGender, expertName);
    };

    if (speechSynthesis.getVoices().length > 0) {
      updateVoices();
    } else {
      speechSynthesis.addEventListener('voiceschanged', updateVoices);
      setTimeout(updateVoices, 500);
    }
  }, [expertGender, expertName, isActive]);

  const selectOptimalVoice = useCallback((voices: SpeechSynthesisVoice[], gender: 'male' | 'female', agentName: string) => {
    if (voices.length === 0 || !isActive) {
      console.warn('Aucune voix disponible ou composant inactif');
      return;
    }

    console.log('Voix disponibles pour la sélection:', voices.map(v => `${v.name} (${v.lang}) [${v.localService ? 'local' : 'remote'}]`));
    
    let bestVoice: SpeechSynthesisVoice | null = null;
    let bestScore = 0;

    const voiceMapping: Record<string, { 
      preferred: string[], 
      fallback: string[],
      characteristics: string[]
    }> = {
      'Marc Dubois': { 
        preferred: ['Microsoft Paul Natural', 'Microsoft Paul', 'Google Français (France)', 'Thomas'],
        fallback: ['paul', 'thomas', 'henri', 'microsoft', 'google'],
        characteristics: ['professionnel', 'confiant', 'chaleureux']
      },
      'Sophie Martin': { 
        preferred: ['Microsoft Hortense Natural', 'Microsoft Hortense', 'Google Français (France)', 'Marie'],
        fallback: ['hortense', 'marie', 'julie', 'microsoft', 'google'],
        characteristics: ['rassurante', 'précise', 'bienveillante']
      },
      'Dr. Claire Rousseau': { 
        preferred: ['Microsoft Julie Natural', 'Microsoft Julie', 'Google Français (France)', 'Claire'],
        fallback: ['julie', 'claire', 'marie', 'microsoft', 'google'],
        characteristics: ['experte', 'empathique', 'professionnelle']
      },
      'Alex Moreau': { 
        preferred: ['Microsoft Thomas Natural', 'Microsoft Thomas', 'Google Français (France)', 'Alex'],
        fallback: ['thomas', 'alex', 'paul', 'microsoft', 'google'],
        characteristics: ['dynamique', 'passionné', 'moderne']
      },
      'Pierre Delacroix': { 
        preferred: ['Microsoft Paul Natural', 'Microsoft Paul', 'Google Français (France)', 'Pierre'],
        fallback: ['paul', 'pierre', 'henri', 'microsoft', 'google'],
        characteristics: ['sérieux', 'fiable', 'expert']
      },
      'Camille Durand': { 
        preferred: ['Microsoft Hortense Natural', 'Microsoft Hortense', 'Google Français (France)', 'Camille'],
        fallback: ['hortense', 'camille', 'julie', 'microsoft', 'google'],
        characteristics: ['énergique', 'optimiste', 'aventurière']
      }
    };

    const agentConfig = voiceMapping[agentName] || voiceMapping['Sophie Martin'];

    for (const voice of voices) {
      let score = 0;
      const voiceName = voice.name.toLowerCase();
      const voiceLang = voice.lang.toLowerCase();

      // Correspondance exacte avec les voix préférées
      for (let i = 0; i < agentConfig.preferred.length; i++) {
        if (voiceName.includes(agentConfig.preferred[i].toLowerCase())) {
          score += (300 - i * 30);
          break;
        }
      }

      // Score fallback
      for (let i = 0; i < agentConfig.fallback.length; i++) {
        if (voiceName.includes(agentConfig.fallback[i])) {
          score += (150 - i * 20);
          break;
        }
      }

      // Genre
      const isMale = voiceName.includes('paul') || voiceName.includes('thomas') || voiceName.includes('henri') || voiceName.includes('male') || voiceName.includes('david') || voiceName.includes('mark');
      const isFemale = voiceName.includes('marie') || voiceName.includes('julie') || voiceName.includes('hortense') || voiceName.includes('female') || voiceName.includes('zira') || voiceName.includes('hazel');

      if ((gender === 'male' && isMale) || (gender === 'female' && isFemale)) {
        score += 200;
      }

      // Bonus QUALITÉ - voix enhanced/neural en priorité maximale
      if (voiceName.includes('natural')) score += 150;
      if (voiceName.includes('neural')) score += 140;
      if (voiceName.includes('enhanced')) score += 120;
      if (voiceName.includes('premium')) score += 100;
      if (voiceName.includes('advanced')) score += 90;

      // Microsoft voices sont les meilleures sur Windows
      if (voiceName.includes('microsoft')) score += 80;

      // Google voices sont bonnes aussi
      if (voiceName.includes('google')) score += 70;

      // Apple voices sont excellentes sur macOS
      if (voiceName.includes('apple') || voiceName.includes('samantha') || voiceName.includes('thomas')) score += 90;

      // Bonus langue française
      if (voiceLang === 'fr-fr') score += 50;
      if (voiceLang.startsWith('fr-')) score += 40;

      // Bonus voix locale (plus réactive)
      if (voice.localService) score += 30;

      // Bonus voix par défaut
      if (voice.default) score += 20;

      if (score > bestScore) {
        bestScore = score;
        bestVoice = voice;
      }
    }
    
    if (!bestVoice) {
      const frenchVoice = voices.find(v => v.lang.toLowerCase().includes('fr'));
      bestVoice = frenchVoice || voices[0];
      console.warn('Aucune voix optimale trouvée, utilisation de:', bestVoice?.name || 'première voix disponible');
    }
    
    setSelectedVoice(bestVoice);
    
    if (bestVoice) {
      console.log(`🎯 VOIX OPTIMISÉE pour ${agentName}:`, {
        nom: bestVoice.name,
        langue: bestVoice.lang,
        score_qualité: bestScore,
        caractéristiques: agentConfig.characteristics,
        locale: bestVoice.localService ? 'Oui' : 'Non'
      });
    }
  }, [isActive]);

  // Nettoyage du texte pour synthèse vocale
  const cleanTextForSpeech = useCallback((text: string): string => {
    let cleanedText = text;
    
    // Supprimer markdown et emojis
    cleanedText = cleanedText
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/`{1,3}[^`]*`{1,3}/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]/gu, '');

    // Corrections françaises
    const corrections: Record<string, string> = {
      'M.': 'Monsieur', 'Mme': 'Madame', 'Mlle': 'Mademoiselle',
      'Dr': 'Docteur', 'Pr': 'Professeur',
      '€': 'euros', '%': 'pour cent', '&': 'et',
      'RDV': 'rendez-vous', 'OK': 'd\'accord', 'ok': 'd\'accord'
    };

    Object.entries(corrections).forEach(([abbrev, full]) => {
      const regex = new RegExp(`\\b${abbrev.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
      cleanedText = cleanedText.replace(regex, full);
    });

    // Nettoyage final
    cleanedText = cleanedText
      .replace(/\s+/g, ' ')
      .trim();

    return cleanedText;
  }, []);

  // Découpage du texte en chunks pour pauses naturelles
  const splitIntoNaturalChunks = useCallback((text: string): Array<{ text: string; pauseAfter: number }> => {
    const chunks: Array<{ text: string; pauseAfter: number }> = [];
    
    const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0);
    
    for (const paragraph of paragraphs) {
      const sentences = paragraph.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 2);
      
      for (const sentence of sentences) {
        if (sentence.length > 80) {
          const parts = sentence.split(/,\s*/);
          for (let i = 0; i < parts.length; i++) {
            const part = parts[i].trim();
            if (part.length > 2) {
              const isLast = i === parts.length - 1;
              let pauseAfter = 50; // Virgule par défaut
              
              if (isLast) {
                if (sentence.endsWith('.')) pauseAfter = 120;
                else if (sentence.endsWith('!')) pauseAfter = 120;
                else if (sentence.endsWith('?')) pauseAfter = 120;
                else pauseAfter = 100;
              }
              
              chunks.push({ text: part, pauseAfter });
            }
          }
        } else {
          let pauseAfter = 120; // Défaut = point
          if (sentence.endsWith('.')) pauseAfter = 120;
          else if (sentence.endsWith('!')) pauseAfter = 120;
          else if (sentence.endsWith('?')) pauseAfter = 120;
          else if (sentence.endsWith(':')) pauseAfter = 80;
          else if (sentence.endsWith(';')) pauseAfter = 60;
          
          // Bonus respiration pour phrases longues
          if (sentence.length > 80) pauseAfter += 50;
          
          chunks.push({ text: sentence, pauseAfter });
        }
      }
    }
    
    return chunks;
  }, []);

  // Configuration vocale par agent avec différenciation homme/femme
  const getAgentVoiceConfig = useCallback((agentName: string, gender: 'male' | 'female') => {
    const configs: Record<string, { rate: number; pitch: number; volume: number }> = {
      // HOMMES : voix graves, chacun avec un caractère distinct
      'Marc Dubois':      { rate: 1.05, pitch: 0.68, volume: 0.88 },  // Posé, professional
      'Alex Moreau':      { rate: 1.12, pitch: 0.75, volume: 0.90 },  // Dynamique, rapide
      'Pierre Delacroix': { rate: 0.98, pitch: 0.62, volume: 0.85 },  // Sérieux, lent
      
      // FEMMES : voix aigües, chacune avec un caractère distinct
      'Sophie Martin':      { rate: 1.06, pitch: 1.30, volume: 0.87 },  // Chaleureuse, posée
      'Dr. Claire Rousseau': { rate: 1.00, pitch: 1.22, volume: 0.84 },  // Experte, calme
      'Camille Durand':     { rate: 1.15, pitch: 1.40, volume: 0.92 }   // Énergique, vive
    };

    return configs[agentName] || (gender === 'male' 
      ? { rate: 1.05, pitch: 0.70, volume: 0.88 }
      : { rate: 1.08, pitch: 1.30, volume: 0.87 }
    );
  }, []);

  // Analyse émotionnelle pour modulation
  const analyzeEmotion = useCallback((text: string) => {
    const lower = text.toLowerCase();
    
    let rateMod = 1.0;
    let pitchMod = 1.0;
    let volumeMod = 1.0;

    // Joie / enthousiasme
    if (/(?:merci|parfait|excellent|super|génial|formidable|bravo|content|ravi)/.test(lower)) {
      rateMod *= 1.15;
      pitchMod *= 1.13;
      volumeMod *= 1.05;
    }

    // Inquiétude / problème
    if (/(?:problème|soucis|difficile|compliqué|inquiet|grave|attention|risque)/.test(lower)) {
      rateMod *= 0.82;
      pitchMod *= 0.87;
      volumeMod *= 0.92;
    }

    // Urgence
    if (/(?:urgent|rapidement|vite|immédiatement|crucial|dès que possible)/.test(lower)) {
      rateMod *= 1.18;
      pitchMod *= 1.08;
    }

    // Expertise / sérieux
    if (/(?:technique|spécialisé|professionnel|expert|précisément|conformément|réglementation)/.test(lower)) {
      rateMod *= 0.82;
      pitchMod *= 0.92;
    }

    // Empathie / chaleur
    if (/(?:comprends|accompagne|soutien|aide|écoute|accompagner|vous accompagne)/.test(lower)) {
      rateMod *= 0.80;
      pitchMod *= 1.10;
      volumeMod *= 0.90;
    }

    // Question
    if (text.includes('?')) {
      pitchMod *= 1.08;
    }

    // Exclamation
    if (text.includes('!')) {
      volumeMod *= 1.05;
      rateMod *= 0.95;
    }

    return { rateMod, pitchMod, volumeMod };
  }, []);

  // Synthèse vocale avec pauses explicites entre chunks
  const speakWithNativeAPI = useCallback(async (text: string) => {
    if (!isActive) {
      console.log('🔇 Agent inactif');
      return;
    }

    if (!text || text.trim().length < 2) {
      console.warn('⚠️ Texte trop court');
      return;
    }

    if (!selectedVoice) {
      console.warn('⚠️ Aucune voix sélectionnée');
      return;
    }

    const cleanedText = cleanTextForSpeech(text);
    if (!cleanedText || cleanedText.trim().length < 2) {
      console.warn('⚠️ Texte nettoyé trop court');
      return;
    }

    if (utteranceRef.current) {
      speechSynthesis.cancel();
      utteranceRef.current = null;
    }

    setLastMessage(text);
    setIsSpeaking(true);

    const baseConfig = getAgentVoiceConfig(expertName, expertGender);
    const emotion = analyzeEmotion(cleanedText);

    const finalConfig = {
      rate: Math.max(0.5, Math.min(1.5, baseConfig.rate * emotion.rateMod)),
      pitch: Math.max(0.3, Math.min(2.0, baseConfig.pitch * emotion.pitchMod)),
      volume: Math.max(0.7, Math.min(1.0, baseConfig.volume * emotion.volumeMod))
    };

    // Découper en chunks avec pauses
    const chunks = splitIntoNaturalChunks(cleanedText);
    
    console.log(`🎙️ Lecture professionnelle: ${chunks.length} segments | Rate: ${finalConfig.rate.toFixed(2)} | Pitch: ${finalConfig.pitch.toFixed(2)}`);

    let currentChunk = 0;

    const speakNextChunk = () => {
      if (currentChunk >= chunks.length || !isActive) {
        setIsSpeaking(false);
        utteranceRef.current = null;
        console.log('✅ Lecture terminée');
        return;
      }

      const chunk = chunks[currentChunk];
      
      if (!chunk.text || chunk.text.trim().length === 0) {
        currentChunk++;
        speakNextChunk();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(chunk.text);
      utteranceRef.current = utterance;

      // Micro-variations aléatoires pour un rendu plus naturel
      const microRateVar = 1.0 + (Math.random() - 0.5) * 0.06;
      const microPitchVar = 1.0 + (Math.random() - 0.5) * 0.04;
      const microVolVar = 1.0 + (Math.random() - 0.5) * 0.03;

      utterance.voice = selectedVoice;
      utterance.lang = 'fr-FR';
      utterance.rate = Math.max(0.6, Math.min(1.3, finalConfig.rate * microRateVar));
      utterance.pitch = Math.max(0.4, Math.min(1.8, finalConfig.pitch * microPitchVar));
      utterance.volume = Math.max(0.75, Math.min(1.0, finalConfig.volume * microVolVar));

      utterance.onstart = () => {
        if (currentChunk === 0) {
          console.log(`🔊 Début: "${chunk.text.substring(0, 40)}..."`);
        }
      };

      utterance.onend = () => {
        currentChunk++;
        if (currentChunk < chunks.length && isActive) {
          // Pause explicite entre chunks
          setTimeout(speakNextChunk, chunk.pauseAfter);
        } else {
          setIsSpeaking(false);
          utteranceRef.current = null;
          console.log('✅ Lecture terminée');
        }
      };

      utterance.onerror = (error) => {
        console.error('❌ Erreur synthèse:', error);
        setIsSpeaking(false);
        utteranceRef.current = null;
      };

      speechSynthesis.speak(utterance);
    };

    speakNextChunk();

  }, [selectedVoice, expertGender, expertName, cleanTextForSpeech, getAgentVoiceConfig, analyzeEmotion, splitIntoNaturalChunks, isActive]);

  const stopSpeaking = useCallback(() => {
    console.log('🛑 Arrêt synthèse vocale');
    
    if (utteranceRef.current) {
      speechSynthesis.cancel();
      utteranceRef.current = null;
    }
    
    setIsSpeaking(false);
  }, []);

  const resetConversation = useCallback(() => {
    hasSpokenNameRef.current = false;
  }, []);

  const replayLastMessage = useCallback(() => {
    if (!isActive) return;

    if (!lastMessage || lastMessage.trim().length === 0) {
      toast({
        title: "⚠️ Aucun message",
        description: "Aucun message précédent à rejouer",
        duration: 3000
      });
      return;
    }
    
    speakWithNativeAPI(lastMessage);
  }, [lastMessage, speakWithNativeAPI, toast, isActive]);

  const startListening = useCallback(async () => {
    if (!isActive) return;

    if (!isSupported) {
      toast({
        title: "❌ Non supporté",
        description: "La reconnaissance vocale n'est pas supportée sur ce navigateur",
        variant: "destructive"
      });
      return;
    }

    if (isListening) return;

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }

      const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognitionConstructor();
      
      recognition.lang = 'fr-FR';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      
      isManualStopRef.current = false;

      recognition.onstart = () => {
        setIsListening(true);
        timeoutRef.current = setTimeout(() => {
          if (recognition && !isManualStopRef.current) {
            isManualStopRef.current = true;
            recognition.stop();
          }
        }, 6000);
      };

      recognition.onresult = (event: any) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        const transcript = event.results[0][0].transcript;
        
        if (transcript && transcript.trim() && isActive) {
          if (onTranscript) {
            onTranscript(transcript.trim());
          }
        }
        
        isManualStopRef.current = true;
        recognition.stop();
      };

      recognition.onerror = (event: any) => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        setIsListening(false);
        
        if (event.error !== 'aborted' && !isManualStopRef.current) {
          toast({
            title: "🎤 Erreur microphone",
            description: "Problème avec la reconnaissance vocale",
            variant: "destructive",
            duration: 4000
          });
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      
    } catch (error) {
      setIsListening(false);
      toast({
        title: "❌ Erreur microphone",
        description: "Impossible d'accéder au microphone",
        variant: "destructive",
        duration: 5000
      });
    }
  }, [isSupported, isListening, onTranscript, toast, isActive]);

  const stopListening = useCallback(() => {
    isManualStopRef.current = true;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    setIsListening(false);
  }, []);

  useEffect(() => {
    if (!isActive) {
      setIsSupported(true);
      return;
    }

    const speechSynthesisSupported = 'speechSynthesis' in window;
    const speechRecognitionSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    const fullSupport = speechSynthesisSupported && speechRecognitionSupported;
    
    setIsSupported(fullSupport);

    if (speechSynthesisSupported) {
      loadAvailableVoices();
    }
  }, [isActive, loadAvailableVoices]);

  useEffect(() => {
    if (!isActive) {
      if (recognitionRef.current) {
        isManualStopRef.current = true;
        recognitionRef.current.abort();
      }
      if (utteranceRef.current) {
        speechSynthesis.cancel();
        utteranceRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsListening(false);
      setIsSpeaking(false);
    }

    return () => {
      if (recognitionRef.current) {
        isManualStopRef.current = true;
        recognitionRef.current.abort();
      }
      if (utteranceRef.current) {
        speechSynthesis.cancel();
        utteranceRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isActive]);

  const hasLastMessage = Boolean(lastMessage && lastMessage.trim().length > 0);

  return {
    isListening,
    isSpeaking,
    isSupported,
    startListening,
    stopListening,
    speak: speakWithNativeAPI,
    stopSpeaking,
    replayLastMessage,
    resetConversation,
    availableVoices,
    selectedVoice,
    setSelectedVoice
  };
};

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
