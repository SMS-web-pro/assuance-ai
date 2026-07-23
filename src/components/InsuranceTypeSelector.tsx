
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface InsuranceTypeSelectorProps {
  onSelect: (type: string) => void;
}

const InsuranceTypeSelector = ({ onSelect }: InsuranceTypeSelectorProps) => {
  const insuranceTypes = [
    {
      id: "auto",
      title: "Assurance Auto",
      description: "Véhicules personnels et professionnels",
      icon: "🚗",
    },
    {
      id: "habitation",
      title: "Assurance Habitation",
      description: "Résidence principale ou secondaire",
      icon: "🏠",
    },
    {
      id: "santé",
      title: "Assurance Santé",
      description: "Complémentaire santé et mutuelle",
      icon: "🩺",
    },
    {
      id: "moto",
      title: "Assurance Moto",
      description: "Motos, scooters et deux-roues",
      icon: "🏍️",
    },
    {
      id: "emprunteur",
      title: "Assurance Emprunteur",
      description: "Crédit immobilier et consommation",
      icon: "🏦",
    },
    {
      id: "voyage",
      title: "Assurance Voyage",
      description: "Voyages d'affaires et tourisme",
      icon: "✈️",
    },
  ];

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {insuranceTypes.map((type) => (
        <Card
          key={type.id}
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => onSelect(type.title)}
        >
          <CardHeader className="text-center">
            <div className="text-4xl mb-2">{type.icon}</div>
            <CardTitle className="text-xl">{type.title}</CardTitle>
            <CardDescription>{type.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              Commencer le devis
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default InsuranceTypeSelector;
