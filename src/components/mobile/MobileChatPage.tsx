
import { Card, CardContent } from "@/components/ui/card";
import ChatInterface from "@/components/ChatInterface";
import MobileHeroSection from "./MobileHeroSection";

interface MobileChatPageProps {
  insuranceType: string;
}

const MobileChatPage = ({ insuranceType }: MobileChatPageProps) => {
  const getInsuranceInfo = (type: string) => {
    const descriptions = {
      'Assurance Auto': {
        title: 'Votre Assurance Auto sur-mesure',
        description: 'Protégez votre véhicule avec une couverture adaptée à vos besoins spécifiques.'
      },
      'Assurance Habitation': {
        title: 'Votre Assurance Habitation idéale',
        description: 'Sécurisez votre logement et vos biens personnels efficacement.'
      },
      'Assurance Santé': {
        title: 'Votre Complémentaire Santé optimale',
        description: 'Trouvez la mutuelle santé qui vous convient parfaitement.'
      },
      'Assurance Moto': {
        title: 'Votre Assurance Moto adaptée',
        description: 'Protection complète pour votre deux-roues et vos trajets.'
      },
      'Assurance Emprunteur': {
        title: 'Votre Assurance Emprunteur sécurisée',
        description: 'Protégez votre crédit immobilier avec la bonne assurance.'
      },
      'Assurance Voyage': {
        title: 'Votre Assurance Voyage complète',
        description: 'Voyagez en toute sérénité avec une protection adaptée.'
      }
    };
    return descriptions[type as keyof typeof descriptions] || {
      title: 'Votre Conseiller Assurance IA',
      description: 'Obtenez un devis personnalisé rapidement.'
    };
  };

  const info = getInsuranceInfo(insuranceType);

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeroSection 
        title={info.title}
        description={info.description}
      />
      
      <div className="px-4 py-6">
        <Card className="shadow-xl">
          <CardContent className="p-0">
            <ChatInterface insuranceType={insuranceType} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MobileChatPage;
