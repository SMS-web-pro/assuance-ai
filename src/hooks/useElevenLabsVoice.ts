import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseElevenLabsVoiceProps {
  onTranscript?: (text: string) => void;
  language?: string;
  expertGender?: 'male' | 'female';
  expertName?: string;
}

const ELEVENLABS_API_KEY = 'sk_2e56d58f1e978ab3ef8848dd1bdc0dbbce22a17aeb540579';

// Voix ElevenLabs optimisées pour le français
const FRENCH_VOICES = {
  female: {
    id: 'pFZP5JQG7iQjIQuC4Bku', // Lily - voix féminine naturelle
    name: 'Lily'
  },
  male: {
    id: 'onwK4e9ZLuTAKqWW03F9', // Daniel - voix masculine naturelle
    name: 'Daniel'
  }
};

export const useElevenLabsVoice = ({ 
  onTranscript, 
  language = 'fr-FR',
  expertGender = 'female',
  expertName = ''
}: UseElevenLabsVoiceProps = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [lastMessage, setLastMessage] = useState<string>('');
  
  const recognitionRef = useRef<any>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageRef = useRef<string>('');
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  // Vérification du support
  useEffect(() => {
    const speechRecognitionSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    setIsSupported(speechRecognitionSupported);
    
    console.log('🔍 Support vocal ElevenLabs:', {
      reconnaissance: speechRecognitionSupported,
      elevenLabs: true
    });
  }, []);

  // Fonction pour nettoyer le texte avant lecture vocale
  const cleanTextForSpeech = useCallback((text: string): string => {
    return text
      // Supprimer les caractères markdown
      .replace(/\*\*/g, '') // gras
      .replace(/\*/g, '') // italique
      .replace(/#{1,6}\s/g, '') // titres
      .replace(/`{1,3}[^`]*`{1,3}/g, '') // code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // liens
      // Supprimer les exemples
      .replace(/\(.*?[Ee]xemple.*?\)/gi, '') // exemples entre parenthèses
      .replace(/[Ee]xemple\s*:.*?(?=\.|$)/gi, '') // exemples avec deux points
      .replace(/[Ee]x\s*:.*?(?=\.|$)/gi, '') // ex: 
      .replace(/\(.*?\)/g, '') // tout contenu entre parenthèses
      // Supprimer "Récapitulatif"
      .replace(/[Rr]écapitulatif/g, '')
      // Supprimer les dates format JJ/MM/AAAA et variations
      .replace(/\d{1,2}\/\d{1,2}\/\d{2,4}/g, '')
      .replace(/\d{1,2}-\d{1,2}-\d{2,4}/g, '')
      .replace(/\d{1,2}\.\d{1,2}\.\d{2,4}/g, '')
      // Supprimer les caractères spéciaux et symboles
      .replace(/°/g, '') // degré
      .replace(/[°•★☆♦◆▲▼◀▶←→↑↓]/g, '') // symboles géométriques
      .replace(/[§¶†‡•‰‱]/g, '') // caractères de ponctuation spéciaux
      .replace(/[©®™]/g, '') // symboles de marque
      // Supprimer tous les émojis (plage étendue)
      .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]/gu, '')
      // Supprimer les caractères de formatage spéciaux et icônes communes
      .replace(/📅|⭐|✅|❌|🔥|💡|📝|📊|⚠️|🎯|🚀|💪|🏆|🎉|📱|💻|🔧|⚙️|📞|📧|🏠|🚗|🏥|✈️|🛡️|💰|📋|📍|🔍|➡️|⬇️|⬆️|⬅️/g, '')
      // Supprimer les caractères de mise en forme
      .replace(/Format recommandé\s*:/gi, '')
      .replace(/\*Format[^*]*\*/gi, '')
      // Nettoyer les espaces multiples et caractères invisibles
      .replace(/\s+/g, ' ')
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // espaces invisibles
      .trim();
  }, []);

  // Fonction pour convertir le texte en audio avec ElevenLabs
  const speakWithElevenLabs = useCallback(async (text: string) => {
    if (!text || text.trim().length < 2) {
      console.warn('⚠️ Texte trop court pour ElevenLabs');
      return;
    }

    // Nettoyer le texte avant de le faire parler
    const cleanedText = cleanTextForSpeech(text);
    if (!cleanedText || cleanedText.trim().length < 2) {
      console.warn('⚠️ Texte nettoyé trop court pour ElevenLabs');
      return;
    }

    // Arrêter l'audio en cours
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    // Stocker le message
    setLastMessage(text);
    lastMessageRef.current = text;
    console.log(`🎭 ElevenLabs - Génération audio pour ${expertName} (${expertGender}):`, text.substring(0, 50) + '...');

    try {
      setIsSpeaking(true);
      
      const selectedVoice = FRENCH_VOICES[expertGender];
      console.log(`🎵 Utilisation de la voix ElevenLabs: ${selectedVoice.name} (${selectedVoice.id})`);

      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedVoice.id}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text: cleanedText,
          model_id: 'eleven_multilingual_v2', // Modèle multilingue v2 pour le français
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.2,
            use_speaker_boost: true
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur ElevenLabs: ${response.status} ${response.statusText}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      currentAudioRef.current = audio;

      audio.onplay = () => {
        setIsSpeaking(true);
        console.log(`🎙️ Lecture ElevenLabs démarrée: "${text.substring(0, 50)}..."`);
      };

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
        console.log('✅ Lecture ElevenLabs terminée');
      };

      audio.onerror = (error) => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
        console.error('❌ Erreur lecture audio ElevenLabs:', error);
      };

      await audio.play();

    } catch (error) {
      setIsSpeaking(false);
      console.error('❌ Erreur ElevenLabs:', error);
      toast({
        title: "❌ Erreur vocale",
        description: "Impossible de générer l'audio avec ElevenLabs",
        variant: "destructive",
        duration: 5000
      });
    }
  }, [expertGender, expertName, toast]);

  // Fonction pour arrêter la lecture
  const stopSpeaking = useCallback(() => {
    console.log('🛑 Arrêt de la lecture ElevenLabs demandé');
    
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    
    setIsSpeaking(false);
    console.log('🔇 Lecture ElevenLabs arrêtée');
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
    
    console.log('🔄 Rejouer le dernier message ElevenLabs:', messageToReplay.substring(0, 50) + '...');
    speakWithElevenLabs(messageToReplay);
    
    toast({
      title: "🔄 Message rejoué",
      description: `"${messageToReplay.substring(0, 50)}..."`,
      duration: 3000
    });
  }, [lastMessage, speakWithElevenLabs, toast]);

  // Reconnaissance vocale (garde le système natif pour l'entrée utilisateur)
  const initSpeechRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      console.error('❌ Reconnaissance vocale non supportée');
      setIsSupported(false);
      return null;
    }

    const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionConstructor();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'fr-FR';
    recognition.maxAlternatives = 3;
    
    recognition.onstart = () => {
      setIsListening(true);
      console.log('🎤 Écoute démarrée - Parlez maintenant...');
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        if (recognition && isListening) {
          console.log('⏰ Timeout de reconnaissance - redémarrage');
          recognition.stop();
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
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
          console.log('✅ Transcription finale:', transcript);
        }
      }
      
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
      console.log('🔍 Test du microphone...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const mediaStreamSource = audioContext.createMediaStreamSource(stream);
      const analyzer = audioContext.createAnalyser();
      mediaStreamSource.connect(analyzer);
      
      const dataArray = new Uint8Array(analyzer.frequencyBinCount);
      analyzer.getByteFrequencyData(dataArray);
      
      console.log('🎵 Niveau audio détecté:', Math.max(...dataArray));
      
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
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
    };
  }, []);

  const hasLastMessage = Boolean((lastMessageRef.current || lastMessage) && (lastMessageRef.current || lastMessage).trim().length > 0);

  console.log('📊 État du système vocal ElevenLabs:', {
    hasLastMessage,
    lastMessageLength: lastMessage.length,
    expertGender,
    selectedVoice: FRENCH_VOICES[expertGender].name
  });

  return {
    isListening,
    isSpeaking,
    isSupported,
    startListening,
    stopListening,
    speak: speakWithElevenLabs,
    stopSpeaking,
    replayLastMessage,
    hasLastMessage,
    isAvailable: isSupported,
    selectedVoice: `ElevenLabs ${FRENCH_VOICES[expertGender].name}`,
    availableVoicesCount: Object.keys(FRENCH_VOICES).length
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