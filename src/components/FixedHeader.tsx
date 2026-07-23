import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import NotificationBar from "./NotificationBar";
import AdminChat from "./admin/AdminChat";
import HomeInsuranceCarousel from "./HomeInsuranceCarousel";

const FixedHeader = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const location = useLocation();
  
  // Vérifier si on est sur la page d'accueil ou sur les pages légales du footer
  const legalPages = ['/terms', '/privacy', '/legal', '/cookies'];
  const isHomeOrLegalPage = location.pathname === "/" || location.pathname === "/prospect" || legalPages.includes(location.pathname);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentDate = currentTime.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const currentTimeString = currentTime.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Afficher le carrousel sur les pages d'accueil et légales, AdminChat sur les autres pages */}
        <div className="flex items-center">
          {isHomeOrLegalPage ? <HomeInsuranceCarousel /> : <AdminChat />}
        </div>
        
        <div className="flex-1 max-w-2xl mx-4">
          <NotificationBar />
        </div>

        <div className="text-sm text-muted-foreground flex flex-col items-end whitespace-nowrap">
          <div className="capitalize">{currentDate}</div>
          <div className="font-mono">{currentTimeString}</div>
        </div>
      </div>
    </header>
  );
};

export default FixedHeader;
