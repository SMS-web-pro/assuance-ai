# Kokoro TTS Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the robotic Web Speech API with high-quality TTS (Edge TTS or Kokoro) for mobile voice, providing natural French voices with distinct male/female characteristics.

**Architecture:** Two-phase approach:
1. **Phase 1 (Immediate):** Connect mobile to existing Supabase Edge TTS function (already deployed)
2. **Phase 2 (Optional):** Add Kokoro as alternative TTS backend

**Tech Stack:** React, TypeScript, Supabase Edge Functions, Web Audio API

---

## Current Problem Analysis

The mobile voice system uses `useNativeSpeechVoice.ts` which calls the browser's Web Speech API directly. This results in:
- Robotic, low-quality voices
- No distinction between male/female agents on mobile
- Quiet audio output

**Solution:** The project already has `supabase/functions/edge-tts/index.ts` that provides Microsoft Edge TTS voices (high quality neural voices), but the frontend doesn't use it.

---

## Phase 1: Connect Mobile to Edge TTS (Recommended First Step)

### Task 1: Create Edge TTS Voice Service

**Files:**
- Create: `src/services/edgeTTSService.ts`
- Modify: `src/hooks/useNativeSpeechVoice.ts`

**Purpose:** Centralize Edge TTS API calls with agent-specific voice mapping.

- [ ] **Step 1: Create the Edge TTS service**

```typescript
// src/services/edgeTTSService.ts

import { supabase } from '@/integrations/supabase/client';

export interface EdgeTTSOptions {
  text: string;
  gender: 'male' | 'female';
  speed?: number;    // -50 to +50
  pitch?: number;    // -50 to +50
  volume?: number;   // -50 to +50
}

export interface AgentVoiceConfig {
  voice: string;
  speed: number;
  pitch: number;
  volume: number;
}

// Agent voice configurations for Edge TTS
export const AGENT_VOICE_CONFIGS: Record<string, AgentVoiceConfig> = {
  // MALE AGENTS - Lower pitch, slower speed
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
  
  // FEMALE AGENTS - Higher pitch, natural speed
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

/**
 * Generate speech using Edge TTS via Supabase Edge Function
 */
export async function generateEdgeTTS(options: EdgeTTSOptions): Promise<ArrayBuffer> {
  const { text, gender, speed = 0, pitch = 0, volume = 0 } = options;
  
  const { data, error } = await supabase.functions.invoke('edge-tts', {
    body: {
      text: text.substring(0, 4096), // Edge TTS limit
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
 * Generate speech for a specific agent
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
  
  return generateEdgeTTS({
    text,
    gender: ['Marc Dubois', 'Alex Moreau', 'Pierre Delacroix'].includes(agentName) 
      ? 'male' 
      : 'female',
    speed: config.speed,
    pitch: config.pitch,
    volume: config.volume
  });
}
```

- [ ] **Step 2: Test the service**

```bash
# Verify TypeScript compiles
npx tsc --noEmit
```

Expected: No errors

---

### Task 2: Update useNativeSpeechVoice to Use Edge TTS

**Files:**
- Modify: `src/hooks/useNativeSpeechVoice.ts`

**Purpose:** Replace Web Speech API with Edge TTS for high-quality audio.

- [ ] **Step 1: Add Edge TTS import and audio playback state**

Add at the top of the file:
```typescript
import { generateAgentSpeech, AGENT_VOICE_CONFIGS } from '@/services/edgeTTSService';
```

Add new state variables after existing state:
```typescript
const [audioUrl, setAudioUrl] = useState<string | null>(null);
const audioRef = useRef<HTMLAudioElement | null>(null);
```

- [ ] **Step 2: Replace speakWithNativeAPI function**

Replace the entire `speakWithNativeAPI` function with:

