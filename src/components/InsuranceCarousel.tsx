
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Car, Home, Heart, Bike, CreditCard, Plane } from "lucide-react";

const InsuranceCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const insuranceTypes = [
    { 
      name: "Assurance Auto", 
      icon: Car, 
      description: "Protection complète pour votre véhicule",
      color: "from-blue-500 to-blue-700"
    },
    { 
      name: "Assurance Habitation", 
      icon: Home, 
      description: "Sécurisez votre logement et vos biens",
      color: "from-green-500 to-green-700"
    },
    { 
      name: "Assurance Santé", 
      icon: Heart, 
      description: "Complémentaire santé personnalisée",
      color: "from-red-500 to-red-700"
    },
    { 
      name: "Assurance Moto", 
      icon: Bike, 
      description: "Protection optimale pour deux-roues",
      color: "from-orange-500 to-orange-700"
    },
    { 
      name: "Assurance Emprunteur", 
      icon: CreditCard, 
      description: "Sécurisez votre crédit immobilier",
      color: "from-purple-500 to-purple-700"
    },
    { 
      name: "Assurance Voyage", 
      icon: Plane, 
      description: "Voyagez en toute sérénité",
      color: "from-indigo-500 to-indigo-700"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % insuranceTypes.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [insuranceTypes.length]);

  const currentInsurance = insuranceTypes[currentIndex];
  const IconComponent = currentInsurance.icon;

  return (
    <div className="w-full max-w-4xl mx-auto mb-16">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          AssuranceIA vous accompagne dans tous vos projets d'assurance
        </h2>
        <p className="text-lg text-gray-600">
          Notre intelligence artificielle spécialisée analyse vos besoins pour vous proposer les meilleures solutions
        </p>
      </div>
      
      <Card className="relative overflow-hidden shadow-xl min-h-[200px] transition-all duration-500">
        <div className={`absolute inset-0 bg-gradient-to-r ${currentInsurance.color} opacity-10`}></div>
        <CardContent className="relative z-10 p-8 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className={`inline-flex p-4 rounded-full bg-gradient-to-r ${currentInsurance.color} text-white shadow-lg`}>
              <IconComponent className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{currentInsurance.name}</h3>
            <p className="text-gray-600 text-lg">{currentInsurance.description}</p>
            <div className="flex justify-center space-x-2 mt-6">
              {insuranceTypes.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentIndex ? 'bg-blue-600 scale-125' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InsuranceCarousel;
