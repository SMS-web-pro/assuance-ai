
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, MicOff, Volume2, VolumeX, RotateCcw } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface MobileVoiceControlsProps {
  isListening: boolean;
  isPlaying: boolean;
  onToggleListening: () => void;
  onTogglePlayback: () => void;
  onVoiceMessage?: (message: string) => void;
  onReplayLast?: () => void;
  hasLastMessage?: boolean;
}

const MobileVoiceControls = ({ 
  isListening, 
  isPlaying, 
  onToggleListening, 
  onTogglePlayback,
  onVoiceMessage,
  onReplayLast,
  hasLastMessage = false
}: MobileVoiceControlsProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const { toast } = useToast();

  // Initialiser la reconnaissance vocale
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'fr-FR';
      recognitionRef.current.maxAlternatives = 1;
      
      recognitionRef.current.onstart = () => {
        setIsRecording(true);
        setRecordingTime(0);
        console.log('🎤 Reconnaissance vocale démarrée');
      };
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('🎤 Transcript reçu:', transcript);
        setTranscript(transcript);
        
        if (transcript.trim() && onVoiceMessage) {
          onVoiceMessage(transcript);
          toast({
            title: "Message envoyé",
            description: `"${transcript.substring(0, 50)}${transcript.length > 50 ? '...' : ''}"`,
          });
        }
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Erreur reconnaissance vocale:', event.error);
        setIsRecording(false);
        clearInterval(timerRef.current);
        
        if (event.error === 'no-speech') {
          console.log('🔇 Aucune parole détectée');
          toast({
            title: "Aucun son détecté",
            description: "Essayez de parler plus fort ou plus près du microphone",
            duration: 2000
          });
          return;
        }
        
        if (event.error !== 'aborted') {
          toast({
            title: "Erreur microphone",
            description: "Vérifiez les permissions de votre microphone",
            variant: "destructive",
          });
        }
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
        clearInterval(timerRef.current);
        console.log('🎤 Reconnaissance vocale terminée');
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      clearInterval(timerRef.current);
    };
  }, [onVoiceMessage, toast]);

  // Timer pour afficher la durée d'enregistrement
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setRecordingTime(0);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  const handleMicClick = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          console.log('🎤 Démarrage de la reconnaissance vocale...');
        } catch (error) {
          console.error('Erreur lors du démarrage:', error);
          toast({
            title: "Erreur",
            description: "Impossible de démarrer le microphone",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Non supporté",
          description: "La reconnaissance vocale n'est pas disponible",
          variant: "destructive",
        });
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="px-4 pb-3">
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        {/* En-tête avec statut */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : isPlaying ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`} />
            <span className="text-xs font-medium text-gray-600">
              {isRecording ? 'Écoute en cours...' : isPlaying ? 'Lecture...' : 'Prêt à parler'}
            </span>
          </div>
          {isRecording && (
            <span className="text-xs font-mono text-red-500 font-medium">
              {formatTime(recordingTime)}
            </span>
          )}
        </div>

        {/* Boutons principaux */}
        <div className="flex items-center justify-center gap-4">
          {/* Bouton Replay */}
          <button
            onClick={onReplayLast}
            disabled={!hasLastMessage || isRecording}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              hasLastMessage && !isRecording
                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                : 'bg-gray-50 text-gray-300 cursor-not-allowed'
            }`}
            title="Rejouer le dernier message"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* Bouton Microphone Principal */}
          <button
            onClick={handleMicClick}
            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all transform ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200 scale-110' 
                : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-200 hover:scale-105'
            }`}
          >
            {isRecording ? (
              <MicOff className="w-7 h-7" />
            ) : (
              <Mic className="w-7 h-7" />
            )}
          </button>

          {/* Bouton Speaker */}
          <button
            onClick={onTogglePlayback}
            disabled={isRecording}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
              isPlaying 
                ? 'bg-blue-100 text-blue-600' 
                : isRecording
                  ? 'bg-gray-50 text-gray-300 cursor-not-allowed'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
            title={isPlaying ? 'Couper le son' : 'Activer le son'}
          >
            {isPlaying ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Transcript en cours */}
        {transcript && isRecording && (
          <div className="mt-3 p-2 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 text-center italic">"{transcript}"</p>
          </div>
        )}

        {/* Instructions */}
        {!isRecording && !isPlaying && (
          <p className="text-xs text-gray-400 text-center mt-3">
            Appuyez sur le micro pour parler
          </p>
        )}
      </div>
    </div>
  );
};

export default MobileVoiceControls;
