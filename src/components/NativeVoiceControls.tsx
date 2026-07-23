
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileVoiceControls from "./mobile/MobileVoiceControls";

interface NativeVoiceControlsProps {
  isListening: boolean;
  isSpeaking: boolean;
  isSupported: boolean;
  onStartListening: () => void;
  onStopListening: () => void;
  onStopSpeaking: () => void;
  onReplayLastMessage?: () => void;
  hasLastMessage?: boolean;
  selectedVoice?: string;
  availableVoicesCount?: number;
  onVoiceMessage?: (message: string) => void;
}

const NativeVoiceControls = ({ 
  isListening,
  isSpeaking,
  isSupported,
  onStartListening,
  onStopListening,
  onStopSpeaking,
  onReplayLastMessage,
  hasLastMessage = false,
  onVoiceMessage
}: NativeVoiceControlsProps) => {
  const isMobile = useIsMobile();

  const handleToggleListening = () => {
    if (isListening) {
      onStopListening();
    } else {
      onStartListening();
    }
  };

  const handleTogglePlayback = () => {
    if (isSpeaking) {
      onStopSpeaking();
    } else if (onReplayLastMessage && hasLastMessage) {
      onReplayLastMessage();
    }
  };

  if (!isSupported) {
    return (
      <div className="text-sm text-gray-500">
        Fonction vocale non supportée par votre navigateur
      </div>
    );
  }

  // Version mobile
  if (isMobile) {
    return (
      <MobileVoiceControls
        isListening={isListening}
        isPlaying={isSpeaking}
        onToggleListening={handleToggleListening}
        onTogglePlayback={handleTogglePlayback}
        onVoiceMessage={onVoiceMessage}
      />
    );
  }

  // Version desktop
  return (
    <div className="flex items-center gap-4">
      <Button
        onClick={handleToggleListening}
        variant={isListening ? "destructive" : "default"}
        size="sm"
        className={`transition-all duration-200 ${
          isListening ? "animate-pulse" : ""
        }`}
      >
        {isListening ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
        {isListening ? "Arrêter" : "Parler"}
      </Button>

      <Button
        onClick={handleTogglePlayback}
        variant={isSpeaking ? "destructive" : "outline"}
        size="sm"
        disabled={!hasLastMessage && !isSpeaking}
      >
        {isSpeaking ? <VolumeX className="w-4 h-4 mr-2" /> : <Volume2 className="w-4 h-4 mr-2" />}
        {isSpeaking ? "Couper" : "Audio"}
      </Button>
    </div>
  );
};

export default NativeVoiceControls;
