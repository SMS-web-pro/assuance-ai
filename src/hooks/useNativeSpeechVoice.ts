
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

    console.log('Voix disponibles pour la sélection:', voices.map(v => `${v.name} (${v.lang})`));
    
    let bestVoice: SpeechSynthesisVoice | null = null;
    let bestScore = 0;

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

      for (let i = 0; i < agentConfig.preferred.length; i++) {
        if (voiceName.includes(agentConfig.preferred[i].toLowerCase())) {
          score += (200 - i * 20);
          break;
        }
      }

      for (let i = 0; i < agentConfig.fallback.length; i++) {
        if (voiceName.includes(agentConfig.fallback[i])) {
          score += (100 - i * 15);
          break;
        }
      }

      const isMale = voiceName.includes('paul') || voiceName.includes('thomas') || voiceName.includes('henri') || voiceName.includes('male');
      const isFemale = voiceName.includes('marie') || voiceName.includes('julie') || voiceName.includes('hortense') || voiceName.includes('female');

      if ((gender === 'male' && isMale) || (gender === 'female' && isFemale)) {
        score += 150;
      }

      if (voiceName.includes('microsoft')) score += 80;
      if (voiceName.includes('google')) score += 70;
      if (voiceName.includes('premium')) score += 60;
      if (voiceName.includes('enhanced')) score += 50;

      if (voiceLang === 'fr-fr') score += 40;
      if (voiceLang.startsWith('fr-')) score += 30;

      if (voice.localService) score += 25;

      if (voice.default) score += 15;

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

  // Nettoyage professionnel du texte pour une voix naturelle et humaine
  const cleanTextForSpeech = useCallback((text: string): string => {
    let cleanedText = text;
    
    // 1. Corrections phonétiques françaises pour prononciation correcte
    const frenchPhonetics: Record<string, string> = {
      'prenom': 'prénom',
      'numero': 'numéro',
      'telephone': 'téléphone',
      'medecin': 'médecin',
      'securite': 'sécurité',
      'societe': 'société',
      'activite': 'activité',
      'qualite': 'qualité',
      'vehicule': 'véhicule',
      'general': 'général',
      'medical': 'médical',
      'hopital': 'hôpital',
      'euros': 'euros',
      'informations': 'informations',
      'professionnel': 'professionnel',
      'démarchage': 'démarchage',
      'conformément': 'conformément',
      'réglementation': 'réglementation'
    };

    Object.entries(frenchPhonetics).forEach(([wrong, correct]) => {
      const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
      cleanedText = cleanedText.replace(regex, correct);
    });

    // 2. Développement des abréviations et symboles
    const abbreviations: Record<string, string> = {
      'M.': 'Monsieur',
      'Mme': 'Madame',
      'Mlle': 'Mademoiselle',
      'Dr': 'Docteur',
      'Pr': 'Professeur',
      'RDV': 'rendez-vous',
      '€': 'euros',
      '%': 'pour cent',
      '&': 'et',
      '@': 'arobase',
      '01': 'zéro un',
      '02': 'zéro deux',
      '03': 'zéro trois',
      '04': 'zéro quatre',
      '05': 'zéro cinq',
      '06': 'zéro six',
      '07': 'zéro sept',
      '08': 'zéro huit',
      '09': 'zéro neuf'
    };

    Object.entries(abbreviations).forEach(([abbrev, full]) => {
      const regex = new RegExp(`\\b${abbrev.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
      cleanedText = cleanedText.replace(regex, full);
    });

    // 3. Supprimer markdown et formatage
    cleanedText = cleanedText
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/`{1,3}[^`]*`{1,3}/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\(.*?\)/g, '');

    // 4. Supprimer emojis sauf les ponctuations
    cleanedText = cleanedText.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]/gu, '');

    // 5. Ponctuation naturelle pour pauses humaines
    cleanedText = cleanedText
      .replace(/\.\.\./g, ', pause,') // Trois points = pause
      .replace(/—/g, ', pause,') // Tiret long = pause
      .replace(/–/g, ', pause,') // Tiret moyen = pause
      .replace(/([.!?])\s+/g, '$1, ') // Après ponctuation = micro-pause
      .replace(/([,;:])\s*/g, '$1 ') // Virgules propres
      .replace(/:\s*/g, ' : ') // Deux-points espacés
      .replace(/\s+/g, ' ') // Espaces multiples = un seul
      .trim();

    return cleanedText;
  }, []);

  // Analyse émotionnelle avancée pour modulation vocale naturelle
  const analyzeTextEmotion = useCallback((text: string, agentName: string) => {
    const lowerText = text.toLowerCase();
    
    // Personnalités vocales optimisées pour chaque agent
    const agentPersonalities: Record<string, { 
      baseRate: number; 
      basePitch: number; 
      baseVolume: number;
      warmth: number;
      confidence: number;
      expertise: number;
    }> = {
      'Marc Dubois': { 
        baseRate: 0.82, basePitch: 0.88, baseVolume: 0.95,
        warmth: 1.1, confidence: 1.3, expertise: 1.2
      },
      'Sophie Martin': { 
        baseRate: 0.85, basePitch: 1.05, baseVolume: 0.94,
        warmth: 1.3, confidence: 1.1, expertise: 1.2
      },
      'Dr. Claire Rousseau': { 
        baseRate: 0.80, basePitch: 1.02, baseVolume: 0.93,
        warmth: 1.2, confidence: 1.2, expertise: 1.5
      },
      'Alex Moreau': { 
        baseRate: 0.88, basePitch: 0.90, baseVolume: 0.96,
        warmth: 1.0, confidence: 1.2, expertise: 1.1
      },
      'Pierre Delacroix': { 
        baseRate: 0.78, basePitch: 0.82, baseVolume: 0.94,
        warmth: 0.9, confidence: 1.4, expertise: 1.3
      },
      'Camille Durand': { 
        baseRate: 0.86, basePitch: 1.08, baseVolume: 0.95,
        warmth: 1.2, confidence: 1.1, expertise: 1.0
      }
    };

    const personality = agentPersonalities[agentName] || agentPersonalities['Sophie Martin'];

    // Détection d'émotions par mots-clés français
    const emotionKeywords = {
      joie: ['merci', 'parfait', 'excellent', 'super', 'génial', 'formidable', 'bravo', 'félicitations', 'content', 'ravi', 'magnifique', 'wonderful'],
      enthousiasme: ['fantastique', 'incroyable', 'extraordinaire', 'merveilleux', 'sensationnel', 'exceptionnel'],
      inquiétude: ['problème', 'soucis', 'difficile', 'compliqué', 'inquiet', 'préoccupé', 'grave', 'attention', 'risque'],
      urgence: ['urgent', 'rapidement', 'vite', 'immédiatement', 'important', 'pressé', 'crucial', 'dès que possible'],
      politesse: ['bonjour', 'bonsoir', 's\'il vous plaît', 'merci', 'excusez-moi', 'pardon', 'veuillez', 'je vous en prie'],
      expertise: ['technique', 'spécialisé', 'professionnel', 'expert', 'précisément', 'exactement', 'conformément'],
      empathie: ['comprends', 'ressens', 'accompagne', 'soutien', 'aide', 'écoute', 'accompagner', 'vous accompagne']
    };

    let emotionIntensity = {
      joy: 0,
      concern: 0,
      urgency: 0,
      formality: 0,
      expertise: 0,
      empathy: 0
    };

    Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
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
      isLong: text.length > 150,
      hasNumbers: /\d/.test(text),
      hasEmail: /@/.test(text),
      sentenceCount: text.split(/[.!?]+/).filter(s => s.trim().length > 3).length
    };
  }, []);

  // Synthèse vocale professionnelle avec pauses naturelles
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
      
      // Configuration vocale professionnelle avec modulation naturelle
      let voiceConfig = {
        rate: emotion.personality.baseRate,
        pitch: emotion.personality.basePitch,
        volume: emotion.personality.baseVolume
      };

      // Modulation dynamique selon l'émotion détectée
      if (emotion.joy > 0) {
        voiceConfig.rate *= 1.05;
        voiceConfig.pitch *= expertGender === 'female' ? 1.08 : 1.05;
        voiceConfig.volume = Math.min(1.0, voiceConfig.volume * 1.03);
      } else if (emotion.concern > 0) {
        voiceConfig.rate *= 0.88;
        voiceConfig.pitch *= 0.95;
        voiceConfig.volume *= 0.95;
      } else if (emotion.urgency > 0) {
        voiceConfig.rate *= 1.02;
        voiceConfig.pitch *= 1.01;
      } else if (emotion.expertise > 0) {
        voiceConfig.rate *= 0.92;
        voiceConfig.pitch *= 0.98;
      } else if (emotion.empathy > 0) {
        voiceConfig.rate *= 0.90;
        voiceConfig.pitch *= expertGender === 'female' ? 1.03 : 0.95;
        voiceConfig.volume *= 0.97;
      }

      // Ajustements contextuels
      if (emotion.isLong) voiceConfig.rate *= 0.95;
      if (emotion.hasNumbers) voiceConfig.rate *= 0.92;
      if (emotion.isQuestion) voiceConfig.pitch *= 1.05;
      if (emotion.isExclamation) voiceConfig.volume = Math.min(1.0, voiceConfig.volume * 1.05);

      // Borner les valeurs
      voiceConfig.rate = Math.max(0.6, Math.min(1.2, voiceConfig.rate));
      voiceConfig.pitch = Math.max(0.7, Math.min(1.3, voiceConfig.pitch));
      voiceConfig.volume = Math.max(0.8, Math.min(1.0, voiceConfig.volume));

      // Segmentation intelligente pour pauses naturelles
      const sentences = cleanedText.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 3);
      
      if (sentences.length > 2) {
        console.log(`📝 Lecture segmentée: ${sentences.length} phrases | Rate: ${voiceConfig.rate.toFixed(2)} | Pitch: ${voiceConfig.pitch.toFixed(2)}`);
        
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
                  // Pause dynamique selon la ponctuation
                  const prevChar = sentence.slice(-1);
                  let pauseDuration = 250; // Défaut
                  
                  if (prevChar === '.') pauseDuration = 400; // Fin de phrase
                  else if (prevChar === '!') pauseDuration = 450; // Exclamation
                  else if (prevChar === '?') pauseDuration = 450; // Question
                  else if (prevChar === ',') pauseDuration = 200; // Virgule
                  else if (prevChar === ':') pauseDuration = 300; // Deux-points
                  
                  // Micro-respiration pour phrases longues
                  if (sentence.length > 80) pauseDuration += 150;
                  
                  setTimeout(speakNextSentence, pauseDuration);
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
              
              utteranceRef.current = sentenceUtterance;
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

      // Texte court : lecture directe
      const utterance = new SpeechSynthesisUtterance(cleanedText);
      utteranceRef.current = utterance;
      
      utterance.voice = selectedVoice;
      utterance.lang = 'fr-FR';
      utterance.rate = voiceConfig.rate;
      utterance.pitch = voiceConfig.pitch;
      utterance.volume = voiceConfig.volume;

      utterance.onstart = () => {
        setIsSpeaking(true);
        console.log(`🎙️ 🔊 Lecture professionnelle: "${text.substring(0, 50)}..." | Rate: ${voiceConfig.rate.toFixed(2)} | Pitch: ${voiceConfig.pitch.toFixed(2)}`);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        utteranceRef.current = null;
        console.log('✅ Lecture terminée');
      };

      utterance.onerror = (error) => {
        setIsSpeaking(false);
        utteranceRef.current = null;
        console.error('❌ Erreur synthèse vocale:', error);
      };

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
