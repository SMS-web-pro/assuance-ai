
import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface UseNativeSpeechVoiceProps {
  onTranscript?: (text: string) => void;
  language?: string;
  expertGender?: 'male' | 'female';
  expertName?: string;
  isActive?: boolean;
}

// Détecter mobile
const isMobileDevice = () => {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const EDGE_TTS_VOICES: Record<string, Record<string, string>> = {
  'female': { default: 'fr-FR-DeniseNeural', vivienne: 'fr-FR-VivienneNeural' },
  'male': { default: 'fr-FR-HenriNeural' },
};

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
  const [useEdgeTTS, setUseEdgeTTS] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isManualStopRef = useRef<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasSpokenNameRef = useRef<boolean>(false);
  const { toast } = useToast();
  const isMobile = isMobileDevice();

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
      // HOMMES - tous utilisent Paul mais avec config différente
      'Marc Dubois': { 
        preferred: ['Microsoft Paul'],
        fallback: ['paul'],
        characteristics: ['professionnel', 'posé', 'calme']
      },
      'Alex Moreau': { 
        preferred: ['Microsoft Paul'],
        fallback: ['paul'],
        characteristics: ['dynamique', 'rapide', 'jeune']
      },
      'Pierre Delacroix': { 
        preferred: ['Microsoft Paul'],
        fallback: ['paul'],
        characteristics: ['sérieux', 'lent', 'expérimenté']
      },
      // FEMMES - Hortense et Julie
      'Sophie Martin': { 
        preferred: ['Microsoft Hortense'],
        fallback: ['hortense'],
        characteristics: ['chaleureuse', 'douce', 'bienveillante']
      },
      'Dr. Claire Rousseau': { 
        preferred: ['Microsoft Julie'],
        fallback: ['julie'],
        characteristics: ['experte', 'claire', 'professionnelle']
      },
      'Camille Durand': { 
        preferred: ['Microsoft Julie'],
        fallback: ['julie'],
        characteristics: ['énergique', 'vive', 'optimiste']
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
      const isMale = voiceName.includes('paul') || voiceName.includes('thomas') || voiceName.includes('henri') || voiceName.includes('male') || voiceName.includes('david') || voiceName.includes('mark') || voiceName.includes('google FR');
      const isFemale = voiceName.includes('marie') || voiceName.includes('julie') || voiceName.includes('hortense') || voiceName.includes('female') || voiceName.includes('zira') || voiceName.includes('hazel') || voiceName.includes('google FR');

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

      // Google voices sont bonnes aussi (surtout sur mobile)
      if (voiceName.includes('google')) score += isMobile ? 100 : 70;

      // Apple voices sont excellentes sur macOS/iOS
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
    
    // Supprimer markdown, emojis et symbols
    cleanedText = cleanedText
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/`{1,3}[^`]*`{1,3}/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Supprimer symbols de séparation
      .replace(/[-]{3,}/g, '')
      .replace(/[=]{3,}/g, '')
      .replace(/[•]{3,}/g, '')
      .replace(/[─]{3,}/g, '')
      .replace(/[━]{3,}/g, '')
      .replace(/[═]{3,}/g, '')
      .replace(/[—]{3,}/g, '')
      // Supprimer bullet points et icons
      .replace(/[►▸▹‣⁃]/g, '')
      .replace(/[✓✔✅☑️]/g, '')
      .replace(/[❌✗✘]/g, '')
      .replace(/[📞📧📱💡🎯🔒🛡️🏠📐🏗️📅]/g, '')
      // Supprimer emojis restants
      .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]/gu, '')
      // Supprimer pipes de tableau
      .replace(/\|/g, '')
      // Supprimer crochets et accolades vides
      .replace(/[\[\]{}]/g, '');

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

    // / intelligent : entre chiffres → "sur", entre mots → espace
    cleanedText = cleanedText.replace(/(\d)\s*\/\s*(\d)/g, '$1 sur $2');
    cleanedText = cleanedText.replace(/([a-zA-ZÀ-ÿ])\s*\/\s*([a-zA-ZÀ-ÿ])/g, '$1 $2');

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

  // Configuration vocale par agent - CHAQUE AGENT A UNE VOIX UNIQUE
  const getAgentVoiceConfig = useCallback((agentName: string, gender: 'male' | 'female') => {
    // Sur mobile, les voix sont différentes et les rate/pitch doivent être ajustés
    const mobileMultiplier = isMobile ? 0.9 : 1.0;
    
    const configs: Record<string, { rate: number; pitch: number; volume: number }> = {
      // HOMMES - tous Paul, mais chaque agent a un rythme et ton différents
      'Marc Dubois':      { rate: 0.90 * mobileMultiplier, pitch: isMobile ? 0.95 : 0.85, volume: 1.0 },
      'Alex Moreau':      { rate: 1.10 * mobileMultiplier, pitch: isMobile ? 1.05 : 1.00, volume: 1.0 },
      'Pierre Delacroix': { rate: 0.80 * mobileMultiplier, pitch: isMobile ? 0.90 : 0.75, volume: 1.0 },
      
      // FEMMES - Hortense et Julie, chaque agent a un rythme et ton différents
      'Sophie Martin':      { rate: 0.92 * mobileMultiplier, pitch: isMobile ? 1.08 : 1.15, volume: 1.0 },
      'Dr. Claire Rousseau': { rate: 0.88 * mobileMultiplier, pitch: isMobile ? 1.00 : 1.05, volume: 1.0 },
      'Camille Durand':     { rate: 1.08 * mobileMultiplier, pitch: isMobile ? 1.15 : 1.25, volume: 1.0 }
    };

    return configs[agentName] || (gender === 'male' 
      ? { rate: 0.90, pitch: 0.90, volume: 1.0 }
      : { rate: 0.92, pitch: 1.10, volume: 1.0 }
    );
  }, [isMobile]);

  // Analyse émotionnelle pour modulation légère
  const analyzeEmotion = useCallback((text: string) => {
    const lower = text.toLowerCase();
    
    let rateMod = 1.0;
    let pitchMod = 1.0;
    let volumeMod = 1.0;

    // Joie / enthousiasme - légère accélération
    if (/(?:merci|parfait|excellent|super|génial|formidable|bravo|content|ravi)/.test(lower)) {
      rateMod *= 1.05;
      pitchMod *= 1.03;
      volumeMod *= 1.02;
    }

    // Inquiétude / problème - légère décélération
    if (/(?:problème|soucis|difficile|compliqué|inquiet|grave|attention|risque)/.test(lower)) {
      rateMod *= 0.95;
      pitchMod *= 0.97;
      volumeMod *= 0.98;
    }

    // Urgence
    if (/(?:urgent|rapidement|vite|immédiatement|crucial|dès que possible)/.test(lower)) {
      rateMod *= 1.08;
      pitchMod *= 1.02;
    }

    // Expertise / sérieux
    if (/(?:technique|spécialisé|professionnel|expert|précisément|conformément|réglementation)/.test(lower)) {
      rateMod *= 0.95;
      pitchMod *= 0.98;
    }

    // Empathie / chaleur
    if (/(?:comprends|accompagne|soutien|aide|écoute|accompagner|vous accompagne)/.test(lower)) {
      rateMod *= 0.95;
      pitchMod *= 1.02;
      volumeMod *= 0.98;
    }

    // Exclamation
    if (text.includes('!')) {
      volumeMod *= 1.02;
      rateMod *= 0.98;
    }

    return { rateMod, pitchMod, volumeMod };
  }, []);

  // Edge TTS via Supabase Edge Function
  const speakWithEdgeTTS = useCallback(async (text: string) => {
    if (!isActive) {
      console.log('🔇 Agent inactif');
      return;
    }

    if (!text || text.trim().length < 2) {
      console.warn('⚠️ Texte trop court');
      return;
    }

    const cleanedText = cleanTextForSpeech(text);
    if (!cleanedText || cleanedText.trim().length < 2) {
      console.warn('⚠️ Texte nettoyé trop court');
      return;
    }

    // Stop any current audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setLastMessage(text);
    setIsSpeaking(true);

    const baseConfig = getAgentVoiceConfig(expertName, expertGender);
    const emotion = analyzeEmotion(cleanedText);

    const ratePercent = Math.round((baseConfig.rate * emotion.rateMod - 1) * 100);
    const pitchPercent = Math.round((baseConfig.pitch * emotion.pitchMod - 1) * 50);

    let voiceName = expertGender === 'male' 
      ? EDGE_TTS_VOICES.male.default 
      : EDGE_TTS_VOICES.female.default;
    
    if (expertName.includes('Vivienne') || expertName.includes('Claire')) {
      voiceName = EDGE_TTS_VOICES.female.vivienne;
    }

    console.log(`🎤 Edge TTS: voice=${voiceName}, rate=${ratePercent}%, pitch=${pitchPercent}%`);

    try {
      const { data, error } = await supabase.functions.invoke('edge-tts', {
        body: {
          text: cleanedText,
          voice: voiceName,
          speed: ratePercent,
          pitch: pitchPercent,
          volume: 0,
        },
      });

      if (error) {
        console.error('❌ Edge TTS error:', error);
        speakWithNativeAPI(text);
        return;
      }

      const audioBlob = new Blob([data], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsSpeaking(false);
        audioRef.current = null;
        URL.revokeObjectURL(audioUrl);
        console.log('✅ Edge TTS lecture terminée');
      };
      
      audio.onerror = (e) => {
        console.error('❌ Audio playback error:', e);
        setIsSpeaking(false);
        audioRef.current = null;
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
      
    } catch (error) {
      console.error('❌ Edge TTS exception:', error);
      speakWithNativeAPI(text);
    }
  }, [isActive, cleanTextForSpeech, getAgentVoiceConfig, analyzeEmotion, expertName, expertGender]);

  // Synthèse vocale native (fallback)
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
      rate: Math.max(0.7, Math.min(1.2, baseConfig.rate * emotion.rateMod)),
      pitch: Math.max(0.7, Math.min(1.3, baseConfig.pitch * emotion.pitchMod)),
      volume: Math.max(0.8, Math.min(1.0, baseConfig.volume * emotion.volumeMod))
    };

    // Parler tout le texte d'un coup pour un rendu plus naturel
    console.log(`🎙️ Lecture: Rate: ${finalConfig.rate.toFixed(2)} | Pitch: ${finalConfig.pitch.toFixed(2)}`);

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utteranceRef.current = utterance;

    utterance.voice = selectedVoice;
    utterance.lang = 'fr-FR';
    utterance.rate = finalConfig.rate;
    utterance.pitch = finalConfig.pitch;
    utterance.volume = finalConfig.volume;

    utterance.onstart = () => {
      console.log(`🔊 Début de la lecture`);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      utteranceRef.current = null;
      console.log('✅ Lecture terminée');
    };

    utterance.onerror = (error) => {
      console.error('❌ Erreur synthèse:', error);
      setIsSpeaking(false);
      utteranceRef.current = null;
    };

    speechSynthesis.speak(utterance);

  }, [selectedVoice, expertGender, expertName, cleanTextForSpeech, getAgentVoiceConfig, analyzeEmotion, isActive]);

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
    speak: useEdgeTTS ? speakWithEdgeTTS : speakWithNativeAPI,
    stopSpeaking,
    replayLastMessage,
    resetConversation,
    availableVoices,
    selectedVoice,
    setSelectedVoice,
    useEdgeTTS,
    setUseEdgeTTS
  };
};

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
