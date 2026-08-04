
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface InteractiveAvatarProps {
  insuranceType: string;
  isActive?: boolean;
}

// ============================================================
// SVGs PROFESSIONNELS PAR TYPE D'ASSURANCE
// ============================================================

const InsuranceIcons: Record<string, { icon: React.ReactNode; color: string; gradient: string }> = {
  "Assurance Auto": {
    icon: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <circle cx="32" cy="32" r="30" fill="url(#autoGrad)" />
        <path d="M16 38C16 38 18 28 22 26C26 24 28 24 32 24C36 24 38 24 42 26C46 28 48 38 48 38" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 38H50" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="22" cy="40" r="3" stroke="white" strokeWidth="2"/>
        <circle cx="42" cy="40" r="3" stroke="white" strokeWidth="2"/>
        <path d="M26 28L28 32H36L38 28" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M20 34H44" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
        <defs>
          <linearGradient id="autoGrad" x1="0" y1="0" x2="64" y2="64">
            <stop stopColor="#3B82F6"/>
            <stop offset="1" stopColor="#1D4ED8"/>
          </linearGradient>
        </defs>
      </svg>
    ),
    color: "text-blue-600",
    gradient: "from-blue-500 to-blue-700"
  },
  "Assurance Habitation": {
    icon: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <circle cx="32" cy="32" r="30" fill="url(#homeGrad)" />
        <path d="M18 32L32 20L46 32" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M22 30V44H42V30" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="28" y="36" width="8" height="8" rx="1" stroke="white" strokeWidth="2"/>
        <path d="M32 36V44" stroke="white" strokeWidth="1.5"/>
        <path d="M28 40H36" stroke="white" strokeWidth="1.5"/>
        <defs>
          <linearGradient id="homeGrad" x1="0" y1="0" x2="64" y2="64">
            <stop stopColor="#22C55E"/>
            <stop offset="1" stopColor="#15803D"/>
          </linearGradient>
        </defs>
      </svg>
    ),
    color: "text-green-600",
    gradient: "from-green-500 to-green-700"
  },
  "Assurance Santé": {
    icon: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <circle cx="32" cy="32" r="30" fill="url(#santeGrad)" />
        <path d="M32 44C32 44 18 36 18 26C18 22 21 18 25 18C28 18 30 20 32 22C34 20 36 18 39 18C43 18 46 22 46 26C46 36 32 44 32 44Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M28 28H36" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M32 24V32" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        <defs>
          <linearGradient id="santeGrad" x1="0" y1="0" x2="64" y2="64">
            <stop stopColor="#EF4444"/>
            <stop offset="1" stopColor="#B91C1C"/>
          </linearGradient>
        </defs>
      </svg>
    ),
    color: "text-red-600",
    gradient: "from-red-500 to-red-700"
  },
  "Assurance Moto": {
    icon: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <circle cx="32" cy="32" r="30" fill="url(#motoGrad)" />
        <circle cx="20" cy="40" r="5" stroke="white" strokeWidth="2.5"/>
        <circle cx="44" cy="40" r="5" stroke="white" strokeWidth="2.5"/>
        <path d="M25 40H39" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M32 40L28 28H38L42 34" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M28 28L32 22H36" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="32" cy="22" r="2" fill="white"/>
        <defs>
          <linearGradient id="motoGrad" x1="0" y1="0" x2="64" y2="64">
            <stop stopColor="#F97316"/>
            <stop offset="1" stopColor="#C2410C"/>
          </linearGradient>
        </defs>
      </svg>
    ),
    color: "text-orange-600",
    gradient: "from-orange-500 to-orange-700"
  },
  "Assurance Emprunteur": {
    icon: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <circle cx="32" cy="32" r="30" fill="url(#emprGrad)" />
        <rect x="14" y="22" width="36" height="24" rx="3" stroke="white" strokeWidth="2.5"/>
        <path d="M14 30H50" stroke="white" strokeWidth="2.5"/>
        <path d="M20 38H32" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <path d="M20 42H28" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <path d="M38 36L42 32L46 36" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M42 32V42" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <defs>
          <linearGradient id="emprGrad" x1="0" y1="0" x2="64" y2="64">
            <stop stopColor="#8B5CF6"/>
            <stop offset="1" stopColor="#6D28D9"/>
          </linearGradient>
        </defs>
      </svg>
    ),
    color: "text-purple-600",
    gradient: "from-purple-500 to-purple-700"
  },
  "Assurance Voyage": {
    icon: (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <circle cx="32" cy="32" r="30" fill="url(#voyageGrad)" />
        <path d="M18 40L32 20L46 40H18Z" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M24 36H40" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <path d="M28 32H36" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="32" cy="28" r="2" fill="white"/>
        <defs>
          <linearGradient id="voyageGrad" x1="0" y1="0" x2="64" y2="64">
            <stop stopColor="#06B6D4"/>
            <stop offset="1" stopColor="#0E7490"/>
          </linearGradient>
        </defs>
      </svg>
    ),
    color: "text-cyan-600",
    gradient: "from-cyan-500 to-cyan-700"
  }
};

const InteractiveAvatar = ({ insuranceType, isActive = false }: InteractiveAvatarProps) => {
  const config = InsuranceIcons[insuranceType] || InsuranceIcons["Assurance Auto"];

  // Label court pour l'assurance
  const getShortLabel = (type: string) => {
    const labels: Record<string, string> = {
      "Assurance Auto": "Auto",
      "Assurance Habitation": "Habitation",
      "Assurance Santé": "Santé",
      "Assurance Moto": "Moto",
      "Assurance Emprunteur": "Emprunteur",
      "Assurance Voyage": "Voyage"
    };
    return labels[type] || "Assurance";
  };

  return (
    <Card className={`relative overflow-hidden border-0 shadow-none bg-transparent transition-all duration-300 ${
      isActive ? 'ring-2 ring-blue-500/30' : ''
    }`}>
      {/* Header */}
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
        <div className="flex items-center space-x-4">
          {/* Icon */}
          <div className="relative flex-shrink-0">
            <div className={`w-16 h-16 rounded-xl overflow-hidden transition-all duration-300 ${
              isActive 
                ? 'shadow-lg shadow-blue-500/20 scale-105' 
                : ''
            }`}>
              {config.icon}
            </div>
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="space-y-1">
              <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                isActive ? 'text-blue-600' : 'text-gray-900'
              }`}>
                {getShortLabel(insuranceType)}
              </h3>
              <p className="text-sm text-gray-600 font-medium">
                Conseiller IA Expert
              </p>
            </div>
            
            {/* Status */}
            <div className="flex items-center mt-2">
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
                  {/* Audio Visualizer */}
                  <div className="flex items-end space-x-0.5 ml-3">
                    <div className="w-0.5 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
                    <div className="w-0.5 h-4 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-0.5 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    <div className="w-0.5 h-5 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }}></div>
                    <div className="w-0.5 h-3 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                  </div>
                </div>
              )}
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
