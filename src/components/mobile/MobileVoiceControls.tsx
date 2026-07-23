
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

interface MobileVoiceControlsProps {
  isListening: boolean;
  isPlaying: boolean;
  onToggleListening: () => void;
  onTogglePlayback: () => void;
  onVoiceMessage?: (message: string) => void;
}

const MobileVoiceControls = ({ 
  isListening, 
  isPlaying, 
  onToggleListening, 
  onTogglePlayback,
  onVoiceMessage 
}: MobileVoiceControlsProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
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
        console.log('🎤 Reconnaissance vocale démarrée');
      };
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('🎤 Transcript reçu:', transcript);
        setTranscript(transcript);
        
        if (transcript.trim() && onVoiceMessage) {
          onVoiceMessage(transcript);
          toast({
            title: "Message vocal envoyé",
            description: transcript,
          });
        }
      };
      
      recognitionRef.current.onerror = (event: any) => {
        console.error('Erreur reconnaissance vocale:', event.error);
        setIsRecording(false);
        
        // Ne pas afficher d'erreur pour "no-speech" - c'est normal
        if (event.error === 'no-speech') {
          console.log('🔇 Aucune parole détectée - essayez de parler plus fort ou plus près du microphone');
          return;
        }
        
        // Afficher une erreur seulement pour les vraies erreurs
        if (event.error !== 'aborted') {
          toast({
            title: "Erreur",
            description: "Problème avec le microphone. Vérifiez les permissions.",
            variant: "destructive",
          });
        }
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
        console.log('🎤 Reconnaissance vocale terminée');
      };
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onVoiceMessage, toast]);

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
            description: "Impossible de démarrer la reconnaissance vocale",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Non supporté",
          description: "La reconnaissance vocale n'est pas supportée par votre navigateur",
          variant: "destructive",
        });
      }
    }
  };
  return (
    <div className="mx-4 mb-3">
      <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border rounded-lg p-3 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-foreground">
              Contrôles Vocaux
            </h4>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={handleMicClick}
              variant={isRecording ? "destructive" : "default"}
              size="sm"
              className="h-8 w-8 p-0"
            >
              {isRecording ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>
            
            <Button
              onClick={onTogglePlayback}
              variant={isPlaying ? "destructive" : "outline"}
              size="sm"
              className="h-8 w-8 p-0"
            >
              {isPlaying ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
        
        {(isRecording || isPlaying) && (
          <div className="mt-2 text-center">
            {isRecording && (
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-destructive/10 text-destructive rounded-md text-xs">
                <div className="w-1.5 h-1.5 bg-destructive rounded-full animate-pulse" />
                En écoute
              </div>
            )}
            {isPlaying && (
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs ml-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                Lecture
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileVoiceControls;
