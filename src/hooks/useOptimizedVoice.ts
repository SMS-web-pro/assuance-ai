import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseOptimizedVoiceProps {
  onTranscript?: (text: string) => void;
  language?: string;
  expertGender?: 'male' | 'female';
  expertName?: string;
}

export const useOptimizedVoice = ({ 
  onTranscript, 
  language = 'fr-FR',
  expertGender = 'female',
  expertName = ''
}: UseOptimizedVoiceProps = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [lastMessage, setLastMessage] = useState<string>('');
  
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageRef = useRef<string>('');
  const speakingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Vérification améliorée du support
  useEffect(() => {
    const checkSupport = () => {
      const speechRecognitionSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
      const speechSynthesisSupported = 'speechSynthesis' in window;
      
      const supported = speechRecognitionSupported && speechSynthesisSupported;
      setIsSupported(supported);
      
      console.log('🔍 Support vocal:', {
        reconnaissance: speechRecognitionSupported,
        synthese: speechSynthesisSupported,
        global: supported
      });
      
      return supported;
    };
    
    checkSupport();
  }, []);

  // Chargement des voix françaises avec priorité stricte aux voix natives
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
      
      if (voices.length > 0) {
        const bestFrenchVoice = selectBestNativeFrenchVoice(voices, expertGender);
        setSelectedVoice(bestFrenchVoice);
        console.log(`🇫🇷 Voix française native sélectionnée: ${bestFrenchVoice?.name || 'Aucune'} pour un agent ${expertGender === 'male' ? 'masculin' : 'féminin'}`);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [expertGender]);

  // Sélection optimisée des meilleures voix françaises natives
  const selectBestNativeFrenchVoice = useCallback((voices: SpeechSynthesisVoice[], gender: 'male' | 'female') => {
    // Filtrer uniquement les vraies voix françaises
    const nativeFrenchVoices = voices.filter(voice => {
      const lang = voice.lang.toLowerCase();
      const name = voice.name.toLowerCase();
      
      // Priorité absolue aux voix fr-FR natives
      return (lang === 'fr-fr' || lang === 'fr') && 
             voice.localService && // Voix locale (meilleure qualité)
             !name.includes('english') && 
             !name.includes('anglais') &&
             !name.includes('en-') &&
             !name.includes('us') &&
             !name.includes('uk');
    });

    console.log(`🔍 Voix françaises natives trouvées: ${nativeFrenchVoices.length}`);
    nativeFrenchVoices.forEach(v => console.log(`  - ${v.name} (${v.lang}) [${v.localService ? 'Local' : 'Remote'}]`));

    if (nativeFrenchVoices.length === 0) {
      // Fallback sur toutes les voix françaises si pas de natives
      const allFrenchVoices = voices.filter(voice => {
        const lang = voice.lang.toLowerCase();
        return lang.startsWith('fr') && !voice.name.toLowerCase().includes('english');
      });
      
      console.warn('⚠️ Aucune voix française native, fallback sur:', allFrenchVoices.map(v => v.name));
      return allFrenchVoices[0] || voices[0] || null;
    }

    // Score des voix avec focus sur la qualité française
    const scoredVoices = nativeFrenchVoices.map(voice => {
      let score = 100; // Score de base pour voix française native
      const name = voice.name.toLowerCase();
      
      // Bonus majeur pour voix système françaises de qualité
      if (name.includes('amélie') || name.includes('aurelie')) {
        score += (gender === 'female') ? 200 : -100;
      }
      if (name.includes('thomas') || name.includes('bernard')) {
        score += (gender === 'male') ? 200 : -100;
      }
      
      // Voix Microsoft françaises premium
      if (name.includes('microsoft')) {
        if (name.includes('hortense') && gender === 'female') {
          score += 180;
        } else if (name.includes('paul') && gender === 'male') {
          score += 180;
        } else if (name.includes('julie') && gender === 'female') {
          score += 160;
        } else if (name.includes('henri') && gender === 'male') {
          score += 160;
        }
      }
      
      // Voix Apple françaises (macOS/iOS)
      if (name.includes('amélie') || name.includes('aurélie')) {
        score += (gender === 'female') ? 150 : -50;
      }
      if (name.includes('thomas')) {
        score += (gender === 'male') ? 150 : -50;
      }
      
      // Détection fine par genre avec noms français
      const femaleKeywords = ['julie', 'marie', 'sophie', 'claire', 'florence', 'virginie', 'hortense', 'amélie', 'aurélie'];
      const maleKeywords = ['paul', 'thomas', 'henri', 'bernard', 'françois', 'michel', 'pierre', 'daniel'];
      
      if (gender === 'female') {
        const matchingFemale = femaleKeywords.find(keyword => name.includes(keyword));
        if (matchingFemale) {
          score += 120;
          console.log(`✨ Voix féminine française identifiée: ${voice.name} (${matchingFemale})`);
        }
        // Forte pénalité pour voix masculines
        const matchingMale = maleKeywords.find(keyword => name.includes(keyword));
        if (matchingMale) {
          score -= 150;
        }
      } else {
        const matchingMale = maleKeywords.find(keyword => name.includes(keyword));
        if (matchingMale) {
          score += 120;
          console.log(`✨ Voix masculine française identifiée: ${voice.name} (${matchingMale})`);
        }
        // Forte pénalité pour voix féminines
        const matchingFemale = femaleKeywords.find(keyword => name.includes(keyword));
        if (matchingFemale) {
          score -= 150;
        }
      }
      
      // Bonus pour qualité vocale premium
      if (name.includes('enhanced') || name.includes('premium') || name.includes('hd')) {
        score += 40;
      }
      
      // Bonus pour voix locales (meilleure réactivité)
      if (voice.localService) {
        score += 50;
      }
      
      return { voice, score };
    });

    scoredVoices.sort((a, b) => b.score - a.score);
    
    console.log(`🏆 Top 3 voix françaises ${gender === 'male' ? 'masculines' : 'féminines'}:`);
    scoredVoices.slice(0, 3).forEach((v, i) => {
      console.log(`  ${i + 1}. ${v.voice.name} - Score: ${v.score} [${v.voice.localService ? 'Local' : 'Remote'}]`);
    });

    return scoredVoices[0]?.voice || nativeFrenchVoices[0];
  }, []);

  // Nettoyage avancé du texte pour une prononciation française parfaite
  const cleanTextForPerfectFrenchSpeech = useCallback((text: string) => {
    if (!text) return '';
    
    let cleanedText = text;
    
    // Corrections phonétiques spécifiques au français
    const frenchPhonetics = {
      // Mots avec accents pour prononciation correcte
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
      
      // Anglicismes corrigés
      'email': 'courrier électronique',
      'smartphone': 'téléphone portable',
      'planning': 'emploi du temps',
      'meeting': 'réunion',
      'timing': 'calendrier',
      'feedback': 'retour',
      'deadline': 'échéance',
      
      // Abréviations développées
      'RDV': 'rendez-vous',
      'PDG': 'président directeur général',
      'TVA': 'taxe sur la valeur ajoutée',
      'SMIC': 'salaire minimum interprofessionnel de croissance',
      'PME': 'petite et moyenne entreprise',
      'SAS': 'société par actions simplifiée',
      'SARL': 'société à responsabilité limitée',
      
      // Corrections de prononciation courantes
      'COVID-19': 'covid dix-neuf',
      'COVID': 'covid',
      'Mr': 'Monsieur',
      'Mrs': 'Madame',
      'vs': 'contre',
      'etc': 'et cætera',
      'ex': 'exemple',
      'ie': 'c\'est-à-dire',
      'ok': 'd\'accord',
      'OK': 'd\'accord'
    };
    
    // Application des corrections phonétiques
    Object.entries(frenchPhonetics).forEach(([wrong, correct]) => {
      const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
      cleanedText = cleanedText.replace(regex, correct);
    });
    
    // Développement des abréviations françaises standard
    const frenchAbbreviations = {
      'M\\.': 'Monsieur',
      'Mme': 'Madame',
      'Mlle': 'Mademoiselle',
      'Dr\\.?': 'Docteur',
      'Pr\\.?': 'Professeur',
      'St\\.?': 'Saint',
      'Ste\\.?': 'Sainte',
      '€': 'euros',
      '%': 'pour cent',
      '&': 'et',
      '@': 'arobase'
    };
    
    Object.entries(frenchAbbreviations).forEach(([abbrev, full]) => {
      const regex = new RegExp(`\\b${abbrev}\\b`, 'gi');
      cleanedText = cleanedText.replace(regex, full);
    });

    // Amélioration de la ponctuation pour des pauses naturelles
    cleanedText = cleanedText.replace(/([.!?])\s*/g, '$1... '); // Pause après phrase
    cleanedText = cleanedText.replace(/([,;:])\s*/g, '$1 '); // Pause courte
    cleanedText = cleanedText.replace(/([—–-]{2,})/g, '... pause longue ...'); // Tirets longs
    
    // Séparation des énumérations pour respiration
    cleanedText = cleanedText.replace(/(\w+),\s*(\w+),\s*(\w+)/g, '$1,... $2,... et $3');
    
    // Correction des nombres pour prononciation française
    cleanedText = cleanedText.replace(/\b(\d{1,3})(\s?)(\d{3})\b/g, '$1 $3'); // 1000 -> 1 000
    cleanedText = cleanedText.replace(/\b0(\d)/g, 'zéro $1'); // 01 -> zéro 1
    
    return cleanedText.replace(/\s+/g, ' ').trim();
  }, []);

  // Synthèse vocale française premium avec paramètres optimisés
  const speakWithPerfectFrenchVoice = useCallback((text: string) => {
    const cleanedText = cleanTextForPerfectFrenchSpeech(text);
    
    if (!cleanedText || cleanedText.length < 2) {
      console.warn('⚠️ Texte trop court pour la synthèse vocale');
      return;
    }
    
    if (!('speechSynthesis' in window)) {
      console.error('❌ Synthèse vocale non supportée');
      return;
    }

    // Arrêter toute synthèse en cours
    window.speechSynthesis.cancel();
    if (speakingTimeoutRef.current) {
      clearTimeout(speakingTimeoutRef.current);
      speakingTimeoutRef.current = null;
    }

    // Stocker le message
    setLastMessage(cleanedText);
    lastMessageRef.current = cleanedText;
    console.log('💾 Message stocké pour réécoute:', cleanedText.substring(0, 50) + '...');

    speakingTimeoutRef.current = setTimeout(() => {
      setIsSpeaking(true);
      
      const utterance = new SpeechSynthesisUtterance(cleanedText);
      
      // Configuration stricte pour le français
      utterance.lang = 'fr-FR';
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log(`🎭 Utilisation de la voix française native: ${selectedVoice.name}`);
      }
      
      // Paramètres optimisés pour le français naturel
      if (expertGender === 'female') {
        utterance.rate = 0.8;    // Débit naturel féminin français
        utterance.pitch = 1.0;   // Pitch naturel français
        utterance.volume = 0.9;  // Volume optimal
      } else {
        utterance.rate = 0.75;   // Débit masculin français
        utterance.pitch = 0.8;   // Pitch masculin français
        utterance.volume = 0.9;
      }
      
      // Ajustements dynamiques selon le contenu
      if (cleanedText.length > 150) {
        utterance.rate *= 0.9; // Plus lent pour textes longs
      }
      
      if (cleanedText.includes('?')) {
        utterance.pitch *= 1.15; // Intonation interrogative française
      }
      
      if (cleanedText.includes('!')) {
        utterance.volume *= 1.1; // Emphase pour exclamation
        utterance.rate *= 0.95;  // Légèrement plus lent
      }
      
      // Ajustement pour les noms propres et termes techniques
      if (cleanedText.match(/[A-Z][a-z]+\s[A-Z][a-z]+/)) {
        utterance.rate *= 0.9; // Plus lent pour noms propres
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        console.log(`🇫🇷 Lecture française ${expertGender} démarrée: "${cleanedText.substring(0, 50)}..."`);
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
        console.log('✅ Lecture française terminée');
      };
      
      utterance.onerror = (event) => {
        setIsSpeaking(false);
        if (event.error !== 'interrupted') {
          console.error('❌ Erreur synthèse française:', event.error);
        }
      };
      
      window.speechSynthesis.speak(utterance);
    }, 150); // Délai légèrement réduit pour plus de réactivité
  }, [selectedVoice, cleanTextForPerfectFrenchSpeech, expertGender]);

  // Fonction pour arrêter la synthèse vocale
  const stopSpeaking = useCallback(() => {
    console.log('🛑 Arrêt de la synthèse vocale demandé');
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    if (speakingTimeoutRef.current) {
      clearTimeout(speakingTimeoutRef.current);
      speakingTimeoutRef.current = null;
    }
    
    setIsSpeaking(false);
    console.log('🔇 Synthèse vocale arrêtée');
  }, []);

  // Fonction pour rejouer le dernier message
  const replayLastMessage = useCallback(() => {
    const messageToReplay = lastMessageRef.current || lastMessage;
    
    if (!messageToReplay || messageToReplay.trim().length === 0) {
      console.warn('⚠️ Aucun message à rejouer');
      toast({
        title: "⚠️ Aucun message",
        description: "Aucun message précédent à rejouer",
        duration: 3000
      });
      return;
    }
    
    console.log('🔄 Rejouer le dernier message:', messageToReplay.substring(0, 50) + '...');
    speakWithPerfectFrenchVoice(messageToReplay);
    
    toast({
      title: "🔄 Message rejoué",
      description: `"${messageToReplay.substring(0, 50)}..."`,
      duration: 3000
    });
  }, [lastMessage, speakWithPerfectFrenchVoice, toast]);

  // Reconnaissance vocale optimisée pour l'envoi au chat
  const initSpeechRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      console.error('❌ Reconnaissance vocale non supportée');
      setIsSupported(false);
      return null;
    }

    const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionConstructor();
    
    // Configuration optimisée pour réduire les erreurs "no-speech"
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'fr-FR';
    recognition.maxAlternatives = 3;
    
    recognition.onstart = () => {
      setIsListening(true);
      console.log('🎤 Écoute démarrée - Parlez maintenant...');
      
      // Timeout de sécurité plus long
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        if (recognition && isListening) {
          console.log('⏰ Timeout de reconnaissance - redémarrage');
          recognition.stop();
          // Redémarrer automatiquement après un court délai
          setTimeout(() => {
            if (isListening) {
              recognition.start();
            }
          }, 500);
        }
      }, 15000);
      
      toast({
        title: "🎤 Microphone activé",
        description: "Parlez clairement et distinctement",
        duration: 3000
      });
    };

    recognition.onresult = (event: any) => {
      console.log('📝 Événement de reconnaissance:', event);
      
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
          console.log('✅ Transcription finale:', transcript);
        } else {
          interimTranscript += transcript;
          console.log('⏳ Transcription intermédiaire:', transcript);
        }
      }
      
      // Envoyer immédiatement si on a une transcription finale
      if (finalTranscript && finalTranscript.trim()) {
        const cleanedText = finalTranscript.trim();
        console.log('💬 Envoi de la transcription finale:', cleanedText);
        
        if (onTranscript) {
          onTranscript(cleanedText);
        }
        
        toast({
          title: "✅ Message envoyé",
          description: `"${cleanedText.substring(0, 50)}..."`,
          duration: 3000
        });
        
        // Arrêter la reconnaissance après envoi
        recognition.stop();
      }
    };

    recognition.onerror = (event: any) => {
      console.error('❌ Erreur reconnaissance:', event.error);
      
      let shouldRestart = false;
      let errorMessage = "Erreur inconnue";
      
      switch (event.error) {
        case 'not-allowed':
          errorMessage = "Accès au microphone refusé. Veuillez autoriser l'accès.";
          setIsListening(false);
          break;
        case 'no-speech':
          errorMessage = "Aucune parole détectée. Essayez de parler plus fort.";
          shouldRestart = true;
          break;
        case 'audio-capture':
          errorMessage = "Problème de capture audio. Vérifiez votre microphone.";
          setIsListening(false);
          break;
        case 'network':
          errorMessage = "Erreur de connexion. Vérifiez votre connexion internet.";
          shouldRestart = true;
          break;
        case 'aborted':
          errorMessage = "Reconnaissance interrompue.";
          setIsListening(false);
          break;
        default:
          shouldRestart = true;
          break;
      }
      
      if (shouldRestart && isListening) {
        console.log('🔄 Redémarrage automatique de la reconnaissance...');
        setTimeout(() => {
          if (isListening) {
            try {
              recognition.start();
            } catch (error) {
              console.error('❌ Impossible de redémarrer:', error);
              setIsListening(false);
            }
          }
        }, 1000);
      } else {
        setIsListening(false);
        toast({
          title: "❌ Erreur vocale",
          description: errorMessage,
          variant: "destructive",
          duration: 5000
        });
      }
    };

    recognition.onend = () => {
      console.log('🎤 Reconnaissance terminée');
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Ne pas changer l'état ici si on va redémarrer
      if (!isListening) {
        setIsListening(false);
      }
    };

    return recognition;
  }, [onTranscript, toast, isListening]);

  const startListening = useCallback(async () => {
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
      // Test du microphone avec paramètres optimisés
      console.log('🔍 Test du microphone...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      
      // Vérifier le niveau audio
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const mediaStreamSource = audioContext.createMediaStreamSource(stream);
      const analyzer = audioContext.createAnalyser();
      mediaStreamSource.connect(analyzer);
      
      const dataArray = new Uint8Array(analyzer.frequencyBinCount);
      analyzer.getByteFrequencyData(dataArray);
      
      console.log('🎵 Niveau audio détecté:', Math.max(...dataArray));
      
      // Nettoyer les ressources de test
      stream.getTracks().forEach(track => track.stop());
      audioContext.close();
      
      if (!recognitionRef.current) {
        recognitionRef.current = initSpeechRecognition();
      }
      
      if (recognitionRef.current) {
        console.log('🚀 Démarrage de la reconnaissance...');
        recognitionRef.current.start();
      }
    } catch (error) {
      console.error('❌ Erreur accès microphone:', error);
      toast({
        title: "❌ Erreur microphone",
        description: "Impossible d'accéder au microphone. Vérifiez vos paramètres et autorisations.",
        variant: "destructive",
        duration: 5000
      });
      setIsListening(false);
    }
  }, [initSpeechRecognition, isListening, isSupported, toast]);

  const stopListening = useCallback(() => {
    console.log('🛑 Arrêt de la reconnaissance demandé');
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      console.log('🛑 Reconnaissance arrêtée');
    }
    
    setIsListening(false);
  }, [isListening]);

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (speakingTimeoutRef.current) {
        clearTimeout(speakingTimeoutRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const hasLastMessage = Boolean((lastMessageRef.current || lastMessage) && (lastMessageRef.current || lastMessage).trim().length > 0);

  console.log('📊 État du système vocal français:', {
    hasLastMessage,
    lastMessageLength: lastMessage.length,
    lastMessageRefLength: lastMessageRef.current.length,
    expertGender,
    selectedVoiceName: selectedVoice?.name || 'Aucune voix française',
    isNativeVoice: selectedVoice?.localService || false
  });

  return {
    isListening,
    isSpeaking,
    isSupported,
    startListening,
    stopListening,
    speak: speakWithPerfectFrenchVoice,
    stopSpeaking,
    replayLastMessage,
    hasLastMessage,
    isAvailable: isSupported,
    selectedVoice: selectedVoice?.name || 'Voix française système',
    availableVoicesCount: availableVoices.length
  };
};

// Déclarations TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    AudioContext: any;
    webkitAudioContext: any;
  }
}
