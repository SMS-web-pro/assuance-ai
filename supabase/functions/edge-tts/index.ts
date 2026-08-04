
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================
// EDGE TTS CONSTANTS (from rany2/edge-tts v7.2.8)
// ============================================================

const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const BASE_URL = 'speech.platform.bing.com/consumer/speech/synthesize/readaloud';
const WSS_BASE = `wss://${BASE_URL}/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}`;
const CHROMIUM_FULL_VERSION = '143.0.3650.75';
const SEC_MS_GEC_VERSION = `1-${CHROMIUM_FULL_VERSION}`;
const WIN_EPOCH = 11644473600;
const S_TO_NS = 1e9;

// ============================================================
// PURE SHA256 IMPLEMENTATION (no dependencies)
// ============================================================

const K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
];

function sha256(message: string): string {
  const msgBytes = new TextEncoder().encode(message);
  const msgLen = msgBytes.length;
  
  // Pre-processing
  const bitLen = msgLen * 8;
  const padLen = (56 - ((msgLen + 1) % 64) + 64) % 64;
  const padded = new Uint8Array(msgLen + 1 + padLen + 8);
  padded.set(msgBytes);
  padded[msgLen] = 0x80;
  
  // Length in bits as big-endian 64-bit
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, Math.floor(bitLen / 0x100000000), false);
  view.setUint32(padded.length - 4, bitLen >>> 0, false);
  
  // Initialize hash values
  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
  
  // Process each 512-bit chunk
  for (let offset = 0; offset < padded.length; offset += 64) {
    const w = new Array(64);
    
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    
    for (let i = 16; i < 64; i++) {
      const s0 = ((w[i-15] >>> 7) | (w[i-15] << 25)) ^ ((w[i-15] >>> 18) | (w[i-15] << 14)) ^ (w[i-15] >>> 3);
      const s1 = ((w[i-2] >>> 17) | (w[i-2] << 15)) ^ ((w[i-2] >>> 19) | (w[i-2] << 13)) ^ (w[i-2] >>> 10);
      w[i] = (w[i-16] + s0 + w[i-7] + s1) | 0;
    }
    
    let [a, b, c, d, e, f, g, h] = [h0, h1, h2, h3, h4, h5, h6, h7];
    
    for (let i = 0; i < 64; i++) {
      const S1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + w[i]) | 0;
      const S0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;
      
      h = g; g = f; f = e; e = (d + temp1) | 0;
      d = c; c = b; b = a; a = (temp1 + temp2) | 0;
    }
    
    h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
  }
  
  const hex = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
  return `${hex(h0)}${hex(h1)}${hex(h2)}${hex(h3)}${hex(h4)}${hex(h5)}${hex(h6)}${hex(h7)}`.toUpperCase();
}

// ============================================================
// DRM: Generate Sec-MS-GEC token (SHA256 hash)
// ============================================================

function generateSecMsGec(): string {
  let ticks = Date.now() / 1000;
  ticks += WIN_EPOCH;
  ticks -= ticks % 300;
  const ticksNs = ticks * (S_TO_NS / 100);
  const strToHash = `${Math.floor(ticksNs)}${TRUSTED_CLIENT_TOKEN}`;
  return sha256(strToHash);
}

// ============================================================
// CONFIGURATION DES VOIX PAR AGENT ASSURE IA
// ============================================================

export interface AgentVoiceConfig {
  voiceId: string;
  agentName: string;
  gender: 'male' | 'female';
  locale: string;
  rate: number;
  pitch: number;
  volume: number;
}

