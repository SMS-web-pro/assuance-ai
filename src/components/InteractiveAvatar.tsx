
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { User, Car, Home, Heart, Bike, CreditCard, Plane } from "lucide-react";

interface InteractiveAvatarProps {
  insuranceType: string;
  isActive?: boolean;
}

const InteractiveAvatar = ({ insuranceType, isActive = false }: InteractiveAvatarProps) => {
  const getAvatarConfig = (type: string) => {
    const configs = {
      "Assurance Auto": {
        name: "Marc Dubois",
        role: "Conseiller Automobile",
        avatar: "/lovable-uploads/71514e7c-ff12-47c3-9f19-0df886f04abe.png",
        fallback: "MD",
        icon: Car,
        color: "bg-blue-100 text-blue-700 border-blue-200",
        activeColor: "bg-blue-500 text-white"
      },
      "Assurance Habitation": {
        name: "Sophie Martin",
        role: "Conseillère Habitation",
        avatar: "/lovable-uploads/9074a12f-55ed-4a79-8608-391e4432dec3.png",
        fallback: "SM",
        icon: Home,
        color: "bg-green-100 text-green-700 border-green-200",
        activeColor: "bg-green-500 text-white"
      },
      "Assurance Santé": {
        name: "Claire Rousseau",
        role: "Conseillère Santé",
        avatar: "/lovable-uploads/5739b05d-801b-4035-91fc-6c7db9c29643.png",
        fallback: "CR",
        icon: Heart,
        color: "bg-red-100 text-red-700 border-red-200",
        activeColor: "bg-red-500 text-white"
      },
      "Assurance Moto": {
        name: "Alex Moreau",
        role: "Conseiller Moto",
        avatar: "/lovable-uploads/fda4fd95-ab93-4606-baae-cb1bb587b483.png",
        fallback: "AM",
        icon: Bike,
        color: "bg-orange-100 text-orange-700 border-orange-200",
        activeColor: "bg-orange-500 text-white"
      },
      "Assurance Emprunteur": {
        name: "Pierre Delacroix",
        role: "Conseiller Emprunteur",
        avatar: "/lovable-uploads/ca4074b7-d454-4607-91cd-f091bad68147.png",
        fallback: "PD",
        icon: CreditCard,
        color: "bg-purple-100 text-purple-700 border-purple-200",
        activeColor: "bg-purple-500 text-white"
      },
      "Assurance Voyage": {
        name: "Camille Durand",
        role: "Conseillère Voyage",
        avatar: "/lovable-uploads/d3cece80-7607-4031-a6a6-fa5f48dc4c5e.png",
        fallback: "CD",
        icon: Plane,
        color: "bg-teal-100 text-teal-700 border-teal-200",
        activeColor: "bg-teal-500 text-white"
      }
    };
    
    return configs[type as keyof typeof configs] || {
      name: "Conseiller",
      role: "Expert Assurance",
      avatar: "/lovable-uploads/71514e7c-ff12-47c3-9f19-0df886f04abe.png",
      fallback: "AI",
      icon: User,
      color: "bg-gray-100 text-gray-700 border-gray-200",
      activeColor: "bg-gray-500 text-white"
    };
  };

  const config = getAvatarConfig(insuranceType);
  const IconComponent = config.icon;

  return (
    <Card className={`relative overflow-hidden border-0 shadow-none bg-transparent transition-all duration-300 ${
      isActive ? 'ring-2 ring-blue-500/30' : ''
    }`}>
      {/* Professional Header Section */}
      <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Conseiller en ligne</span>
          </div>
          {isActive && (
            <Badge className="bg-green-500 text-white px-2 py-1 text-xs font-medium">
              🎙️ En conversation
            </Badge>
          )}
        </div>
      </div>

      {/* Main Content Section */}
      <div className="px-6 py-5 bg-white">
        <div className="flex items-start space-x-4">
          {/* Avatar Section */}
          <div className="relative flex-shrink-0">
            <div className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
              isActive 
                ? 'border-blue-500 shadow-md shadow-blue-500/20' 
                : 'border-gray-200'
            }`}>
              <Avatar className="w-full h-full">
                <AvatarImage 
                  src={config.avatar} 
                  alt={config.name}
                  className="object-cover w-full h-full"
                />
                <AvatarFallback className={`text-sm font-semibold ${isActive ? config.activeColor : config.color}`}>
                  {config.fallback}
                </AvatarFallback>
              </Avatar>
            </div>
            
            {/* Specialty Icon */}
            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-lg flex items-center justify-center ${
              isActive ? config.activeColor : config.color
            } border-2 border-white shadow-sm transition-all duration-300`}>
              <IconComponent className="w-3 h-3" />
            </div>
          </div>
          
          {/* Information Section */}
          <div className="flex-1 min-w-0">
            <div className="space-y-2">
              <div>
                <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                  isActive ? 'text-blue-600' : 'text-gray-900'
                }`}>
                  {config.name}
                </h3>
                <p className="text-sm text-gray-600 font-medium">
                  {config.role}
                </p>
              </div>
              
              {/* Status and Actions */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center space-x-2">
                  {!isActive ? (
                    <Badge variant="outline" className="text-xs px-2 py-1 border-green-200 text-green-700 bg-green-50">
                      ● Disponible
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

      {/* Professional Footer */}
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
