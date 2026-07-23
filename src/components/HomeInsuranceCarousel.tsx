
import { useEffect, useState } from "react";
import { Car, Home, Heart, Bike, CreditCard, Plane } from "lucide-react";

const HomeInsuranceCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const insuranceInProgress = [
    { 
      name: "Assurance Auto", 
      icon: Car, 
      status: "3 devis en cours",
      color: "text-blue-600"
    },
    { 
      name: "Assurance Habitation", 
      icon: Home, 
      status: "2 demandes actives",
      color: "text-green-600"
    },
    { 
      name: "Assurance Santé", 
      icon: Heart, 
      status: "5 consultations IA",
      color: "text-red-600"
    },
    { 
      name: "Assurance Moto", 
      icon: Bike, 
      status: "1 devis personnalisé",
      color: "text-orange-600"
    },
    { 
      name: "Assurance Emprunteur", 
      icon: CreditCard, 
      status: "4 analyses en cours",
      color: "text-purple-600"
    },
    { 
      name: "Assurance Voyage", 
      icon: Plane, 
      status: "2 devis voyage",
      color: "text-indigo-600"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % insuranceInProgress.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [insuranceInProgress.length]);

  const currentInsurance = insuranceInProgress[currentIndex];
  const IconComponent = currentInsurance.icon;

  return (
    <div className="flex items-center justify-center gap-3">
      <div className={`${currentInsurance.color} transition-all duration-500`}>
        <IconComponent className="w-8 h-8 animate-pulse" />
      </div>
      <div className="text-center">
        <div className="text-xs font-medium text-gray-800 leading-tight">
          {currentInsurance.name}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {currentInsurance.status}
        </div>
      </div>
    </div>
  );
};

export default HomeInsuranceCarousel;
