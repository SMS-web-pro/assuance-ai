
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Microsoft Edge TTS voices for French
const FRENCH_VOICES = {
  'female': 'fr-FR-DeniseNeural',
  'male': 'fr-FR-HenriNeural',
  'denise': 'fr-FR-DeniseNeural',
  'henri': 'fr-FR-HenriNeural',
  'vivienne': 'fr-FR-VivienneNeural',
};

// WebSocket endpoint for Microsoft Edge TTS
const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const WSS_URL = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}`;

interface TTSRequest {
  text: string;
  voice?: string;
  gender?: 'male' | 'female';
  speed?: number;
  pitch?: number;
  volume?: number;
}

// Convert text to SSML
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

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Generate speech using Microsoft Edge TTS WebSocket
async function generateSpeech(request: TTSRequest): Promise<ArrayBuffer> {
  const { text, voice, gender = 'female', speed = 0, pitch = 0, volume = 0 } = request;
  
  // Resolve voice name
  let voiceName = voice || FRENCH_VOICES[gender] || FRENCH_VOICES.female;
  if (FRENCH_VOICES[voiceName.toLowerCase()]) {
    voiceName = FRENCH_VOICES[voiceName.toLowerCase()];
  }
  
  console.log(`🎤 Generating speech with voice: ${voiceName}, speed: ${speed}, pitch: ${pitch}`);
  
  // Connect to WebSocket
  const ws = new WebSocket(WSS_URL);
  
  return new Promise((resolve, reject) => {
    const audioChunks: ArrayBuffer[] = [];
    let requestId = '';
    
    ws.onopen = () => {
      console.log('🔌 WebSocket connected');
      
      // Send configuration
      const configMessage = `Content-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}`;
      ws.send(configMessage);
      
      // Generate unique request ID
      requestId = `request-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Send SSML
      const ssml = textToSSML(text, voiceName, speed, pitch, volume);
      const ssmlMessage = `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n${ssml}`;
      ws.send(ssmlMessage);
    };
    
    ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        // Audio data - extract from blob
        const data = new Uint8Array(event.data);
        // Skip the header (path header)
        let headerEnd = 0;
        for (let i = 0; i < data.length - 1; i++) {
          if (data[i] === 0x0D && data[i + 1] === 0x0A) {
            headerEnd = i + 2;
            break;
          }
        }
        if (headerEnd > 0 && headerEnd < data.length) {
          audioChunks.push(data.slice(headerEnd).buffer);
        }
      } else if (typeof event.data === 'string') {
        // Text message
        if (event.data.includes('Path:turn.end')) {
          console.log('✅ Speech generation complete');
          ws.close();
          
          // Combine audio chunks
          const totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
          const result = new Uint8Array(totalLength);
          let offset = 0;
          for (const chunk of audioChunks) {
            result.set(new Uint8Array(chunk), offset);
            offset += chunk.byteLength;
          }
          resolve(result.buffer);
        }
      }
    };
    
    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      reject(new Error('WebSocket error during TTS generation'));
    };
    
    ws.onclose = () => {
      console.log('🔌 WebSocket closed');
    };
    
    // Timeout after 30 seconds
    setTimeout(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
        reject(new Error('TTS generation timeout'));
      }
    }, 30000);
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request: TTSRequest = await req.json();
    
    console.log('🔊 Edge TTS request:', {
      text: request.text?.substring(0, 50) + '...',
      voice: request.voice,
      gender: request.gender,
      speed: request.speed,
    });

    if (!request.text) {
      throw new Error('Text is required');
    }

    // Limit text length
    const text = request.text.substring(0, 4096);
    
    // Generate speech
    const audioBuffer = await generateSpeech({
      ...request,
      text,
    });

    // Return audio as MP3
    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('❌ Edge TTS error:', error);
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