```typescript
// Generate and play speech using Edge TTS (high quality)
const speakWithEdgeTTS = useCallback(async (text: string) => {
  if (!isActive) {
    console.log('🔇 Agent inactif');
    return;
  }

  if (!text || text.trim().length < 2) {
    console.warn('⚠️ Texte trop court');
    return;
  }

  const cleanedText = cleanTextForSpeech(text);
  if (!cleanedText || cleanedText.trim().length < 2) {
    console.warn('⚠️ Texte nettoyé trop court');
    return;
  }

  // Stop any current playback
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current = null;
  }
  if (audioUrl) {
    URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
  }

  // Activate Wake Lock on mobile
  await requestWakeLock();

  setLastMessage(text);
  setIsSpeaking(true);

  try {
    console.log(`🎙️ Edge TTS: ${isMobile ? '📱 MOBILE' : '💻 DESKTOP'} | Agent: ${expertName} | Gender: ${expertGender}`);
    
    // Generate audio via Edge TTS
    const audioBuffer = await generateAgentSpeech(cleanedText, expertName);
    
    // Create blob URL for playback
    const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
    const url = URL.createObjectURL(blob);
    setAudioUrl(url);
    
    // Create and play audio
    const audio = new Audio(url);
    audioRef.current = audio;
    
    audio.onplay = () => {
      console.log('🔊 Edge TTS playback started');
    };
    
    audio.onended = () => {
      setIsSpeaking(false);
      releaseWakeLock();
      URL.revokeObjectURL(url);
      setAudioUrl(null);
      audioRef.current = null;
      console.log('✅ Edge TTS playback completed');
    };
    
    audio.onerror = (error) => {
      console.error('❌ Edge TTS playback error:', error);
      setIsSpeaking(false);
      releaseWakeLock();
      URL.revokeObjectURL(url);
      setAudioUrl(null);
      audioRef.current = null;
    };
    
    await audio.play();
    
  } catch (error) {
    console.error('❌ Edge TTS generation error:', error);
    setIsSpeaking(false);
    releaseWakeLock();
    
    // Fallback to Web Speech API if Edge TTS fails
    console.log('🔄 Falling back to Web Speech API...');
    speakWithNativeAPI(text);
  }
}, [isActive, expertName, expertGender, cleanTextForSpeech, isMobile, requestWakeLock, releaseWakeLock]);
```

- [ ] **Step 3: Update the hook return**

Replace `speak: speakWithNativeAPI` with `speak: speakWithEdgeTTS` in the return statement.

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

---

### Task 3: Add Audio Cleanup on Unmount

**Files:**
- Modify: `src/hooks/useNativeSpeechVoice.ts`

- [ ] **Step 1: Add cleanup in useEffect**

Find the cleanup useEffect and add audio cleanup:

```typescript
useEffect(() => {
  // ... existing cleanup code ...
  
  // Cleanup audio
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current = null;
  }
  if (audioUrl) {
    URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
  }
  
  return () => {
    // ... existing return cleanup ...
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
  };
}, [isActive]);
```

---

### Task 4: Test Mobile Voice

**Files:**
- None (manual testing)

- [ ] **Step 1: Start development server**

```bash
npm run dev
```

- [ ] **Step 2: Open on mobile device**

- [ ] **Step 3: Test each agent voice**

| Agent | Expected Voice | Gender |
|-------|---------------|--------|
| Marc Dubois | Henri (male) | Male, calm |
| Sophie Martin | Denise (female) | Female, warm |
| Dr. Claire Rousseau | Denise (female) | Female, professional |
| Alex Moreau | Henri (male) | Male, dynamic |
| Pierre Delacroix | Henri (male) | Male, serious |
| Camille Durand | Vivienne (female) | Female, energetic |

- [ ] **Step 4: Verify audio quality**

- [ ] **Step 5: Test fallback to Web Speech API**

---

## Phase 2: Kokoro Integration (Optional Enhancement)

> **Note:** Phase 2 requires a Python backend. Complete Phase 1 first.

### Task 5: Create Kokoro Backend Service

**Files:**
- Create: `backend/kokoro_server.py`
- Create: `backend/requirements.txt`
- Create: `Dockerfile`

**Purpose:** Deploy Kokoro as a separate Python service.

- [ ] **Step 1: Create requirements.txt**

```
kokoro>=0.9.4
soundfile
torch
flask
flask-cors
```

- [ ] **Step 2: Create kokoro_server.py**

