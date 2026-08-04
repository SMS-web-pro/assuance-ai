
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Shield } from "lucide-react";

interface InteractiveAvatarProps {
  insuranceType: string;
  isActive?: boolean;
}

const InteractiveAvatar = ({ insuranceType, isActive = false }: InteractiveAvatarProps) => {
  return (
    <Card className={`relative overflow-hidden border-0 shadow-none bg-transparent transition-all duration-300 ${
      isActive ? 'ring-2 ring-blue-500/30' : ''
    }`}>
      {/* Professional Header */}
      <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Conseiller en ligne</span>
          </div>
          {isActive && (
            <Badge className="bg-green-500 text-white px-2 py-1 text-xs font-medium">
              En conversation
            </Badge>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-5 bg-white">
        <div className="flex items-start space-x-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
              isActive 
                ? 'border-blue-500 shadow-md shadow-blue-500/20' 
                : 'border-gray-200'
            }`}>
              <Avatar className="w-full h-full">
                <AvatarFallback className={`text-sm font-semibold ${
                  isActive ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
                }`}>
                  <Shield className="w-6 h-6" />
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="space-y-2">
              <div>
                <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                  isActive ? 'text-blue-600' : 'text-gray-900'
                }`}>
                  AssureAI
                </h3>
                <p className="text-sm text-gray-600 font-medium">
                  Conseiller Expert
                </p>
              </div>
              
              {/* Status */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center space-x-2">
                  {!isActive ? (
                    <Badge variant="outline" className="text-xs px-2 py-1 border-green-200 text-green-700 bg-green-50">
                      Disponible
                    </Badge>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="font-medium">LIVE</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Audio Visualizer */}
                {isActive && (
                  <div className="flex items-end space-x-0.5">
                    <div className="w-0.5 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
                    <div className="w-0.5 h-4 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-0.5 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    <div className="w-0.5 h-5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></div>
                    <div className="w-0.5 h-3 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      {isActive && (
        <div className="bg-gray-50/50 border-t border-gray-100 px-6 py-3">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Conversation sécurisée et confidentielle</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default InteractiveAvatar;
