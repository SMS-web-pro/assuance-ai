
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

const isMobileDevice = () => {
  if (typeof navigator === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
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
  
  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isManualStopRef = useRef<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasSpokenNameRef = useRef<boolean>(false);
  const wakeLockRef = useRef<SentinelWakeLock | null>(null);
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
      
      console.log('🎵 Voix françaises détectées:', frenchVoices.length, isMobile ? '(mobile)' : '(desktop)');
      setAvailableVoices(frenchVoices);
      selectOptimalVoice(frenchVoices, expertGender, expertName);
    };

    if (speechSynthesis.getVoices().length > 0) {
      updateVoices();
    } else {
      speechSynthesis.addEventListener('voiceschanged', updateVoices);
      setTimeout(updateVoices, 500);
    }
  }, [expertGender, expertName, isActive, isMobile]);

  // FORCER la re-sélection quand l'agent change
  useEffect(() => {
    if (availableVoices.length > 0 && isActive) {
      console.log(`🔄 Agent changé: ${expertName} (${expertGender}) - re-sélection de la voix`);
      selectOptimalVoice(availableVoices, expertGender, expertName);
    }
  }, [expertName, expertGender, isActive]);

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

  // Ajout de fillers conversationnels naturels
  const addNaturalFillers = useCallback((text: string): string => {
    // Probabilité de 12% d'ajouter un filler (pas trop fréquent)
    if (Math.random() > 0.12) return text;
    
    const fillers = ['euh', 'hum', 'alors', 'voilà', 'en fait', 'du coup'];
    const filler = fillers[Math.floor(Math.random() * fillers.length)];
    
    // Ajouter au début si la phrase commence par une conjonction
    if (/^(et|mais|ou|donc|car)/i.test(text.trim())) {
      return `${filler}, ${text}`;
    }
    
    return text;
  }, []);

  // Découpage du texte en chunks pour pauses naturelles et humaines
  const splitIntoNaturalChunks = useCallback((text: string): Array<{ text: string; pauseAfter: number }> => {
    const chunks: Array<{ text: string; pauseAfter: number }> = [];
    
    const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0);
    
    for (const paragraph of paragraphs) {
      const sentences = paragraph.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 2);
      
      for (const sentence of sentences) {
        // Ajouter variation aléatoire de pause pour effet humain
        const randomVariation = Math.random() * 40 - 20; // -20ms à +20ms
        
        if (sentence.length > 80) {
          const parts = sentence.split(/,\s*/);
          for (let i = 0; i < parts.length; i++) {
            const part = parts[i].trim();
            if (part.length > 2) {
              const isLast = i === parts.length - 1;
              let pauseAfter = 60 + randomVariation; // Virgule avec variation
              
              if (isLast) {
                if (sentence.endsWith('.')) pauseAfter = 180 + randomVariation;
                else if (sentence.endsWith('!')) pauseAfter = 160 + randomVariation;
                else if (sentence.endsWith('?')) pauseAfter = 200 + randomVariation;
                else pauseAfter = 140 + randomVariation;
              }
              
              chunks.push({ text: part, pauseAfter });
            }
          }
        } else {
          let pauseAfter = 180 + randomVariation; // Point avec variation
          if (sentence.endsWith('.')) pauseAfter = 180 + randomVariation;
          else if (sentence.endsWith('!')) pauseAfter = 160 + randomVariation;
          else if (sentence.endsWith('?')) pauseAfter = 200 + randomVariation;
          else if (sentence.endsWith(':')) pauseAfter = 120 + randomVariation;
          else if (sentence.endsWith(';')) pauseAfter = 100 + randomVariation;
          
          // Respiration plus longue pour phrases longues
          if (sentence.length > 80) pauseAfter += 80;
          
          chunks.push({ text: sentence, pauseAfter });
        }
      }
      
      // Pause entre paragraphes (respiration)
      if (chunks.length > 0) {
        chunks[chunks.length - 1].pauseAfter += 400;
      }
    }
    
    return chunks;
  }, []);

  // Configuration vocale par agent - CHAQUE AGENT A UNE VOIX UNIQUE avec variations humaines
  const getAgentVoiceConfig = useCallback((agentName: string, gender: 'male' | 'female') => {
    // Même qualité sur mobile et desktop avec variations naturelles
    const configs: Record<string, { rate: number; pitch: number; volume: number }> = {
      // HOMMES - tous Paul, mais chaque agent a un rythme et ton TRÈS différents
      'Marc Dubois':      { 
        rate: 0.92, // Plus naturel et légèrement plus lent
        pitch: 0.88, // Plus grave pour autorité
        volume: 1.0 
      },
      'Alex Moreau':      { 
        rate: 1.05, // Dynamique mais pas trop rapide
        pitch: 0.95, // Plus jeune et énergique
        volume: 1.0 
      },
      'Pierre Delacroix': { 
        rate: 0.85, // Posé et expérimenté
        pitch: 0.82, // Sérieux et profond
        volume: 1.0 
      },
      
      // FEMMES - Hortense et Julie, chaque agent a un rythme et ton TRÈS différents
      'Sophie Martin':      { 
        rate: 0.95, // Chaleureuse et naturelle
        pitch: 1.12, // Douce mais professionnelle
        volume: 1.0 
      },
      'Dr. Claire Rousseau': { 
        rate: 0.90, // Experte et posée
        pitch: 1.08, // Claire et professionnelle
        volume: 1.0 
      },
      'Camille Durand':     { 
        rate: 1.02, // Énergique et vive
        pitch: 1.18, // Optimiste et enthousiaste
        volume: 1.0 
      }
    };

    const baseConfig = configs[agentName] || (gender === 'male' 
      ? { rate: 0.92, pitch: 0.88, volume: 1.0 }
      : { rate: 0.95, pitch: 1.12, volume: 1.0 }
    );

    // Ajouter une légère variation aléatoire pour effet humain (±3%)
    const randomVariation = () => 0.97 + Math.random() * 0.06;
    
    return {
      rate: baseConfig.rate * randomVariation(),
      pitch: baseConfig.pitch * randomVariation(),
      volume: baseConfig.volume
    };
  }, []);

  // Analyse émotionnelle avancée pour modulation humaine
  const analyzeEmotion = useCallback((text: string) => {
    const lower = text.toLowerCase();
    
    let rateMod = 1.0;
    let pitchMod = 1.0;
    let volumeMod = 1.0;

    // Contexte de la phrase
    const isQuestion = text.includes('?');
    const hasExclamation = text.includes('!');
    const isLongText = text.length > 150;

    // Joie / enthousiasme - modulation plus naturelle
    if (/(?:merci|parfait|excellent|super|génial|formidable|bravo|content|ravi|top|nickel)/.test(lower)) {
      rateMod *= 1.08;
      pitchMod *= 1.05;
      volumeMod *= 1.05;
    }

    // Inquiétude / problème - ton plus apaisant
    if (/(?:problème|soucis|difficile|compliqué|inquiet|grave|attention|risque|préoccupant)/.test(lower)) {
      rateMod *= 0.92;
      pitchMod *= 0.95;
      volumeMod *= 0.95;
    }

    // Urgence - dynamique mais pas stressant
    if (/(?:urgent|rapidement|vite|immédiatement|crucial|dès que possible|tout de suite)/.test(lower)) {
      rateMod *= 1.12;
      pitchMod *= 1.04;
    }

    // Expertise / sérieux - ton professionnel
    if (/(?:technique|spécialisé|professionnel|expert|précisément|conformément|réglementation|spécifique)/.test(lower)) {
      rateMod *= 0.93;
      pitchMod *= 0.97;
    }

    // Empathie / chaleur - ton chaleureux
    if (/(?:comprends|accompagne|soutien|aide|écoute|accompagner|vous accompagne|là pour vous|soutenir)/.test(lower)) {
      rateMod *= 0.94;
      pitchMod *= 1.04;
      volumeMod *= 0.96;
    }

    // Question - intonation montante naturelle
    if (isQuestion) {
      pitchMod *= 1.18;
      rateMod *= 0.97;
    }

    // Exclamation - emphase naturelle
    if (hasExclamation) {
      volumeMod *= 1.08;
      rateMod *= 0.94;
      pitchMod *= 1.03;
    }

    // Texte long - plus lent pour la clarté
    if (isLongText) {
      rateMod *= 0.92;
    }

    // Expressions de transition - pauses naturelles
    if (/(?:alors|donc|ensuite|enfin|par contre|cependant|en fait|voilà)/.test(lower)) {
      rateMod *= 0.96;
      pitchMod *= 1.02;
    }

    return { rateMod, pitchMod, volumeMod };
  }, []);

  // Wake Lock API - empêcher l'écran de s'éteindre sur mobile
  const requestWakeLock = useCallback(async () => {
    if (!isMobile || !('wakeLock' in navigator)) return;
    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      console.log('🔒 Wake Lock actif');
      wakeLockRef.current.addEventListener('release', () => {
        console.log('🔓 Wake Lock libéré');
      });
    } catch (err) {
      console.log('⚠️ Wake Lock non disponible:', err);
    }
  }, [isMobile]);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
      } catch (err) {}
    }
  }, []);

  // Synthèse vocale native
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

    let cleanedText = cleanTextForSpeech(text);
    
    // Ajouter des fillers conversationnels naturels
    cleanedText = addNaturalFillers(cleanedText);
    
    if (!cleanedText || cleanedText.trim().length < 2) {
      console.warn('⚠️ Texte nettoyé trop court');
      return;
    }

    // Annuler toute lecture en cours
    if (utteranceRef.current) {
      speechSynthesis.cancel();
      utteranceRef.current = null;
    }

    // Activer le Wake Lock sur mobile
    await requestWakeLock();

    setLastMessage(text);
    setIsSpeaking(true);

    // Config vocale selon l'agent
    const baseConfig = getAgentVoiceConfig(expertName, expertGender);
    const emotion = analyzeEmotion(cleanedText);

    const finalConfig = {
      rate: Math.max(0.75, Math.min(1.15, baseConfig.rate * emotion.rateMod)),
      pitch: Math.max(0.8, Math.min(1.25, baseConfig.pitch * emotion.pitchMod)),
      volume: Math.max(0.9, Math.min(1.0, emotion.volumeMod))
    };

    console.log(`🎙️ Lecture: ${isMobile ? 'MOBILE' : 'DESKTOP'} | Voice: ${selectedVoice.name} | Rate: ${finalConfig.rate.toFixed(2)} | Pitch: ${finalConfig.pitch.toFixed(2)}`);

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
      releaseWakeLock();
      console.log('✅ Lecture terminée');
    };

    utterance.onerror = (error) => {
      console.error('❌ Erreur synthèse:', error);
      setIsSpeaking(false);
      utteranceRef.current = null;
      releaseWakeLock();
    };

    speechSynthesis.speak(utterance);

  }, [selectedVoice, expertGender, expertName, cleanTextForSpeech, getAgentVoiceConfig, analyzeEmotion, isActive, isMobile, requestWakeLock, releaseWakeLock]);

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
