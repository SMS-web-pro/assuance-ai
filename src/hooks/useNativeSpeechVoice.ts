
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

  // Sélection optimale de voix avec critères améliorés
  const selectOptimalVoice = useCallback((voices: SpeechSynthesisVoice[], gender: 'male' | 'female', agentName: string) => {
    if (voices.length === 0 || !isActive) {
      console.warn('Aucune voix disponible ou composant inactif');
      return;
    }

    console.log('Voix disponibles pour la sélection:', voices.map(v => `${v.name} (${v.lang})`));
    
    let bestVoice: SpeechSynthesisVoice | null = null;
    let bestScore = 0;

    // Mapping avancé des voix par agent avec préférences qualité
    const voiceMapping: Record<string, { 
      preferred: string[], 
      fallback: string[],
      characteristics: string[]
    }> = {
      'Marc Dubois': { 
        preferred: ['Microsoft Paul', 'Google Français (France)', 'Thomas'],
        fallback: ['paul', 'thomas', 'henri', 'microsoft'],
        characteristics: ['professionnel', 'confiant', 'chaleureux']
      },
      'Sophie Martin': { 
        preferred: ['Microsoft Hortense', 'Google Français (France)', 'Marie'],
        fallback: ['hortense', 'marie', 'julie', 'microsoft'],
        characteristics: ['rassurante', 'précise', 'bienveillante']
      },
      'Dr. Claire Rousseau': { 
        preferred: ['Microsoft Julie', 'Google Français (France)', 'Claire'],
        fallback: ['julie', 'claire', 'marie', 'microsoft'],
        characteristics: ['experte', 'empathique', 'professionnelle']
      },
      'Alex Moreau': { 
        preferred: ['Microsoft Thomas', 'Google Français (France)', 'Alex'],
        fallback: ['thomas', 'alex', 'paul', 'microsoft'],
        characteristics: ['dynamique', 'passionné', 'moderne']
      },
      'Pierre Delacroix': { 
        preferred: ['Microsoft Paul', 'Google Français (France)', 'Pierre'],
        fallback: ['paul', 'pierre', 'henri', 'microsoft'],
        characteristics: ['sérieux', 'fiable', 'expert']
      },
      'Camille Durand': { 
        preferred: ['Microsoft Hortense', 'Google Français (France)', 'Camille'],
        fallback: ['hortense', 'camille', 'julie', 'microsoft'],
        characteristics: ['énergique', 'optimiste', 'aventurière']
      }
    };

    const agentConfig = voiceMapping[agentName] || voiceMapping['Sophie Martin'];

    for (const voice of voices) {
      let score = 0;
      const voiceName = voice.name.toLowerCase();
      const voiceLang = voice.lang.toLowerCase();

      // Score priorité maximale pour correspondance exacte
      for (let i = 0; i < agentConfig.preferred.length; i++) {
        if (voiceName.includes(agentConfig.preferred[i].toLowerCase())) {
          score += (200 - i * 20);
          break;
        }
      }

      // Score fallback
      for (let i = 0; i < agentConfig.fallback.length; i++) {
        if (voiceName.includes(agentConfig.fallback[i])) {
          score += (100 - i * 15);
          break;
        }
      }

      // Score par genre avec bonus spécial
      const isMale = voiceName.includes('paul') || voiceName.includes('thomas') || voiceName.includes('henri') || voiceName.includes('male');
      const isFemale = voiceName.includes('marie') || voiceName.includes('julie') || voiceName.includes('hortense') || voiceName.includes('female');

      if ((gender === 'male' && isMale) || (gender === 'female' && isFemale)) {
        score += 150;
      }

      // Bonus qualité premium
      if (voiceName.includes('microsoft')) score += 80;
      if (voiceName.includes('google')) score += 70;
      if (voiceName.includes('premium')) score += 60;
      if (voiceName.includes('enhanced')) score += 50;

      // Bonus langue française parfaite
      if (voiceLang === 'fr-fr') score += 40;
      if (voiceLang.startsWith('fr-')) score += 30;

      // Bonus voix locale (plus naturelle)
      if (voice.localService) score += 25;

      // Bonus voix par défaut du système (souvent de meilleure qualité)
      if (voice.default) score += 15;

      if (score > bestScore) {
        bestScore = score;
        bestVoice = voice;
      }
    }
    
    // Si aucune voix n'a été sélectionnée, essayer de trouver une voix française ou prendre la première disponible
    if (!bestVoice) {
      // Essayer de trouver une voix française
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

  // Nettoyage avancé du texte avec préservation de l'expressivité
  const cleanTextForSpeech = useCallback((text: string): string => {
    let cleanedText = text;
    
    // Préserver les expressions d'émotion importantes
    const emotionMarkers = {
      '!': ' !',
      '?': ' ?',
      '...': ', pause,',
      '😊': ', avec le sourire,',
      '👍': ', parfait,',
      '📞': ', au téléphone,',
      '✅': ', c\'est validé,',
      '🎯': ', exactement,',
      '💡': ', bonne idée,'
    };

    // Remplacer les marqueurs d'émotion avant nettoyage
    Object.entries(emotionMarkers).forEach(([marker, replacement]) => {
      cleanedText = cleanedText.replace(new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
    });

    // Nettoyer le markdown et formatage
    cleanedText = cleanedText
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/`{1,3}[^`]*`{1,3}/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\(.*?\)/g, '')
      
    // Supprimer tous les autres emojis
    cleanedText = cleanedText.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]/gu, '')
      
    // Améliorer la ponctuation pour l'expressivité
    cleanedText = cleanedText
      .replace(/\s+/g, ' ')
      .replace(/([.!?])\s*([A-Z])/g, '$1 $2') // Assurer espaces après ponctuation
      .replace(/,\s*/g, ', ') // Normaliser les virgules
      .replace(/:\s*/g, ' : ') // Améliorer les deux-points
      .trim();

    return cleanedText;
  }, []);

  // Analyse du sentiment pour adaptation vocale
  const analyzeTextEmotion = useCallback((text: string, agentName: string) => {
    const lowerText = text.toLowerCase();
    
    // Émotions par type d'agent
    const agentPersonalities = {
      'Marc Dubois': { baseRate: 0.88, basePitch: 0.85, confidence: 1.2 },
      'Sophie Martin': { baseRate: 0.92, basePitch: 1.08, warmth: 1.3 },
      'Dr. Claire Rousseau': { baseRate: 0.85, basePitch: 1.05, expertise: 1.4 },
      'Alex Moreau': { baseRate: 0.95, basePitch: 0.82, energy: 1.5 },
      'Pierre Delacroix': { baseRate: 0.82, basePitch: 0.78, authority: 1.3 },
      'Camille Durand': { baseRate: 0.98, basePitch: 1.12, enthusiasm: 1.4 }
    };

    const personality = agentPersonalities[agentName as keyof typeof agentPersonalities] || agentPersonalities['Sophie Martin'];

    const emotions = {
      joie: ['merci', 'parfait', 'excellent', 'super', 'génial', 'formidable', 'bravo', 'félicitations', 'content', 'ravi', 'magnifique'],
      enthousiasme: ['fantastique', 'incroyable', 'extraordinaire', 'merveilleux', 'sensationnel'],
      inquiétude: ['problème', 'soucis', 'difficile', 'compliqué', 'inquiet', 'préoccupé', 'grave', 'attention'],
      urgence: ['urgent', 'rapidement', 'vite', 'immédiatement', 'important', 'pressé', 'crucial'],
      politesse: ['bonjour', 'bonsoir', 's\'il vous plaît', 'merci', 'excusez-moi', 'pardon', 'veuillez'],
      expertise: ['technique', 'spécialisé', 'professionnel', 'expert', 'précisément', 'exactement'],
      empathie: ['comprends', 'ressens', 'accompagne', 'soutien', 'aide', 'écoute']
    };

    let emotionIntensity = {
      joy: 0,
      concern: 0,
      urgency: 0,
      formality: 0,
      expertise: 0,
      empathy: 0
    };

    // Calculer l'intensité émotionnelle
    Object.entries(emotions).forEach(([emotion, keywords]) => {
      const matches = keywords.filter(keyword => lowerText.includes(keyword)).length;
      switch (emotion) {
        case 'joie': emotionIntensity.joy += matches * 2; break;
        case 'enthousiasme': emotionIntensity.joy += matches * 3; break;
        case 'inquiétude': emotionIntensity.concern += matches * 2; break;
        case 'urgence': emotionIntensity.urgency += matches * 3; break;
        case 'politesse': emotionIntensity.formality += matches; break;
        case 'expertise': emotionIntensity.expertise += matches * 2; break;
        case 'empathie': emotionIntensity.empathy += matches * 2; break;
      }
    });

    return {
      ...emotionIntensity,
      personality,
      isQuestion: text.includes('?'),
      isExclamation: text.includes('!'),
      isLong: text.length > 100,
      hasNumbers: /\d/.test(text)
    };
  }, []);

  // Synthèse vocale ultra-optimisée avec expressivité
  const speakWithNativeAPI = useCallback(async (text: string) => {
    if (!isActive) {
      console.log('🔇 Agent inactif - pas de synthèse vocale');
      return;
    }

    if (!text || text.trim().length < 2) {
      console.warn('⚠️ Texte trop court pour la synthèse vocale');
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

    try {
      setIsSpeaking(true);
      
      const emotion = analyzeTextEmotion(cleanedText, expertName);
      
      // Configuration avancée selon l'émotion et la personnalité
      let voiceConfig = {
        rate: emotion.personality.baseRate,
        pitch: emotion.personality.basePitch,
        volume: 0.95
      };

      // Adaptation dynamique selon le contenu
      if (emotion.joy > 0) {
        voiceConfig.rate *= 1.08; // Plus rapide pour la joie
        voiceConfig.pitch *= expertGender === 'female' ? 1.12 : 1.08;
        voiceConfig.volume = 0.98;
      } else if (emotion.concern > 0) {
        voiceConfig.rate *= 0.85; // Plus lent pour l'inquiétude
        voiceConfig.pitch *= 0.92;
        voiceConfig.volume = 0.90;
      } else if (emotion.urgency > 0) {
        voiceConfig.rate *= 1.05; // Rythme soutenu pour l'urgence
        voiceConfig.pitch *= 1.02;
        voiceConfig.volume = 0.96;
      } else if (emotion.expertise > 0) {
        voiceConfig.rate *= 0.88; // Plus posé pour l'expertise
        voiceConfig.pitch *= 0.95;
        voiceConfig.volume = 0.93;
      } else if (emotion.empathy > 0) {
        voiceConfig.rate *= 0.90; // Chaleureux pour l'empathie
        voiceConfig.pitch *= expertGender === 'female' ? 1.05 : 0.88;
        voiceConfig.volume = 0.94;
      }

      // Ajustements spéciaux selon la longueur
      if (emotion.isLong) {
        voiceConfig.rate *= 0.95; // Légèrement plus lent pour les longs textes
      }

      if (emotion.hasNumbers) {
        voiceConfig.rate *= 0.90; // Plus lent pour les chiffres
      }

      // Borner les valeurs pour éviter les extrêmes
      voiceConfig.rate = Math.max(0.5, Math.min(2.0, voiceConfig.rate));
      voiceConfig.pitch = Math.max(0.5, Math.min(2.0, voiceConfig.pitch));
      voiceConfig.volume = Math.max(0.7, Math.min(1.0, voiceConfig.volume));

      const utterance = new SpeechSynthesisUtterance(cleanedText);
      utteranceRef.current = utterance;
      
      utterance.voice = selectedVoice;
      utterance.lang = 'fr-FR';
      utterance.rate = voiceConfig.rate;
      utterance.pitch = voiceConfig.pitch;
      utterance.volume = voiceConfig.volume;

      utterance.onstart = () => {
        setIsSpeaking(true);
        console.log(`🎙️ 🔊 Lecture optimisée: "${text.substring(0, 50)}..." | Rate: ${voiceConfig.rate.toFixed(2)} | Pitch: ${voiceConfig.pitch.toFixed(2)}`);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        utteranceRef.current = null;
        console.log('✅ Lecture terminée avec expressivité');
      };

      utterance.onerror = (error) => {
        setIsSpeaking(false);
        utteranceRef.current = null;
        console.error('❌ Erreur synthèse vocale:', error);
      };

      // Gestion des pauses naturelles pour les longs textes
      if (cleanedText.length > 200) {
        const sentences = cleanedText.split(/[.!?]+/).filter(s => s.trim().length > 5);
        
        if (sentences.length > 2) {
          console.log(`📝 Lecture segmentée: ${sentences.length} phrases`);
          
          let currentSentence = 0;
          
          const speakNextSentence = () => {
            if (currentSentence < sentences.length && isActive) {
              const sentence = sentences[currentSentence].trim();
              if (sentence.length > 0) {
                const sentenceUtterance = new SpeechSynthesisUtterance(sentence);
                
                sentenceUtterance.voice = selectedVoice;
                sentenceUtterance.lang = 'fr-FR';
                sentenceUtterance.rate = voiceConfig.rate;
                sentenceUtterance.pitch = voiceConfig.pitch;
                sentenceUtterance.volume = voiceConfig.volume;
                
                sentenceUtterance.onend = () => {
                  currentSentence++;
                  if (currentSentence < sentences.length) {
                    // Pause naturelle entre phrases
                    setTimeout(speakNextSentence, 300);
                  } else {
                    setIsSpeaking(false);
                    utteranceRef.current = null;
                    console.log('✅ Lecture segmentée terminée');
                  }
                };
                
                sentenceUtterance.onerror = () => {
                  setIsSpeaking(false);
                  utteranceRef.current = null;
                  console.error('❌ Erreur lecture segmentée');
                };
                
                speechSynthesis.speak(sentenceUtterance);
              } else {
                currentSentence++;
                speakNextSentence();
              }
            } else {
              setIsSpeaking(false);
              utteranceRef.current = null;
            }
          };
          
          speakNextSentence();
          return;
        }
      }

      speechSynthesis.speak(utterance);

    } catch (error) {
      setIsSpeaking(false);
      console.error('❌ Erreur synthèse vocale:', error);
    }
  }, [selectedVoice, expertGender, expertName, cleanTextForSpeech, analyzeTextEmotion, isActive]);

  const stopSpeaking = useCallback(() => {
    console.log('🛑 Arrêt de la synthèse vocale demandé');
    
    if (utteranceRef.current) {
      speechSynthesis.cancel();
      utteranceRef.current = null;
    }
    
    setIsSpeaking(false);
    console.log('🔇 Synthèse vocale arrêtée');
  }, []);

  // Réinitialiser le suivi du nom quand la conversation se termine
  const resetConversation = useCallback(() => {
    hasSpokenNameRef.current = false;
    console.log('🔄 Réinitialisation du suivi du nom de l\'utilisateur');
  }, []);

  const replayLastMessage = useCallback(() => {
    if (!isActive) return;

    if (!lastMessage || lastMessage.trim().length === 0) {
      console.warn('⚠️ Aucun message à rejouer');
      toast({
        title: "⚠️ Aucun message",
        description: "Aucun message précédent à rejouer",
        duration: 3000
      });
      return;
    }
    
    console.log('🔄 Rejouer le dernier message:', lastMessage.substring(0, 50) + '...');
    speakWithNativeAPI(lastMessage);
  }, [lastMessage, speakWithNativeAPI, toast, isActive]);

  const startListening = useCallback(async () => {
    if (!isActive) {
      console.log('🔇 Agent inactif - pas de reconnaissance vocale');
      return;
    }

    console.log('🎤 Démarrage de l\'écoute...');
    
    if (!isSupported) {
      toast({
        title: "❌ Non supporté",
        description: "La reconnaissance vocale n'est pas supportée sur ce navigateur",
        variant: "destructive"
      });
      return;
    }

    if (isListening) {
      console.log('⚠️ Déjà en écoute');
      return;
    }

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
        console.log('🎤✅ Écoute démarrée - Parlez maintenant...');
        
        timeoutRef.current = setTimeout(() => {
          if (recognition && !isManualStopRef.current) {
            console.log('⏰ Timeout écoute - arrêt automatique');
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
          const cleanedText = transcript.trim();
          console.log('✅ Transcription reçue:', cleanedText);
          
          if (onTranscript) {
            onTranscript(cleanedText);
          }
          
          toast({
            title: "✅ Message vocal reçu",
            description: `"${cleanedText.substring(0, 50)}..."`,
            duration: 3000
          });
        }
        
        isManualStopRef.current = true;
        recognition.stop();
      };

      recognition.onerror = (event: any) => {
        console.error('❌ Erreur reconnaissance:', event.error);
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        setIsListening(false);
        
        if (event.error !== 'aborted' && !isManualStopRef.current) {
          let errorMessage = "Problème avec la reconnaissance vocale";
          
          switch (event.error) {
            case 'no-speech':
              errorMessage = "Aucune parole détectée. Réessayez en parlant plus fort.";
              break;
            case 'audio-capture':
              errorMessage = "Problème d'accès au microphone.";
              break;
            case 'not-allowed':
              errorMessage = "Accès microphone refusé.";
              break;
            case 'network':
              errorMessage = "Problème de connexion réseau.";
              break;
          }
          
          toast({
            title: "🎤 Erreur microphone",
            description: errorMessage,
            variant: "destructive",
            duration: 4000
          });
        }
      };

      recognition.onend = () => {
        console.log('🎤 Reconnaissance terminée');
        setIsListening(false);
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      
    } catch (error) {
      console.error('❌ Erreur démarrage reconnaissance:', error);
      toast({
        title: "❌ Erreur microphone",
        description: "Impossible d'accéder au microphone. Vérifiez les permissions.",
        variant: "destructive",
        duration: 5000
      });
      setIsListening(false);
    }
  }, [isSupported, isListening, onTranscript, toast, isActive]);

  const stopListening = useCallback(() => {
    console.log('🛑 Arrêt de la reconnaissance demandé');
    
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
    
    console.log('🔍 Support vocal natif:', {
      synthèse: speechSynthesisSupported,
      reconnaissance: speechRecognitionSupported,
      complet: fullSupport
    });

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
