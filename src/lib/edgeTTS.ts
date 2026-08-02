
// Microsoft Edge TTS client-side implementation
// Uses the same WebSocket endpoint as Microsoft Edge browser

const TRUSTED_CLIENT_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';
const WSS_URL = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}`;

// French voices
export const FRENCH_VOICES = {
  female: {
    denise: 'fr-FR-DeniseNeural',
    vivienne: 'fr-FR-VivienneNeural',
  },
  male: {
    henri: 'fr-FR-HenriNeural',
  },
};

interface EdgeTTSOptions {
  text: string;
  voice?: string;
  gender?: 'male' | 'female';
  rate?: number; // -50 to +50 (percentage)
  pitch?: number; // -50 to +50 (Hz offset)
  volume?: number; // -50 to +50 (percentage)
}

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

export async function generateEdgeTTS(options: EdgeTTSOptions): Promise<ArrayBuffer> {
  const { text, voice, gender = 'female', rate = 0, pitch = 0, volume = 0 } = options;
  
  // Resolve voice name
  let voiceName = voice;
  if (!voiceName) {
    const genderVoices = FRENCH_VOICES[gender] || FRENCH_VOICES.female;
    voiceName = genderVoices.denise || Object.values(genderVoices)[0];
  }
  
  console.log(`🎤 Edge TTS: voice=${voiceName}, rate=${rate}, pitch=${pitch}`);
  
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WSS_URL);
    const audioChunks: ArrayBuffer[] = [];
    let requestId = '';
    let resolved = false;
    
    ws.onopen = () => {
      console.log('🔌 Edge TTS WebSocket connected');
      
      // Send config
      const configMsg = `Content-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"false"},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}`;
      ws.send(configMsg);
      
      // Generate request ID
      requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Send SSML
      const ssml = textToSSML(text, voiceName, rate, pitch, volume);
      const ssmlMsg = `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n${ssml}`;
      ws.send(ssmlMsg);
    };
    
    ws.onmessage = (event) => {
      if (resolved) return;
      
      if (typeof event.data === 'string') {
        // Text message - check for turn.end
        if (event.data.includes('Path:turn.end')) {
          console.log('✅ Edge TTS generation complete');
          resolved = true;
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
      } else if (event.data instanceof Blob) {
        // Binary data from Blob
        event.data.arrayBuffer().then((buffer) => {
          const data = new Uint8Array(buffer);
          // Find header end (CRLF CRLF)
          let headerEnd = -1;
          for (let i = 0; i < data.length - 3; i++) {
            if (data[i] === 0x0D && data[i+1] === 0x0A && data[i+2] === 0x0D && data[i+3] === 0x0A) {
              headerEnd = i + 4;
              break;
            }
          }
          if (headerEnd === -1) {
            // Try single CRLF
            for (let i = 0; i < data.length - 1; i++) {
              if (data[i] === 0x0D && data[i+1] === 0x0A) {
                headerEnd = i + 2;
                break;
              }
            }
          }
          if (headerEnd > 0 && headerEnd < data.length) {
            audioChunks.push(data.slice(headerEnd).buffer);
          } else if (data.length > 0) {
            // No header found, assume all is audio
            audioChunks.push(buffer);
          }
        });
      }
    };
    
    ws.onerror = (error) => {
      console.error('❌ Edge TTS WebSocket error:', error);
      if (!resolved) {
        resolved = true;
        reject(new Error('Edge TTS WebSocket error'));
      }
    };
    
    ws.onclose = () => {
      console.log('🔌 Edge TTS WebSocket closed');
      if (!resolved) {
        resolved = true;
        // If we have some audio, resolve with it
        if (audioChunks.length > 0) {
          const totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
          const result = new Uint8Array(totalLength);
          let offset = 0;
          for (const chunk of audioChunks) {
            result.set(new Uint8Array(chunk), offset);
            offset += chunk.byteLength;
          }
          resolve(result.buffer);
        } else {
          reject(new Error('Edge TTS connection closed without audio'));
        }
      }
    };
    
    // Timeout after 30 seconds
    setTimeout(() => {
      if (!resolved && ws.readyState === WebSocket.OPEN) {
        resolved = true;
        ws.close();
        reject(new Error('Edge TTS timeout'));
      }
    }, 30000);
  });
}
