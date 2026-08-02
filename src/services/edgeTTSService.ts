import { supabase } from '@/integrations/supabase/client';

export interface EdgeTTSOptions {
  text: string;
  gender: 'male' | 'female';
  speed?: number;
  pitch?: number;
  volume?: number;
}

export interface AgentVoiceConfig {
  voice: string;
  speed: number;
  pitch: number;
  volume: number;
}

// Configuration des voix par agent - Edge TTS
export const AGENT_VOICE_CONFIGS: Record<string, AgentVoiceConfig> = {
  // AGENTS MASCULINS - Voix Henri avec paramètres distincts
  'Marc Dubois': {
    voice: 'henri',
    speed: -5,
    pitch: -10,
    volume: 0
  },
  'Alex Moreau': {
    voice: 'henri',
    speed: 10,
    pitch: 0,
    volume: 5
  },
  'Pierre Delacroix': {
    voice: 'henri',
    speed: -15,
    pitch: -15,
    volume: 0
  },
  
  // AGENTS FÉMININS - Voix Denise/Vivienne avec paramètres distincts
  'Sophie Martin': {
    voice: 'denise',
    speed: -3,
    pitch: 5,
    volume: 0
  },
  'Dr. Claire Rousseau': {
    voice: 'denise',
    speed: -8,
    pitch: 0,
    volume: 0
  },
  'Camille Durand': {
    voice: 'vivienne',
    speed: 8,
    pitch: 10,
    volume: 5
  }
};

// Liste des agents masculins
const MALE_AGENTS = ['Marc Dubois', 'Alex Moreau', 'Pierre Delacroix'];

/**
 * Générer de la parole via Edge TTS
 */
export async function generateEdgeTTS(options: EdgeTTSOptions): Promise<ArrayBuffer> {
  const { text, gender, speed = 0, pitch = 0, volume = 0 } = options;
  
  const { data, error } = await supabase.functions.invoke('edge-tts', {
    body: {
      text: text.substring(0, 4096),
      gender,
      speed,
      pitch,
      volume
    }
  });
  
  if (error) {
    console.error('Edge TTS error:', error);
    throw new Error(`Edge TTS failed: ${error.message}`);
  }
  
  return data;
}

/**
 * Générer de la parole pour un agent spécifique
 */
export async function generateAgentSpeech(
  text: string, 
  agentName: string
): Promise<ArrayBuffer> {
  const config = AGENT_VOICE_CONFIGS[agentName] || {
    voice: 'denise',
    speed: 0,
    pitch: 0,
    volume: 0
  };
  
  const gender = MALE_AGENTS.includes(agentName) ? 'male' : 'female';
  
  return generateEdgeTTS({
    text,
    gender,
    speed: config.speed,
    pitch: config.pitch,
    volume: config.volume
  });
}
