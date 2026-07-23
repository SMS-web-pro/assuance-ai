
import { MessageCircle, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

interface MobileHeroSectionProps {
  title: string;
  description: string;
}

const MobileHeroSection = ({ title, description }: MobileHeroSectionProps) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-700 text-white px-4 pt-8 pb-16">
      {/* Décoration de fond */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0dGVybiBpZD0icGF0dGVybiIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIHNjYWxlKDAuNSkiPjxyZWN0IHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PHJlY3QgZmlsbD0idXJsKCNwYXR0ZXJuKSIgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIvPjwvc3ZnPg==')]" />
      </div>
      
      {/* Header avec logo */}
      <div className="relative z-10 flex justify-between items-center mb-8">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-blue-600" />
          </div>
          <span className="text-xl font-bold text-white">AssureIA</span>
        </Link>
      </div>

      {/* Contenu principal */}
      <div className="relative z-10 max-w-md mx-auto text-center">
        <div className="inline-flex items-center space-x-2 mb-4 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
          <Sparkles className="w-4 h-4 text-yellow-300" />
          <span className="text-sm font-medium text-yellow-100">Nouveau : Assistant IA</span>
        </div>
        
        <h1 className="text-3xl font-bold mb-4 leading-tight">
          {title}
        </h1>
        
        <p className="text-blue-100 mb-6 text-lg leading-relaxed">
          {description}
        </p>
        
        <div className="mt-8">
          {/* Navigation simplifiée */}
          <div className="text-center">
            <p className="text-blue-100 text-sm">Faites défiler pour découvrir nos services</p>
          </div>
        </div>
      </div>
      
      {/* Ondulation décorative en bas */}
      <div className="absolute bottom-0 left-0 right-0 h-8 bg-white rounded-t-3xl"></div>
    </div>
  );
};

export default MobileHeroSection;
