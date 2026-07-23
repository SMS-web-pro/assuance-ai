import React from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, VolumeX, AlertCircle, Loader2, RotateCcw } from 'lucide-react';
interface SimpleVoiceControlsProps {
  isListening: boolean;
  isSpeaking: boolean;
  isSupported: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  onStopSpeaking: () => void;
  onReplayLastMessage?: () => void;
  hasLastMessage?: boolean;
}
const SimpleVoiceControls: React.FC<SimpleVoiceControlsProps> = ({
  isListening,
  isSpeaking,
  isSupported,
  onStartListening,
  onStopListening,
  onStopSpeaking,
  onReplayLastMessage,
  hasLastMessage = false
}) => {
  if (!isSupported) {
    return <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
        <AlertCircle className="w-4 h-4 text-red-500" />
        <span>Fonction vocale non supportée sur ce navigateur</span>
        <div className="text-xs text-gray-400 ml-2">
          (Chrome, Firefox ou Safari requis)
        </div>
      </div>;
  }
  return <div className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
      {/* Contrôle microphone pour chat vocal */}
      <div className="flex items-center gap-2">
        <Button variant={isListening ? "destructive" : "default"} size="sm" onClick={isListening ? onStopListening : onStartListening} className={`relative transition-all duration-200 ${isListening ? 'animate-pulse bg-red-500 hover:bg-red-600 text-white shadow-lg' : 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg'}`} title={isListening ? "Arrêter l'écoute" : "Parler au chat"}>
          {isListening ? <>
              <MicOff className="w-4 h-4 mr-2" />
              Arrêter
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-ping" />
            </> : <>
              <Mic className="w-4 h-4 mr-2" />
              Parler au Chat
            </>}
        </Button>
        
        {isListening && <div className="flex items-center gap-2 text-sm text-red-600 font-medium">
            <div className="flex gap-1">
              <div className="w-1 h-4 bg-red-500 rounded-full animate-pulse" style={{
            animationDelay: '0ms'
          }}></div>
              <div className="w-1 h-6 bg-red-600 rounded-full animate-pulse" style={{
            animationDelay: '150ms'
          }}></div>
              <div className="w-1 h-3 bg-red-500 rounded-full animate-pulse" style={{
            animationDelay: '300ms'
          }}></div>
              <div className="w-1 h-5 bg-red-600 rounded-full animate-pulse" style={{
            animationDelay: '450ms'
          }}></div>
            </div>
            <div className="flex flex-col">
              <span className="flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                🎤 Écoute active...
              </span>
              <span className="text-xs text-red-500">Parlez clairement</span>
            </div>
          </div>}
      </div>

      {/* Contrôle haut-parleur */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onStopSpeaking} disabled={!isSpeaking} className={`transition-all duration-200 ${isSpeaking ? 'animate-pulse border-green-500 text-green-600 hover:bg-green-50 shadow-md' : 'border-gray-300 hover:bg-gray-50'}`} title={isSpeaking ? "Arrêter la lecture" : "Réponse vocale inactive"}>
          {isSpeaking ? <>
              <VolumeX className="w-4 h-4 mr-2" />
              Arrêter la voix
            </> : <>
              <Volume2 className="w-4 h-4 mr-2" />
              Réponse vocale
            </>}
        </Button>

        {/* Nouveau bouton pour réécouter */}
        {hasLastMessage && (
          <Button
            variant="outline"
            size="sm"
            onClick={onReplayLastMessage}
            className="transition-all duration-200 border-purple-300 text-purple-600 hover:bg-purple-50 shadow-md hover:shadow-lg"
            title="Réécouter le dernier message de l'agent"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Réécouter
          </Button>
        )}
        {isSpeaking && <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
            <div className="flex gap-1">
              <div className="w-1 h-5 bg-green-500 rounded-full animate-pulse" style={{
            animationDelay: '0ms'
          }}></div>
              <div className="w-1 h-3 bg-green-600 rounded-full animate-pulse" style={{
            animationDelay: '100ms'
          }}></div>
              <div className="w-1 h-6 bg-green-500 rounded-full animate-pulse" style={{
            animationDelay: '200ms'
          }}></div>
              <div className="w-1 h-2 bg-green-600 rounded-full animate-pulse" style={{
            animationDelay: '300ms'
          }}></div>
            </div>
            <span>🔊 Agent parle...</span>
          </div>}
      </div>

      {/* Instructions d'utilisation améliorées */}
      <div className="ml-auto flex flex-col items-end text-xs text-gray-600">
        <div className="bg-white px-3 py-2 rounded-full border mb-1">
          💬 Parlez → Envoi automatique
        </div>
        <div className="text-xs text-gray-500">
          Conseil: Parlez clairement et distinctement
        </div>
        {hasLastMessage && <div className="text-xs text-purple-600">
            🔄 Réécouter disponible
          </div>}
      </div>
    </div>;
};
export default SimpleVoiceControls;