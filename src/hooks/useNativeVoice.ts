

import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface UseNativeVoiceProps {
  onTranscript?: (text: string) => void;
  language?: string;
  expertGender?: 'male' | 'female';
  expertName?: string;
}

export const useNativeVoice = ({ 
  onTranscript, 
  language = 'fr-FR',
  expertGender = 'female',
  expertName = ''
}: UseNativeVoiceProps = {}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  // Fonction pour nettoyer le texte - supprime TOUS les caractères spéciaux, exemples, formats et remarques
  const cleanTextForSpeech = useCallback((text: string) => {
    if (!text) return '';
    
    let cleanedText = text;
    
    // Supprimer les formats conseillés (Format conseillé:, Format suggéré:, etc.)
    cleanedText = cleanedText.replace(/format\s+(conseillé|suggéré|recommandé)\s*:.*$/gim, '');
    cleanedText = cleanedText.replace(/format\s*:.*$/gim, '');
    
    // Supprimer les remarques (Remarque:, Note:, Attention:, etc.)
    cleanedText = cleanedText.replace(/remarque\s*:.*$/gim, '');
    cleanedText = cleanedText.replace(/note\s*:.*$/gim, '');
    cleanedText = cleanedText.replace(/attention\s*:.*$/gim, '');
    cleanedText = cleanedText.replace(/important\s*:.*$/gim, '');
    cleanedText = cleanedText.replace(/conseil\s*:.*$/gim, '');
    cleanedText = cleanedText.replace(/astuce\s*:.*$/gim, '');
    
    // Supprimer les sections de format ou de conseils entre parenthèses
    cleanedText = cleanedText.replace(/\([^)]*(?:format|conseil|remarque|note)[^)]*\)/gi, '');
    
    // Supprimer complètement les exemples (tout ce qui est entre parenthèses avec "ex:", "exemple", etc.)
    cleanedText = cleanedText.replace(/\([^)]*(?:ex:|exemple|par exemple)[^)]*\)/gi, '');
    cleanedText = cleanedText.replace(/\([^)]*(?:comme|tel que)[^)]*\)/gi, '');
    
    // Supprimer les sections d'exemples avec tirets ou puces
    cleanedText = cleanedText.replace(/[-•*]\s*[^.\n]*(?:exemple|ex\s*:|format|conseil|remarque)[^.\n]*/gi, '');
    
    // Supprimer les lignes qui commencent par des mots-clés de format/conseil
    cleanedText = cleanedText.replace(/^(format|conseil|remarque|note|attention|important|astuce)\s*:.*$/gim, '');
    
    // Supprimer tous les emojis et symboles unicode
    cleanedText = cleanedText.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '');
    
    // Supprimer tous les caractères spéciaux couramment utilisés
    cleanedText = cleanedText.replace(/[🎯📞🏡🩺🏍️🏠✈️🎤🎭📊🎵✅❌🎙️]/g, '');
    
    // Supprimer TOUS les caractères de ponctuation et symboles spéciaux
    cleanedText = cleanedText.replace(/[\*\-_•\+\=\#\@\$\%\^\&\(\)\[\]\{\}\|\\\~\`]/g, ' ');
    
    // Supprimer les tirets multiples et les convertir en pauses
    cleanedText = cleanedText.replace(/[-–—]+/g, ', ');
    
    // Supprimer les points multiples
    cleanedText = cleanedText.replace(/\.{2,}/g, '. ');
    
    // Garder seulement les lettres, chiffres, espaces et ponctuation de base (. , ! ? : ;)
    cleanedText = cleanedText.replace(/[^\w\s\.,!?;:àâäéèêëïîôöùûüÿç]/gi, ' ');
    
    // Nettoyer les espaces multiples
    cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
    
    // Remplacer les abréviations courantes par leur forme complète
    cleanedText = cleanedText.replace(/\bm²\b/g, 'mètres carrés');
    cleanedText = cleanedText.replace(/\b€\b/g, 'euros');
    cleanedText = cleanedText.replace(/\bkm\b/g, 'kilomètres');
    cleanedText = cleanedText.replace(/\bkm\/h\b/g, 'kilomètres par heure');
    cleanedText = cleanedText.replace(/\b%\b/g, 'pourcent');
    
    // Supprimer les phrases trop courtes ou sans sens
    if (cleanedText.length < 3) return '';
    
    console.log('🧹 Texte original:', text.substring(0, 100) + '...');
    console.log('✨ Texte nettoyé:', cleanedText.substring(0, 100) + '...');
    
    return cleanedText;
  }, []);

  // Initialisation de la reconnaissance vocale
  const initSpeechRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      setIsSupported(false);
      return null;
    }

    const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionConstructor();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        }
      }
      
      if (finalTranscript && onTranscript) {
        onTranscript(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Erreur reconnaissance vocale:', event.error);
      setIsListening(false);
      
      if (event.error === 'not-allowed') {
        toast({
          title: "Accès refusé",
          description: "Veuillez autoriser l'accès au microphone pour utiliser la fonction vocale.",
          variant: "destructive"
        });
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    return recognition;
  }, [language, onTranscript, toast]);

  // Démarrer l'écoute
  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      recognitionRef.current = initSpeechRecognition();
    }
    
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Erreur démarrage reconnaissance:', error);
      }
    }
  }, [initSpeechRecognition, isListening]);

  // Arrêter l'écoute
  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  // Analyse du sentiment améliorée
  const analyzeTextEmotion = useCallback((text: string) => {
    const lowerText = text.toLowerCase();
    
    const emotions = {
      joie: ['merci', 'parfait', 'excellent', 'super', 'génial', 'formidable', 'bravo', 'félicitations', 'content', 'ravi'],
      surprise: ['vraiment', 'incroyable', 'wow', 'impressionnant', 'étonnant'],
      inquiétude: ['problème', 'soucis', 'difficile', 'compliqué', 'inquiet', 'préoccupé', 'grave'],
      urgence: ['urgent', 'rapidement', 'vite', 'immédiatement', 'important', 'pressé'],
      politesse: ['bonjour', 'bonsoir', 's\'il vous plaît', 'merci', 'excusez-moi', 'pardon', 'veuillez'],
      question: text.includes('?'),
      exclamation: text.includes('!'),
      enumeration: text.includes(',') || text.includes('•') || text.includes('-'),
      long: text.length > 100
    };

    let emotionScore = {
      joy: 0,
      concern: 0,
      urgency: 0,
      formality: 0
    };

    for (const [emotion, keywords] of Object.entries(emotions)) {
      if (emotion === 'question' || emotion === 'exclamation' || emotion === 'enumeration' || emotion === 'long') continue;
      
      if (Array.isArray(keywords)) {
        const matches = keywords.filter(keyword => lowerText.includes(keyword)).length;
        switch (emotion) {
          case 'joie': emotionScore.joy += matches * 2; break;
          case 'inquiétude': emotionScore.concern += matches * 2; break;
          case 'urgence': emotionScore.urgency += matches * 3; break;
          case 'politesse': emotionScore.formality += matches; break;
        }
      }
    }

    return {
      ...emotionScore,
      isQuestion: emotions.question,
      isExclamation: emotions.exclamation,
      isEnumeration: emotions.enumeration,
      isLong: emotions.long
    };
  }, []);

  // Synthèse vocale améliorée avec meilleure qualité
  const speak = useCallback((text: string) => {
    const cleanedText = cleanTextForSpeech(text);
    
    if (!cleanedText) return;
    
    if (!('speechSynthesis' in window)) {
      console.error('Synthèse vocale non supportée');
      toast({
        title: "Fonction non supportée",
        description: "Votre navigateur ne supporte pas la synthèse vocale.",
        variant: "destructive"
      });
      return;
    }

    window.speechSynthesis.cancel();
    setIsSpeaking(true);
    
    const emotion = analyzeTextEmotion(cleanedText);
    
    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.lang = language;
    
    if (emotion.joy > 0) {
      utterance.rate = 0.9;
      utterance.pitch = expertGender === 'female' ? 1.15 : 0.85;
      utterance.volume = 0.95;
    } else if (emotion.concern > 0) {
      utterance.rate = 0.7;
      utterance.pitch = expertGender === 'female' ? 0.95 : 0.7;
      utterance.volume = 0.9;
    } else if (emotion.urgency > 0) {
      utterance.rate = 0.85;
      utterance.pitch = expertGender === 'female' ? 1.05 : 0.8;
      utterance.volume = 0.95;
    } else if (emotion.isQuestion) {
      utterance.rate = 0.8;
      utterance.pitch = expertGender === 'female' ? 1.1 : 0.8;
      utterance.volume = 0.9;
    } else if (emotion.formality > 2) {
      utterance.rate = 0.75;
      utterance.pitch = expertGender === 'female' ? 1.0 : 0.75;
      utterance.volume = 0.9;
    } else {
      utterance.rate = 0.8;
      utterance.pitch = expertGender === 'female' ? 1.05 : 0.8;
      utterance.volume = 0.92;
    }

    const selectBestVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      
      if (voices.length === 0) {
        setTimeout(selectBestVoice, 100);
        return;
      }
      
      let selectedVoice = null;
      
      const voicePriorities = {
        female: [
          'Microsoft Hortense - French (France)',
          'Google français',
          'Alice',
          'Amélie',
          'Marie',
          'Virginie',
          'Audrey'
        ],
        male: [
          'Microsoft Paul - French (France)',
          'Google français',
          'Thomas',
          'Pierre',
          'Henri',
          'Daniel'
        ]
      };

      const priorities = voicePriorities[expertGender];
      
      for (const priority of priorities) {
        selectedVoice = voices.find(v => 
          v.lang.startsWith('fr') && 
          v.name.includes(priority)
        );
        if (selectedVoice) break;
      }
      
      if (!selectedVoice) {
        selectedVoice = voices.find(v => 
          v.lang.startsWith('fr') && 
          v.name.toLowerCase().includes(expertGender === 'female' ? 'female' : 'male')
        );
      }
      
      if (!selectedVoice) {
        selectedVoice = voices.find(v => v.lang.startsWith('fr'));
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log(`🎭 Voix sélectionnée: ${selectedVoice.name} pour ${expertName}`);
      }
      
      utterance.onstart = () => {
        setIsSpeaking(true);
        console.log(`🎙️ Synthèse vocale démarrée: "${cleanedText.substring(0, 50)}..."`);
      };
      
      utterance.onend = () => {
        setIsSpeaking(false);
        console.log('✅ Synthèse vocale terminée');
      };
      
      utterance.onerror = (event) => {
        setIsSpeaking(false);
        console.error('❌ Erreur synthèse vocale:', event);
      };
      
      if (emotion.isLong || cleanedText.length > 150) {
        const sentences = cleanedText.split(/[.!?]+/).filter(s => s.trim().length > 0);
        
        if (sentences.length > 1) {
          let currentSentence = 0;
          
          const speakSentence = () => {
            if (currentSentence < sentences.length) {
              const sentenceUtterance = new SpeechSynthesisUtterance(sentences[currentSentence].trim());
              
              sentenceUtterance.lang = utterance.lang;
              sentenceUtterance.rate = utterance.rate;
              sentenceUtterance.pitch = utterance.pitch;
              sentenceUtterance.volume = utterance.volume;
              if (selectedVoice) {
                sentenceUtterance.voice = selectedVoice;
              }
              
              sentenceUtterance.onend = () => {
                currentSentence++;
                if (currentSentence < sentences.length) {
                  setTimeout(speakSentence, 400);
                } else {
                  setIsSpeaking(false);
                  console.log('✅ Synthèse complète terminée');
                }
              };
              
              sentenceUtterance.onerror = () => {
                setIsSpeaking(false);
                console.error('❌ Erreur synthèse phrase');
              };
              
              window.speechSynthesis.speak(sentenceUtterance);
            }
          };
          
          speakSentence();
          return;
        }
      }
      
      window.speechSynthesis.speak(utterance);
    };
    
    selectBestVoice();
  }, [language, expertGender, expertName, toast, analyzeTextEmotion, cleanTextForSpeech]);

  // Arrêter la synthèse vocale
  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  return {
    isListening,
    isSpeaking,
    isSupported,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    isAvailable: true
  };
};

// Déclarations TypeScript pour l'API Web Speech
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
