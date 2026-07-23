
import { useEffect, useState } from "react";
import { Car, Home, Heart, Bike, CreditCard, Plane } from "lucide-react";

const HeaderInsuranceCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const insuranceTypes = [
    { 
      name: "Assurance Auto", 
      icon: Car, 
      description: "Protection complète pour votre véhicule avec AssuranceIA",
      color: "text-blue-600"
    },
    { 
      name: "Assurance Habitation", 
      icon: Home, 
      description: "Sécurisez votre logement avec AssuranceIA",
      color: "text-green-600"
    },
    { 
      name: "Assurance Santé", 
      icon: Heart, 
      description: "Complémentaire santé personnalisée par AssuranceIA",
      color: "text-red-600"
    },
    { 
      name: "Assurance Moto", 
      icon: Bike, 
      description: "Protection optimale deux-roues avec AssuranceIA",
      color: "text-orange-600"
    },
    { 
      name: "Assurance Emprunteur", 
      icon: CreditCard, 
      description: "Sécurisez votre crédit avec AssuranceIA",
      color: "text-purple-600"
    },
    { 
      name: "Assurance Voyage", 
      icon: Plane, 
      description: "Voyagez sereinement avec AssuranceIA",
      color: "text-indigo-600"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % insuranceTypes.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [insuranceTypes.length]);

  const currentInsurance = insuranceTypes[currentIndex];
  const IconComponent = currentInsurance.icon;

  return (
    <div className="text-sm text-center relative overflow-hidden">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-1 rounded-lg transition-all duration-500">
        <div className={`${currentInsurance.color} font-medium flex items-center justify-center gap-2`}>
          <IconComponent className="h-4 w-4 animate-pulse" />
          <span className="animate-fade-in">{currentInsurance.description}</span>
        </div>
      </div>
      
      {/* Indicateur de progression */}
      <div className="flex justify-center mt-1 gap-1">
        {insuranceTypes.map((_, index) => (
          <div
            key={index}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              index === currentIndex ? 'bg-primary' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeaderInsuranceCarousel;
