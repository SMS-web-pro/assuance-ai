
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const WSS_URL = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}`;

const FRENCH_VOICES: Record<string, string> = {
  'female': 'fr-FR-DeniseNeural',
  'male': 'fr-FR-HenriNeural',
  'denise': 'fr-FR-DeniseNeural',
  'henri': 'fr-FR-HenriNeural',
  'vivienne': 'fr-FR-VivienneNeural',
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
  const pitchStr = pitch >= 0 ? `+${pitch}Hz` : `${pitch}%`;
  const volumeStr = volume >= 0 ? `+${volume}%` : `${volume}%`;
  
  return `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='fr-FR'>
    <voice name='${voice}'>
      <prosody rate='${rateStr}' pitch='${pitchStr}' volume='${volumeStr}'>
        ${escapeXml(text)}
      </prosody>
    </voice>
  </speak>`;
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
    const { text, voice, gender = 'female', speed = 0, pitch = 0, volume = 0 } = await req.json();

    if (!text) {
      throw new Error('Text is required');
    }

    const truncatedText = text.substring(0, 4096);
    
    let voiceName = voice || FRENCH_VOICES[gender] || FRENCH_VOICES.female;
    if (FRENCH_VOICES[voiceName.toLowerCase()]) {
      voiceName = FRENCH_VOICES[voiceName.toLowerCase()];
    }

    console.log(`Generating speech: voice=${voiceName}, rate=${speed}, pitch=${pitch}`);

    const audioBuffer = await generateSpeech(truncatedText, voiceName, speed, pitch, volume);

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