const AGENT_VOICES: Record<string, AgentVoiceConfig> = {
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

const FALLBACK_VOICES: Record<string, string> = {
  'male': 'fr-FR-HenriNeural',
  'female': 'fr-FR-DeniseNeural'
};

// ============================================================
// TEXT CLEANING FOR FRENCH PRONUNCIATION
// ============================================================

const ABBREVIATIONS: Record<string, string> = {
  'M.': 'Monsieur',
  'Mme': 'Madame',
  'Dr': 'Docteur',
  'Me': 'Maître',
  'SA': 'société anonyme',
  'SARL': 'société à responsabilité limitée',
  'SAS': 'société par actions simplifiée',
  'etc': 'et cetera',
};

const SPECIAL_CHARS: [RegExp, string][] = [
  [/'/g, ''],
  [/"/g, ''],
  [/"/g, ''],
  [/'/g, ''],
  [/–/g, ''],
  [/—/g, ''],
  [/\u200B/g, ''],
  [/\u00A0/g, ' '],
];

function cleanTextForFrench(text: string): string {
  let cleaned = text.trim();
  for (const [pattern, replacement] of SPECIAL_CHARS) {
    cleaned = cleaned.replace(pattern, replacement);
  }
  for (const [abbrev, full] of Object.entries(ABBREVIATIONS)) {
    const regex = new RegExp(`\\b${abbrev.replace('.', '\\.')}\\b\\.?`, 'g');
    cleaned = cleaned.replace(regex, full);
  }
  cleaned = cleaned.replace(/(\d+)%/g, (_, num) => `${num} pour cent`);
  cleaned = cleaned.replace(/(\d+[\s.]?\d*)\s*€/g, (_, amount) => `${amount.replace(/[.\s]/g, '')} euros`);
  cleaned = cleaned.replace(/\n+/g, '. ');
  return cleaned.trim();
}

// ============================================================
// SSML HELPER
// ============================================================

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

function connectId(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

function dateString(): string {
  return new Date().toUTCString();
}

// ============================================================
// WEBSOCKET CONNECTION WITH DRM TOKEN
// ============================================================

async function generateSpeech(text: string, voice: string, rate: number, pitch: number, volume: number): Promise<ArrayBuffer> {
  // Generate DRM token
  const secMsGec = generateSecMsGec();
  const connectionId = connectId();

  // Build WSS URL with all required parameters
  const wssUrl = `${WSS_BASE}&ConnectionId=${connectionId}&Sec-MS-GEC=${secMsGec}&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}`;

  console.log(`Connecting to Edge TTS...`);

  // Use native Deno WebSocket (no custom headers needed - token is in URL)
  const ws = new WebSocket(wssUrl);
  
  return new Promise((resolve, reject) => {
    const audioChunks: Uint8Array[] = [];
    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        ws.close();
        reject(new Error('Edge TTS timeout'));
      }
    }, 30000);
    
    ws.onopen = () => {
      console.log('Connected to Edge TTS');
      
      // Send speech config
      const configMsg = `X-Timestamp:${dateString()}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"true","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}`;
      ws.send(configMsg);
      
      // Send SSML
      const ssml = textToSSML(text, voice, rate, pitch, volume);
      const requestId = connectId();
      const ssmlMsg =
        `X-RequestId:${requestId}\r\n` +
        `Content-Type:application/ssml+xml\r\n` +
        `X-Timestamp:${dateString()}Z\r\n` +
        `Path:ssml\r\n\r\n` +
        `${ssml}`;
      ws.send(ssmlMsg);
    };
    
    ws.onmessage = (event) => {
      if (resolved) return;
      
      if (typeof event.data === 'string') {
        if (event.data.includes('Path:turn.end')) {
          console.log('TTS generation complete');
          resolved = true;
          clearTimeout(timeout);
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
      } else if (event.data instanceof Blob) {
        event.data.arrayBuffer().then(buffer => {
          const data = new Uint8Array(buffer);
          // Edge TTS binary: first 2 bytes = header length
          if (data.length >= 2) {
            const headerLength = (data[0] << 8) | data[1];
            const audioData = data.slice(2 + headerLength);
            if (audioData.length > 0) {
              audioChunks.push(audioData);
            }
          }
        });
      } else if (event.data instanceof ArrayBuffer) {
        const data = new Uint8Array(event.data);
        if (data.length >= 2) {
          const headerLength = (data[0] << 8) | data[1];
          const audioData = data.slice(2 + headerLength);
          if (audioData.length > 0) {
            audioChunks.push(audioData);
          }
        }
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        reject(new Error('Edge TTS WebSocket error'));
      }
    };
    
    ws.onclose = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
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
  });
}

// ============================================================
// HTTP HANDLER
// ============================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      text, 
      agentName,
      voice,
      gender = 'female',
      speed = 0,
      pitch = 0,
      volume = 0
    } = await req.json();

    if (!text) {
      throw new Error('Text is required');
    }

    const cleanedText = cleanTextForFrench(text);
    const truncatedText = cleanedText.substring(0, 4096);
    
    let voiceConfig: AgentVoiceConfig | null = null;
    let voiceName: string;
    let finalRate = speed;
    let finalPitch = pitch;
    let finalVolume = volume;
    
    if (agentName && AGENT_VOICES[agentName]) {
      voiceConfig = AGENT_VOICES[agentName];
      voiceName = voiceConfig.voiceId;
      finalRate = voiceConfig.rate;
      finalPitch = voiceConfig.pitch;
      finalVolume = voiceConfig.volume;
    } else if (voice) {
      voiceName = voice;
    } else {
      voiceName = FALLBACK_VOICES[gender] || FALLBACK_VOICES.female;
    }

    console.log(`Generating speech: agent="${agentName}" voice=${voiceName}, rate=${finalRate}, pitch=${finalPitch}`);

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
