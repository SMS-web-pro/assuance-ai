
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const WSS_URL = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}`;

// ============================================================
// CONFIGURATION DES VOIX PAR AGENT ASSURE IA
// Chaque agent a une voix unique avec une locale différente
// ============================================================

export interface AgentVoiceConfig {
  voiceId: string;
  agentName: string;
  gender: 'male' | 'female';
  locale: string;
  rate: number;    // -50 à +50
  pitch: number;   // -50 à +50
  volume: number;  // -50 à +50
}

// Mapping complet des voix par agent
const AGENT_VOICES: Record<string, AgentVoiceConfig> = {
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

// Voices de fallback par genre
const FALLBACK_VOICES: Record<string, string> = {
  'male': 'fr-FR-HenriNeural',
  'female': 'fr-FR-DeniseNeural'
};

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function textToSSML(text: string, voice: string, rate: number, pitch: number, volume: number): string {
  const rateStr = rate >= 0 ? `+${rate}%` : `${rate}%`;
  const pitchStr = pitch >= 0 ? `+${pitch}Hz` : `${pitch}Hz`;
  const volumeStr = volume >= 0 ? `+${volume}%` : `${volume}%`;
  
  return `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='fr-FR'>
    <voice name='${voice}'>
      <prosody rate='${rateStr}' pitch='${pitchStr}' volume='${volumeStr}'>
        ${escapeXml(text)}
      </prosody>
    </voice>
  </speak>`;
}

// ============================================================
// NETTOYAGE DU TEXTE POUR FRANÇAIS PARFAIT
// ============================================================

// Abréviations courantes à développer pour une meilleure prononciation
const ABBREVIATIONS: Record<string, string> = {
  'M.': 'Monsieur',
  'Mme': 'Madame',
  'Dr': 'Docteur',
  'Me': 'Maître',
  'SA': 'société anonyme',
  'SARL': 'société à responsabilité limitée',
  'SAS': 'société par actions simplifiée',
  'etc': 'et cetera',
  'av.': 'avenue',
  'bd': 'boulevard',
  'pl': 'place',
  'r': 'rue',
};

// Caractères spéciaux à remplacer pour une prononciation correcte
const SPECIAL_CHARS: [RegExp, string][] = [
  [/'/g, ''],
  [/"/g, ''],
  [/"/g, ''],
  [/'/g, ''],
  [/–/g, ''],
  [/—/g, ''],
  [/\u200B/g, ''],  // Zero-width space
  [/\u00A0/g, ' '], // Non-breaking space
];

// Ponctuation à simplifier pour une meilleure fluidité
const PUNCTUATION: [RegExp, string][] = [
  [/\.{3,}/g, '...'],
  [/\s+/g, ' '],
];

function cleanTextForFrench(text: string): string {
  let cleaned = text.trim();
  
  // 1. Supprimer les caractères spéciaux
  for (const [pattern, replacement] of SPECIAL_CHARS) {
    cleaned = cleaned.replace(pattern, replacement);
  }
  
  // 2. Développer les abréviations (uniquement si elles sont suivies d'un point ou espace)
  for (const [abbrev, full] of Object.entries(ABBREVIATIONS)) {
    const regex = new RegExp(`\\b${abbrev.replace('.', '\\.')}\\b\\.?`, 'g');
    cleaned = cleaned.replace(regex, full);
  }
  
  // 3. Simplifier la ponctuation excessive
  for (const [pattern, replacement] of PUNCTUATION) {
    cleaned = cleaned.replace(pattern, replacement);
  }
  
  // 4. Gérer les chiffres (années, montants)
  cleaned = cleaned.replace(/\b(20\d{2})\b/g, (_, year) => {
    const y = parseInt(year);
    if (y >= 2000 && y <= 2099) {
      return `deux mille ${y - 2000 === 0 ? '' : y - 2000}`.trim();
    }
    return year;
  });
  
  // 5. Pourcentages
  cleaned = cleaned.replace(/(\d+)%/g, (_, num) => `${num} pour cent`);
  
  // 6. Montants en euros
  cleaned = cleaned.replace(/(\d+[\s.]?\d*)\s*€/g, (_, amount) => `${amount.replace(/[.\s]/g, '')} euros`);
  
  // 7. Sauts de ligne
  cleaned = cleaned.replace(/\n+/g, '. ');
  
  return cleaned.trim();
}

async function generateSpeech(text: string, voice: string, rate: number, pitch: number, volume: number): Promise<ArrayBuffer> {
  const ws = new WebSocket(WSS_URL, {
    headers: {
      'Origin': 'chrome-extension://jdiccldimpdaibmpdmdce',
    }
  });
  
  return new Promise((resolve, reject) => {
    const audioChunks: Uint8Array[] = [];
    let requestId = '';
    let resolved = false;
    
    ws.onopen = () => {
      console.log('Connected to Edge TTS');
      
      // Send speech config
      const configMsg = `Content-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}`;
      ws.send(configMsg);
      
      requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const ssml = textToSSML(text, voice, rate, pitch, volume);
      const ssmlMsg = `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n${ssml}`;
      ws.send(ssmlMsg);
    };
    
    ws.onmessage = (event) => {
      if (resolved) return;
      
      if (typeof event.data === 'string') {
        if (event.data.includes('Path:turn.end')) {
          console.log('TTS generation complete');
          resolved = true;
          ws.close();
          
          const totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.length, 0);
          const result = new Uint8Array(totalLength);
          let offset = 0;
          for (const chunk of audioChunks) {
            result.set(chunk, offset);
            offset += chunk.length;
          }
          resolve(result.buffer);
        }
      } else if (event.data instanceof ArrayBuffer) {
        const data = new Uint8Array(event.data);
        // Find audio data after headers
        let headerEnd = 0;
        for (let i = 0; i < data.length - 1; i++) {
          if (data[i] === 0x0D && data[i + 1] === 0x0A) {
            headerEnd = i + 2;
            break;
          }
        }
        if (headerEnd > 0 && headerEnd < data.length) {
          audioChunks.push(data.slice(headerEnd));
        }
      } else if (event.data instanceof Blob) {
        event.data.arrayBuffer().then(buffer => {
          const data = new Uint8Array(buffer);
          let headerEnd = 0;
          for (let i = 0; i < data.length - 1; i++) {
            if (data[i] === 0x0D && data[i + 1] === 0x0A) {
              headerEnd = i + 2;
              break;
            }
          }
          if (headerEnd > 0 && headerEnd < data.length) {
            audioChunks.push(data.slice(headerEnd));
          }
        });
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (!resolved) {
        resolved = true;
        reject(new Error('Edge TTS WebSocket error'));
      }
    };
    
    ws.onclose = () => {
      if (!resolved) {
        resolved = true;
        if (audioChunks.length > 0) {
          const totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.length, 0);
          const result = new Uint8Array(totalLength);
          let offset = 0;
          for (const chunk of audioChunks) {
            result.set(chunk, offset);
            offset += chunk.length;
          }
          resolve(result.buffer);
        } else {
          reject(new Error('No audio received'));
        }
      }
    };
    
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        ws.close();
        reject(new Error('Edge TTS timeout'));
      }
    }, 30000);
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      text, 
      agentName,        // Nom de l'agent (ex: "Marc Dubois")
      voice,            // Voice ID direct (ex: "fr-FR-HenriNeural") - fallback
      gender = 'female',
      speed = 0,
      pitch = 0,
      volume = 0
    } = await req.json();

    if (!text) {
      throw new Error('Text is required');
    }

    // Nettoyer le texte pour une prononciation française parfaite
    const cleanedText = cleanTextForFrench(text);
    const truncatedText = cleanedText.substring(0, 4096);
    
    // Déterminer la voix à utiliser selon l'agent
    let voiceConfig: AgentVoiceConfig | null = null;
    let voiceName: string;
    let finalRate = speed;
    let finalPitch = pitch;
    let finalVolume = volume;
    
    // 1. Priorité: agentName → voix configurée
    if (agentName && AGENT_VOICES[agentName]) {
      voiceConfig = AGENT_VOICES[agentName];
      voiceName = voiceConfig.voiceId;
      finalRate = voiceConfig.rate;
      finalPitch = voiceConfig.pitch;
      finalVolume = voiceConfig.volume;
      console.log(`Agent "${agentName}" → Voice: ${voiceName}`);
    } 
    // 2. Fallback: voice ID direct
    else if (voice) {
      voiceName = voice;
      console.log(`Direct voice: ${voiceName}`);
    }
    // 3. Dernier fallback: gender
    else {
      voiceName = FALLBACK_VOICES[gender] || FALLBACK_VOICES.female;
      console.log(`Fallback gender "${gender}" → Voice: ${voiceName}`);
    }

    console.log(`Generating speech: voice=${voiceName}, rate=${finalRate}, pitch=${finalPitch}, volume=${finalVolume}`);

    const audioBuffer = await generateSpeech(truncatedText, voiceName, finalRate, finalPitch, finalVolume);

    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
      },
    });

  } catch (error) {
    console.error('Edge TTS error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
