import { createClient } from '@supabase/supabase-js';

// Configuration des voix par agent Assure IA
export interface AgentVoiceConfig {
  voiceId: string;
  agentName: string;
  gender: 'male' | 'female';
  locale: string;
  rate: number;
  pitch: number;
  volume: number;
}

const AGENT_VOICE_MAP: Record<string, AgentVoiceConfig> = {
  // === HOMMES ===
  'Marc Dubois': {
    voiceId: 'fr-FR-HenriNeural',
    agentName: 'Marc Dubois',
    gender: 'male',
    locale: 'fr-FR',
    rate: -5,
    pitch: -10,
    volume: 0
  },
  'Alex Moreau': {
    voiceId: 'fr-CA-AntoineNeural',
    agentName: 'Alex Moreau',
    gender: 'male',
    locale: 'fr-CA',
    rate: 10,
    pitch: 5,
    volume: 5
  },
  'Pierre Delacroix': {
    voiceId: 'fr-BE-GerardNeural',
    agentName: 'Pierre Delacroix',
    gender: 'male',
    locale: 'fr-BE',
    rate: -15,
    pitch: -15,
    volume: 0
  },
  
  // === FEMMES ===
  'Sophie Martin': {
    voiceId: 'fr-FR-DeniseNeural',
    agentName: 'Sophie Martin',
    gender: 'female',
    locale: 'fr-FR',
    rate: -3,
    pitch: 5,
    volume: 0
  },
  'Dr. Claire Rousseau': {
    voiceId: 'fr-CA-SylvieNeural',
    agentName: 'Dr. Claire Rousseau',
    gender: 'female',
    locale: 'fr-CA',
    rate: -8,
    pitch: 0,
    volume: 0
  },
  'Camille Durand': {
    voiceId: 'fr-FR-EloiseNeural',
    agentName: 'Camille Durand',
    gender: 'female',
    locale: 'fr-FR',
    rate: 8,
    pitch: 10,
    volume: 5
  }
};

const FALLBACK_VOICE = 'fr-FR-DeniseNeural';

class EdgeTTSService {
  private supabase;
  private audioCache: Map<string, string> = new Map();
  private currentAudio: HTMLAudioElement | null = null;
  private isPlaying = false;

  constructor() {
    this.supabase = createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY
    );
  }

  // Obtenir la configuration de voix pour un agent
  getVoiceConfig(agentName: string): AgentVoiceConfig {
    return AGENT_VOICE_MAP[agentName] || {
      voiceId: FALLBACK_VOICE,
      agentName: agentName || 'Assistant',
      gender: 'female',
      locale: 'fr-FR',
      rate: 0,
      pitch: 0,
      volume: 0
    };
  }

  // Générer et jouer l'audio
  async speak(text: string, agentName: string, onEnd?: () => void): Promise<void> {
    try {
      // Arrêter l'audio en cours
      this.stop();
      
      // Vérifier le cache
      const cacheKey = `${agentName}:${text}`;
      let audioUrl = this.audioCache.get(cacheKey);
      
      if (!audioUrl) {
        // Appeler la fonction Edge TTS
        const { data, error } = await this.supabase.functions.invoke('edge-tts', {
          body: {
            text,
            agentName
          }
        });

        if (error) {
          console.error('Edge TTS error:', error);
          throw error;
        }

        // Convertir le blob en URL
        const blob = new Blob([data], { type: 'audio/mpeg' });
        audioUrl = URL.createObjectURL(blob);
        
        // Mettre en cache
        this.audioCache.set(cacheKey, audioUrl);
      }

      // Jouer l'audio
      this.currentAudio = new Audio(audioUrl);
      this.isPlaying = true;

      this.currentAudio.onended = () => {
        this.isPlaying = false;
        this.currentAudio = null;
        onEnd?.();
      };

      this.currentAudio.onerror = (e) => {
        console.error('Audio playback error:', e);
        this.isPlaying = false;
        this.currentAudio = null;
      };

      await this.currentAudio.play();
      
    } catch (error) {
      console.error('Edge TTS speak error:', error);
      this.isPlaying = false;
      throw error;
    }
  }

  // Arrêter la lecture
  stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.isPlaying = false;
  }

  // Vérifier si en cours de lecture
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  // Nettoyer le cache
  clearCache(): void {
    this.audioCache.forEach(url => URL.revokeObjectURL(url));
    this.audioCache.clear();
  }
}

export const edgeTTSService = new EdgeTTSService();
export default edgeTTSService;
