
import React from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Volume2, VolumeX, Sparkles, Heart, Brain } from 'lucide-react';

interface OptimizedVoiceControlsProps {
  isListening: boolean;
  isSpeaking: boolean;
  isSupported: boolean;
  selectedVoice: string;
  availableVoicesCount: number;
  onStartListening: () => void;
  onStopListening: () => void;
  onStopSpeaking: () => void;
}

const OptimizedVoiceControls: React.FC<OptimizedVoiceControlsProps> = ({
  isListening,
  isSpeaking,
  isSupported,
  selectedVoice,
  availableVoicesCount,
  onStartListening,
  onStopListening,
  onStopSpeaking
}) => {
  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
        <MicOff className="w-4 h-4" />
        <span>Fonction vocale non supportée sur ce navigateur</span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-emerald-50 p-5 rounded-2xl border-2 border-purple-200 shadow-xl">
      {/* Header avec branding ultra-humain */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-purple-800 text-lg">Voix Ultra-Humaine</span>
              <Heart className="w-4 h-4 text-pink-500 animate-pulse" />
            </div>
            <div className="flex items-center gap-1 text-xs text-purple-600">
              <Brain className="w-3 h-3" />
              <span>IA Émotionnelle • Professionnel • Gratuit</span>
            </div>
          </div>
        </div>
        <div className="text-xs text-gray-600 bg-white px-3 py-2 rounded-full border-2 border-purple-100 shadow-sm">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>{availableVoicesCount} voix premium</span>
          </div>
        </div>
      </div>

      {/* Contrôles principaux avec design ultra-moderne */}
      <div className="flex items-center gap-5">
        {/* Contrôle microphone premium */}
        <div className="flex items-center gap-4">
          <Button
            variant={isListening ? "destructive" : "default"}
            size="lg"
            onClick={isListening ? onStopListening : onStartListening}
            className={`relative transition-all duration-500 transform hover:scale-110 shadow-lg ${
              isListening 
                ? 'animate-pulse bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-red-300 shadow-xl border-2 border-red-300' 
                : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-purple-300 shadow-xl border-2 border-purple-300'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-5 h-5 mr-2" />
                Arrêter l'écoute
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-400 rounded-full animate-ping" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 mr-2" />
                Parler maintenant
                <Sparkles className="w-4 h-4 ml-2 animate-pulse" />
              </>
            )}
          </Button>
          
          {isListening && (
            <div className="flex items-center gap-3 text-sm text-red-600 font-bold animate-pulse">
              <div className="flex gap-1">
                <div className="w-2 h-6 bg-gradient-to-t from-red-300 to-red-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-8 bg-gradient-to-t from-red-400 to-red-700 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-5 bg-gradient-to-t from-red-300 to-red-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                <div className="w-2 h-7 bg-gradient-to-t from-red-400 to-red-700 rounded-full animate-bounce" style={{ animationDelay: '450ms' }}></div>
              </div>
              <div>
                <div className="font-semibold">🎤 Écoute active premium</div>
                <div className="text-xs text-red-500">Analyse émotionnelle en cours...</div>
              </div>
            </div>
          )}
        </div>

        {/* Contrôle haut-parleur premium */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="lg"
            onClick={onStopSpeaking}
            disabled={!isSpeaking}
            className={`relative transition-all duration-500 transform hover:scale-110 ${
              isSpeaking 
                ? 'animate-pulse border-2 border-emerald-500 text-emerald-700 hover:bg-emerald-50 shadow-emerald-300 shadow-xl bg-gradient-to-r from-emerald-50 to-blue-50' 
                : 'border-2 border-gray-300 hover:bg-gray-50 shadow-md'
            }`}
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-5 h-5 mr-2" />
                Arrêter la voix
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-emerald-400 rounded-full animate-ping" />
              </>
            ) : (
              <>
                <Volume2 className="w-5 h-5 mr-2" />
                Voix au repos
                <Heart className="w-4 h-4 ml-2 text-gray-400" />
              </>
            )}
          </Button>
          
          {isSpeaking && (
            <div className="flex items-center gap-3 text-sm text-emerald-700 font-bold">
              <div className="flex gap-1">
                <div className="w-1 h-8 bg-gradient-to-t from-emerald-300 to-emerald-600 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1 h-6 bg-gradient-to-t from-emerald-400 to-emerald-700 rounded-full animate-pulse" style={{ animationDelay: '100ms' }}></div>
                <div className="w-1 h-10 bg-gradient-to-t from-emerald-300 to-emerald-600 rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
                <div className="w-1 h-4 bg-gradient-to-t from-emerald-400 to-emerald-500 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></div>
                <div className="w-1 h-7 bg-gradient-to-t from-emerald-300 to-emerald-600 rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
                <div className="w-1 h-5 bg-gradient-to-t from-emerald-400 to-emerald-700 rounded-full animate-pulse" style={{ animationDelay: '500ms' }}></div>
              </div>
              <div>
                <div className="font-semibold flex items-center gap-1">
                  <Volume2 className="w-4 h-4" />
                  Voix ultra-naturelle active
                </div>
                <div className="text-xs text-emerald-600">Lecture avec émotions en temps réel</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Informations techniques et qualité */}
      <div className="mt-5 pt-4 border-t border-purple-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-3">
            <div className="text-gray-700">
              <span className="font-semibold">Voix sélectionnée:</span> 
              <span className="text-purple-700 font-medium ml-1">{selectedVoice}</span>
            </div>
            <div className="h-4 w-px bg-gray-300"></div>
            <div className="flex items-center gap-1 text-purple-600">
              <Brain className="w-4 h-4" />
              <span className="font-medium">Analyse émotionnelle</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <Sparkles className="w-4 h-4" />
              <span className="font-semibold text-xs">ULTRA-HUMAIN</span>
            </div>
            <div className="flex items-center gap-1 text-pink-600 bg-pink-50 px-3 py-1 rounded-full border border-pink-200">
              <Heart className="w-4 h-4 animate-pulse" />
              <span className="font-semibold text-xs">PROFESSIONNEL</span>
            </div>
          </div>
        </div>
        
        {/* Indicateurs de qualité */}
        <div className="mt-3 flex items-center justify-center gap-6 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Sélection intelligente</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Nettoyage professionnel</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            <span>Émotions naturelles</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
            <span>Pauses intelligentes</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptimizedVoiceControls;
