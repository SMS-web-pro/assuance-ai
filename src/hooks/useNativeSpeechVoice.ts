
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

    console.log(`🔍 Sélection voix ${gender} pour ${agentName} - ${voices.length} voix disponibles:`, voices.map(v => v.name));
    
    let bestVoice: SpeechSynthesisVoice | null = null;
    let bestScore = -1;

    // MAPPING COMPLET DES VOIX PAR PLATEFORME
    const voicePriority: Record<string, string[]> = {
      male: [
        // Windows
        'Microsoft Paul', 'Microsoft Thomas', 'Microsoft Henri',
        // Noms partiels Windows
        'paul', 'thomas', 'henri',
        // Android/Chrome - voix masculines françaises
        'fr-FR-Standard-D', 'fr-FR-Standard-E',
        'fr-FR-Neural-D', 'fr-FR-Neural-E',
        // iOS/macOS
        'Thomas', 'Paul', 'Rémy',
        // Google
        'Google FR D', 'Google FR E',
        'google fr d', 'google fr e',
        // Patterns génériques masculins
        'male', 'homme', 'masculin'
      ],
      female: [
        // Windows
        'Microsoft Hortense', 'Microsoft Julie', 'Microsoft Marie',
        // Noms partiels Windows
        'hortense', 'julie', 'marie',
        // Android/Chrome - voix féminines françaises
        'fr-FR-Standard-A', 'fr-FR-Standard-B', 'fr-FR-Standard-C',
        'fr-FR-Neural-A', 'fr-FR-Neural-B', 'fr-FR-Neural-C',
        // iOS/macOS
        'Amélie', 'Marie', 'Thomas (par défaut)', // Thomas est neutre sur iOS
        // Google
        'Google FR A', 'Google FR B', 'Google FR C',
        'google fr a', 'google fr b', 'google fr c',
        // Patterns génériques féminins
        'female', 'femme', 'féminin', 'feminin'
      ]
    };

    const preferredVoices = voicePriority[gender] || voicePriority.female;

    // ÉTAPE 1: Chercher les voix françaises d'abord
    const frenchVoices = voices.filter(v => {
      const lang = v.lang.toLowerCase();
      return lang.startsWith('fr') || lang.includes('french');
    });

    const voicesToSearch = frenchVoices.length > 0 ? frenchVoices : voices;

    // ÉTAPE 2: Scorer chaque voix
    for (const voice of voicesToSearch) {
      let score = 0;
      const voiceName = voice.name.toLowerCase();
      const voiceLang = voice.lang.toLowerCase();

      // Score basé sur la priorité (index dans la liste)
      for (let i = 0; i < preferredVoices.length; i++) {
        if (voiceName.includes(preferredVoices[i].toLowerCase())) {
          score += (500 - i * 10); // Plus haut = meilleure priorité
          break;
        }
      }

      // Bonus langue française exacte
      if (voiceLang === 'fr-fr') score += 100;
      else if (voiceLang.startsWith('fr-')) score += 80;
      else if (voiceLang.includes('fr')) score += 60;

      // Bonus voix locale (plus réactive sur mobile)
      if (voice.localService) score += 50;

      // Bonus qualité
      if (voiceName.includes('neural')) score += 70;
      if (voiceName.includes('enhanced')) score += 60;
      if (voiceName.includes('premium')) score += 50;
      if (voiceName.includes('natural')) score += 40;

      // Bonus voix par défaut
      if (voice.default) score += 30;

      // Malus pour voix qui ne correspondent pas au genre
      const isClearlyMale = voiceName.includes('paul') || voiceName.includes('thomas') || 
                             voiceName.includes('henri') || voiceName.includes('david') ||
                             voiceName.includes('-d') || voiceName.includes('-e');
      const isClearlyFemale = voiceName.includes('marie') || voiceName.includes('julie') || 
                              voiceName.includes('hortense') || voiceName.includes('amelie') ||
                              voiceName.includes('-a') || voiceName.includes('-b') || voiceName.includes('-c');

      if (gender === 'male' && isClearlyFemale) score -= 200;
      if (gender === 'female' && isClearlyMale) score -= 200;

      if (score > bestScore) {
        bestScore = score;
        bestVoice = voice;
      }
    }

    // ÉTAPE 3: Si aucune voix trouvée, fallback robuste
    if (!bestVoice || bestScore < 50) {
      console.warn('⚠️ Pas de voix idéale, fallback...');
      
      // D'abord essayer de trouver une voix du bon genre
      if (gender === 'male') {
        bestVoice = frenchVoices.find(v => 
          v.name.toLowerCase().includes('paul') ||
          v.name.toLowerCase().includes('thomas') ||
          v.name.toLowerCase().includes('-d')
        ) || voices.find(v => v.name.toLowerCase().includes('male')) || null;
      } else {
        bestVoice = frenchVoices.find(v => 
          v.name.toLowerCase().includes('julie') ||
          v.name.toLowerCase().includes('hortense') ||
          v.name.toLowerCase().includes('marie') ||
          v.name.toLowerCase().includes('-a')
        ) || voices.find(v => v.name.toLowerCase().includes('female')) || null;
      }
      
      // Dernier recours: première voix française
      if (!bestVoice) {
        bestVoice = frenchVoices[0] || voices[0];
      }
    }
    
    setSelectedVoice(bestVoice);
    
    if (bestVoice) {
      console.log(`🎯 VOIX SÉLECTIONNÉE pour ${agentName} (${gender}):`, {
        nom: bestVoice.name,
        langue: bestVoice.lang,
        score: bestScore,
        locale: bestVoice.localService ? 'Locale' : 'Distante'
      });
    }
  }, [isActive]);

  // Nettoyage du texte pour synthèse vocale - MOINS AGRESSIF pour garder le naturel
  const cleanTextForSpeech = useCallback((text: string): string => {
    let cleanedText = text;
    
    // ÉTAPE 1: Supprimer uniquement le markdown visible (pas les connecteurs)
    cleanedText = cleanedText
      // Markdown basique
      .replace(/\*\*([^*]+)\*\*/g, '$1')  // gras → garder le texte
      .replace(/\*([^*]+)\*/g, '$1')      // italique → garder le texte
      .replace(/#{1,6}\s/g, '')           // titres
      .replace(/`{1,3}[^`]*`{1,3}/g, '') // code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // liens → garder le texte
    
    // ÉTAPE 2: Supprimer les emojis et symboles (pas les mots)
    cleanedText = cleanedText
      // Emojis courants
      .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
      .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
      .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
      .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '')
      .replace(/[\u{2600}-\u{26FF}]/gu, '')
      .replace(/[\u{2700}-\u{27BF}]/gu, '')
      .replace(/[\u{1F900}-\u{1F9FF}]/gu, '')
      .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '')
      // Symboles spécifiques
      .replace(/[📞📧📱💡🎯🔒🛡️🏠📐🏗️📅]/g, '')
      .replace(/[✓✔✅☑️]/g, '')
      .replace(/[❌✗✘]/g, '')
      .replace(/[►▸▹‣⁃]/g, '')
      // Séparateurs visuels (garder un espace)
      .replace(/[-]{3,}/g, ' ')
      .replace(/[═]{3,}/g, ' ')
      .replace(/[─]{3,}/g, ' ')
      // Pipes de tableau
      .replace(/\|/g, ' ')
      // Crochets vides
      .replace(/[\[\]{}]/g, '')

    // ÉTAPE 3: Corrections françaises pour la voix
    const corrections: Record<string, string> = {
      'M.': 'Monsieur', 'Mme': 'Madame', 'Mlle': 'Mademoiselle',
      'Dr': 'Docteur', 'Pr': 'Professeur',
      '€': 'euros', '%': 'pour cent', '&': 'et',
      'RDV': 'rendez-vous', 'OK': 'd\'accord', 'ok': 'd\'accord',
      'etc': 'et cetera', 'Ex': 'exemple'
    };

    Object.entries(corrections).forEach(([abbrev, full]) => {
      const regex = new RegExp(`\\b${abbrev.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
      cleanedText = cleanedText.replace(regex, full);
    });

    // ÉTAPE 4: Gestion intelligente du slash
    // Entre chiffres → "sur" (ex: 80/100 → 80 sur 100)
    cleanedText = cleanedText.replace(/(\d)\s*\/\s*(\d)/g, '$1 sur $2');
    // Entre mots → espace (ex: auto/moto → auto moto)
    cleanedText = cleanedText.replace(/([a-zA-ZÀ-ÿ])\s*\/\s*([a-zA-ZÀ-ÿ])/g, '$1 $2');

    // ÉTAPE 5: Nettoyage final - garder la ponctuation naturelle
    cleanedText = cleanedText
      .replace(/\s+/g, ' ')  // espaces multiples → un seul
      .replace(/^\s+|\s+$/g, '') // trim
      // Pas de suppression de ponctuation ! Garder . , ! ? etc.

    return cleanedText;
  }, []);

  // Découpage du texte en chunks pour pauses naturelles - AMÉLIORÉ
  const splitIntoNaturalChunks = useCallback((text: string): Array<{ text: string; pauseAfter: number }> => {
    const chunks: Array<{ text: string; pauseAfter: number }> = [];
    
    // D'abord séparer par paragraphes (double saut de ligne)
    const paragraphs = text.split(/\n{2,}/).filter(p => p.trim().length > 0);
    
    for (const paragraph of paragraphs) {
      // Si le paragraphe est très court, le gard tel quel
      if (paragraph.trim().length < 40) {
        chunks.push({ text: paragraph.trim(), pauseAfter: 200 });
        continue;
      }
      
      // Séparer par phrases (point, point d'interrogation, point d'exclamation)
      const sentences = paragraph
        .split(/(?<=[.!?])\s+/)
        .filter(s => s.trim().length > 2);
      
      for (const sentence of sentences) {
        const trimmed = sentence.trim();
        
        // Phrase courte → garder en un chunk
        if (trimmed.length <= 60) {
          let pauseAfter = 180; // Défaut
          if (trimmed.endsWith('.')) pauseAfter = 250;
          else if (trimmed.endsWith('?')) pauseAfter = 300; // Plus long après question
          else if (trimmed.endsWith('!')) pauseAfter = 250;
          else if (trimmed.endsWith(':')) pauseAfter = 200;
          else if (trimmed.endsWith(';')) pauseAfter = 150;
          
          chunks.push({ text: trimmed, pauseAfter });
        } else {
          // Phrase longue → découper aux virgules
          const parts = trimmed.split(/,\s*/);
          
          for (let i = 0; i < parts.length; i++) {
            const part = parts[i].trim();
            if (part.length < 3) continue;
            
            const isLast = i === parts.length - 1;
            let pauseAfter = 100; // Virgule par défaut
            
            if (isLast) {
              // Dernière partie = fin de phrase
              if (trimmed.endsWith('.')) pauseAfter = 250;
              else if (trimmed.endsWith('?')) pauseAfter = 300;
              else if (trimmed.endsWith('!')) pauseAfter = 250;
              else pauseAfter = 200;
            } else {
              // Milieu de phrase - pause plus courte
              pauseAfter = 100;
              
              // Si la partie est longue, ajouter une micro-pause
              if (part.length > 40) pauseAfter = 150;
            }
            
            chunks.push({ text: part, pauseAfter });
          }
        }
      }
      
      // Pause entre paragraphes
      chunks.push({ text: '', pauseAfter: 300 });
    }
    
    // Supprimer les chunks vides en fin de liste
    while (chunks.length > 0 && chunks[chunks.length - 1].text === '') {
      chunks.pop();
    }
    
    return chunks;
  }, []);

  // Configuration vocale par agent - CHAQUE AGENT A UNE VOIX UNIQUE
  // Mobile: volume PLUS FORT et pitch très distinct selon le genre
  const getAgentVoiceConfig = useCallback((agentName: string, gender: 'male' | 'female') => {
    const configs: Record<string, { rate: number; pitch: number; volume: number }> = {
      // === HOMMES - Voix GRAVES (pitch bas 0.7-0.95) ===
      'Marc Dubois': { 
        rate: isMobile ? 0.85 : 0.90, 
        pitch: isMobile ? 0.75 : 0.80, 
        volume: isMobile ? 1.0 : 0.95
      },
      'Alex Moreau': { 
        rate: isMobile ? 1.15 : 1.10, 
        pitch: isMobile ? 0.88 : 0.92, 
        volume: isMobile ? 1.0 : 0.95
      },
      'Pierre Delacroix': { 
        rate: isMobile ? 0.75 : 0.80, 
        pitch: isMobile ? 0.70 : 0.75, 
        volume: isMobile ? 1.0 : 0.95
      },
      
      // === FEMMES - Voix AIGÜES (pitch haut 1.1-1.4) ===
      'Sophie Martin': { 
        rate: isMobile ? 0.88 : 0.92, 
        pitch: isMobile ? 1.28 : 1.18, 
        volume: isMobile ? 1.0 : 0.95
      },
      'Dr. Claire Rousseau': { 
        rate: isMobile ? 0.82 : 0.88, 
        pitch: isMobile ? 1.15 : 1.08, 
        volume: isMobile ? 1.0 : 0.95
      },
      'Camille Durand': { 
        rate: isMobile ? 1.12 : 1.08, 
        pitch: isMobile ? 1.38 : 1.28, 
        volume: isMobile ? 1.0 : 0.95
      }
    };

    // Fallback selon le genre - TRÈS distinct
    if (configs[agentName]) {
      return configs[agentName];
    }
    
    // Fallback par défaut selon le genre
    return gender === 'male'
      ? { rate: 0.88, pitch: 0.78, volume: 1.0 }
      : { rate: 0.90, pitch: 1.25, volume: 1.0 };
  }, [isMobile]);

  // Analyse émotionnelle élargie pour modulation vocale naturelle
  const analyzeEmotion = useCallback((text: string) => {
    const lower = text.toLowerCase();
    
    let rateMod = 1.0;
    let pitchMod = 1.0;
    let volumeMod = 1.0;

    // === ÉMOTIONS POSITIVES ===
    // Joie / enthousiasme - légère accélération, ton plus haut
    if (/(?:merci|parfait|excellent|super|génial|formidable|bravo|content|ravi|fantastique|magnifique)/.test(lower)) {
      rateMod *= 1.06;
      pitchMod *= 1.04;
      volumeMod *= 1.02;
    }

    // Confirmation / validation - ton rassurant
    if (/(?:exactement|tout à fait|absolument|c'est ça|vous avez raison|parfait|très bien)/.test(lower)) {
      rateMod *= 0.96;
      pitchMod *= 1.02;
      volumeMod *= 1.01;
    }

    // === ÉMOTIONS NEUTRES ===
    // Présentation / information - rythme normal, clair
    if (/(?:je suis|nous sommes|notre|votre|permettez|permettez-moi|je vais|nous allons)/.test(lower)) {
      rateMod *= 0.98;
      pitchMod *= 1.00;
      volumeMod *= 1.00;
    }

    // Question - légère accélération, ton montant
    if (/\?/.test(text)) {
      rateMod *= 1.02;
      pitchMod *= 1.03;
      volumeMod *= 1.00;
    }

    // === ÉMOTIONS NÉGATIVES ===
    // Inquiétude / problème - ralentissement, ton plus grave
    if (/(?:problème|souci|difficile|compliqué|inquiet|grave|attention|risque|malheureusement|dommage)/.test(lower)) {
      rateMod *= 0.93;
      pitchMod *= 0.96;
      volumeMod *= 0.98;
    }

    // Excuse / regret - ton doux, ralenti
    if (/(?:désolé|excusez|pardon|regrette|navré)/.test(lower)) {
      rateMod *= 0.92;
      pitchMod *= 0.97;
      volumeMod *= 0.97;
    }

    // === URGENCE ===
    if (/(?:urgent|rapidement|vite|immédiatement|crucial|dès que possible|maintenant)/.test(lower)) {
      rateMod *= 1.10;
      pitchMod *= 1.02;
      volumeMod *= 1.03;
    }

    // === EXPERTISE / SÉRIEUX ===
    if (/(?:technique|spécialisé|professionnel|expert|précisément|conformément|réglementation|article|loi)/.test(lower)) {
      rateMod *= 0.94;
      pitchMod *= 0.97;
      volumeMod *= 1.00;
    }

    // === EMPATHIE / ACCOMPAGNEMENT ===
    if (/(?:comprends|accompagne|soutien|aide|écoute|accompagner|je suis là|pour vous|rassurez)/.test(lower)) {
      rateMod *= 0.94;
      pitchMod *= 1.02;
      volumeMod *= 0.98;
    }

    // === CONSEIL / RECOMMANDATION ===
    if (/(?:je vous conseille|je recommande|il vaut mieux|je suggère|pensez à|n'hésitez pas)/.test(lower)) {
      rateMod *= 0.95;
      pitchMod *= 1.01;
      volumeMod *= 1.01;
    }

    // === VALEUR / ÉCONOMIE ===
    if (/(?:économiser|réduction|avantage|meilleur prix|compétitif|offre|promotional)/.test(lower)) {
      rateMod *= 1.04;
      pitchMod *= 1.03;
      volumeMod *= 1.02;
    }

    // === FIN DE CONVERSATION ===
    if (/(?:merci|au revoir|à bientôt|bonne journée|excellente|cordialement)/.test(lower)) {
      rateMod *= 0.96;
      pitchMod *= 0.98;
      volumeMod *= 0.99;
    }

    // === MODIFICATEURS DE PONCTUATION ===
    // Point d'exclamation - enthousiasme léger
    if (text.includes('!') && !text.includes('?')) {
      volumeMod *= 1.02;
      rateMod *= 0.98;
    }

    // Plusieurs points d'exclamation - plus d'emphase
    if (/!{2,}/.test(text)) {
      volumeMod *= 1.04;
      pitchMod *= 1.02;
    }

    // Points de suspension - hésitation, ralentissement
    if (/\.{3,}/.test(text)) {
      rateMod *= 0.92;
      pitchMod *= 0.98;
    }

    // === LIMITES SÉCURITAIRES ===
    rateMod = Math.max(0.75, Math.min(1.15, rateMod));
    pitchMod = Math.max(0.85, Math.min(1.20, pitchMod));
    volumeMod = Math.max(0.90, Math.min(1.10, volumeMod));

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

  // Synthèse vocale native - VERSION MOBILE OPTIMISÉE
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

    // Mobile: volume TOUJOURS à 1.0 (maximum)
    const finalConfig = {
      rate: Math.max(0.7, Math.min(1.25, baseConfig.rate * emotion.rateMod)),
      pitch: Math.max(0.6, Math.min(1.4, baseConfig.pitch * emotion.pitchMod)),
      volume: isMobile ? 1.0 : (baseConfig.volume || 0.95)
    };

    console.log(`🎙️ Lecture ${isMobile ? '📱 MOBILE' : '💻 DESKTOP'}:`, {
      voix: selectedVoice.name,
      genre: expertGender,
      agent: expertName,
      rate: finalConfig.rate.toFixed(2),
      pitch: finalConfig.pitch.toFixed(2),
      volume: finalConfig.volume
    });

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