```python
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from kokoro import KPipeline
import soundfile as sf
import io
import os

app = Flask(__name__)
CORS(app)

# Initialize Kokoro pipeline for French
pipeline_fr = KPipeline(lang_code='f')

# Voice configurations per agent
AGENT_VOICES = {
    'Marc Dubois': 'am_adam',
    'Alex Moreau': 'am_adam',
    'Pierre Delacroix': 'am_adam',
    'Sophie Martin': 'af_heart',
    'Dr. Claire Rousseau': 'af_sarah',
    'Camille Durand': 'af_bella'
}

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'})

@app.route('/tts', methods=['POST'])
def text_to_speech():
    try:
        data = request.json
        text = data.get('text', '')
        agent_name = data.get('agentName', '')
        
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        # Get voice for agent
        voice = AGENT_VOICES.get(agent_name, 'af_heart')
        
        # Generate audio
        audio_chunks = []
        generator = pipeline_fr(text, voice=voice, speed=1.0)
        
        for gs, ps, audio in generator:
            audio_chunks.append(audio)
        
        # Concatenate chunks
        import numpy as np
        full_audio = np.concatenate(audio_chunks)
        
        # Save to buffer
        buffer = io.BytesIO()
        sf.write(buffer, full_audio, 24000, format='WAV')
        buffer.seek(0)
        
        return send_file(
            buffer,
            mimetype='audio/wav',
            as_attachment=True,
            download_name='speech.wav'
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
```

- [ ] **Step 3: Create Dockerfile**

```dockerfile
FROM python:3.9-slim

WORKDIR /app

# Install espeak-ng for French support
RUN apt-get update && apt-get install -y \
    espeak-ng \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8080

CMD ["python", "kokoro_server.py"]
```

---

### Task 6: Create Kokoro Service for Frontend

**Files:**
- Create: `src/services/kokoroService.ts`

- [ ] **Step 1: Create Kokoro service**

```typescript
// src/services/kokoroService.ts

const KOKORO_API_URL = import.meta.env.VITE_KOKORO_API_URL || 'http://localhost:8080';

export interface KokoroOptions {
  text: string;
  agentName: string;
}

/**
 * Generate speech using Kokoro TTS
 */
export async function generateKokoroSpeech(options: KokoroOptions): Promise<ArrayBuffer> {
  const { text, agentName } = options;
  
  const response = await fetch(`${KOKORO_API_URL}/tts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: text.substring(0, 4096),
      agentName
    })
  });
  
  if (!response.ok) {
    throw new Error(`Kokoro TTS failed: ${response.statusText}`);
  }
  
  return response.arrayBuffer();
}
```

---

### Task 7: Update Hook to Support Multiple TTS Backends

**Files:**
- Modify: `src/hooks/useNativeSpeechVoice.ts`

- [ ] **Step 1: Add TTS backend selection**

```typescript
type TTSBackend = 'edge' | 'kokoro' | 'native';

const getTTSBackend = (): TTSBackend => {
  // Check if Kokoro is configured
  if (import.meta.env.VITE_KOKORO_API_URL) {
    return 'kokoro';
  }
  // Default to Edge TTS
  return 'edge';
};
```

- [ ] **Step 2: Update speak function to use selected backend**

---

## Deployment Checklist

### Edge TTS (Phase 1)
- [ ] Verify `edge-tts` function is deployed in Supabase
- [ ] Test function manually:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/edge-tts \
  -H "apikey: your-anon-key" \
  -H "Authorization: Bearer your-anon-key" \
  -H "Content-Type: application/json" \
  -d '{"text": "Bonjour", "gender": "female"}'
```

### Kokoro (Phase 2)
- [ ] Build Docker image: `docker build -t kokoro-tts .`
- [ ] Test locally: `docker run -p 8080:8080 kokoro-tts`
- [ ] Deploy to hosting service (Railway, Render, etc.)
- [ ] Set `VITE_KOKORO_API_URL` environment variable

---

## Success Criteria

1. ✅ Mobile voice is clear and natural (not robotic)
2. ✅ Male agents have distinctly male voices
3. ✅ Female agents have distinctly female voices
4. ✅ Audio volume is adequate on mobile
5. ✅ Fallback to Web Speech API works if TTS fails
6. ✅ No TypeScript errors
7. ✅ Build succeeds

---

## Notes

- **Edge TTS** uses Microsoft's neural voices (Henri, Denise, Vivienne) - these are high quality
- **Kokoro** provides open-source voices but requires Python backend
- **Phase 1** (Edge TTS) is recommended as immediate fix
- **Phase 2** (Kokoro) is optional enhancement for fully open-source stack
