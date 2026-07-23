
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Phone, Mail, MapPin, Car, Home, Heart, Bike, CreditCard, Plane, Check, Edit3 } from "lucide-react";

interface ProspectData {
  nom?: string;
  prenom?: string;
  dateNaissance?: string;
  adresse?: string;
  codePostal?: string;
  email?: string;
  telephone?: string;
  marque?: string;
  modele?: string;
  annee?: string;
  carburant?: string;
  usage?: string;
  bonusMalus?: string;
  typeLogement?: string;
  superficie?: string;
  nbPieces?: string;
  anneeConstruction?: string;
  destination?: string;
  datesSejour?: string;
  motifVoyage?: string;
  montantPret?: string;
  dureePret?: string;
  situationPro?: string;
  [key: string]: any;
}

interface ProspectSummaryProps {
  insuranceType: string;
  data: ProspectData;
  onValidate: () => void;
  onModify: () => void;
}

const ProspectSummary = ({ insuranceType, data, onValidate, onModify }: ProspectSummaryProps) => {
  const getIcon = () => {
    switch (insuranceType) {
      case "Assurance Auto": return <Car className="w-6 h-6" />;
      case "Assurance Habitation": return <Home className="w-6 h-6" />;
      case "Assurance Santé": return <Heart className="w-6 h-6" />;
      case "Assurance Moto": return <Bike className="w-6 h-6" />;
      case "Assurance Emprunteur": return <CreditCard className="w-6 h-6" />;
      case "Assurance Voyage": return <Plane className="w-6 h-6" />;
      default: return <User className="w-6 h-6" />;
    }
  };

  const getColor = () => {
    switch (insuranceType) {
      case "Assurance Auto": return "bg-blue-500";
      case "Assurance Habitation": return "bg-green-500";
      case "Assurance Santé": return "bg-red-500";
      case "Assurance Moto": return "bg-orange-500";
      case "Assurance Emprunteur": return "bg-purple-500";
      case "Assurance Voyage": return "bg-cyan-500";
      default: return "bg-gray-500";
    }
  };

  const renderPersonalInfo = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-gray-700">
        <User className="w-4 h-4" />
        <span className="font-medium">Informations personnelles</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-6">
        {data.nom && (
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Nom</span>
            <span className="font-medium">{data.nom}</span>
          </div>
        )}
        {data.prenom && (
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Prénom</span>
            <span className="font-medium">{data.prenom}</span>
          </div>
        )}
        {data.dateNaissance && (
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Date de naissance</span>
            <span className="font-medium">{data.dateNaissance}</span>
          </div>
        )}
      </div>
    </div>
  );

  const renderContactInfo = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-gray-700">
        <Phone className="w-4 h-4" />
        <span className="font-medium">Contact</span>
      </div>
      <div className="grid grid-cols-1 gap-3 ml-6">
        {data.telephone && (
          <div className="flex items-center gap-2">
            <Phone className="w-3 h-3 text-gray-400" />
            <span className="font-medium">{data.telephone}</span>
          </div>
        )}
        {data.email && (
          <div className="flex items-center gap-2">
            <Mail className="w-3 h-3 text-gray-400" />
            <span className="font-medium">{data.email}</span>
          </div>
        )}
        {data.adresse && (
          <div className="flex items-center gap-2">
            <MapPin className="w-3 h-3 text-gray-400" />
            <span className="font-medium">{data.adresse} {data.codePostal}</span>
          </div>
        )}
      </div>
    </div>
  );

  const renderSpecificInfo = () => {
    switch (insuranceType) {
      case "Assurance Auto":
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-700">
              <Car className="w-4 h-4" />
              <span className="font-medium">Véhicule</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-6">
              {data.marque && (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Marque</span>
                  <span className="font-medium">{data.marque}</span>
                </div>
              )}
              {data.modele && (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Modèle</span>
                  <span className="font-medium">{data.modele}</span>
                </div>
              )}
              {data.annee && (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Année</span>
                  <span className="font-medium">{data.annee}</span>
                </div>
              )}
              {data.carburant && (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Carburant</span>
                  <span className="font-medium">{data.carburant}</span>
                </div>
              )}
              {data.usage && (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Usage</span>
                  <Badge variant="outline">{data.usage}</Badge>
                </div>
              )}
              {data.bonusMalus && (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Bonus/Malus</span>
                  <span className="font-medium">{data.bonusMalus}</span>
                </div>
              )}
            </div>
          </div>
        );

      case "Assurance Habitation":
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-700">
              <Home className="w-4 h-4" />
              <span className="font-medium">Logement</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-6">
              {data.typeLogement && (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Type</span>
                  <Badge variant="outline">{data.typeLogement}</Badge>
                </div>
              )}
              {data.superficie && (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Superficie</span>
                  <span className="font-medium">{data.superficie} m²</span>
                </div>
              )}
              {data.nbPieces && (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Pièces</span>
                  <span className="font-medium">{data.nbPieces}</span>
                </div>
              )}
              {data.anneeConstruction && (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Année construction</span>
                  <span className="font-medium">{data.anneeConstruction}</span>
                </div>
              )}
            </div>
          </div>
        );

      case "Assurance Voyage":
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-700">
              <Plane className="w-4 h-4" />
              <span className="font-medium">Voyage</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-6">
              {data.destination && (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Destination</span>
                  <span className="font-medium">{data.destination}</span>
                </div>
              )}
              {data.datesSejour && (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Dates</span>
                  <span className="font-medium">{data.datesSejour}</span>
                </div>
              )}
              {data.motifVoyage && (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Motif</span>
                  <Badge variant="outline">{data.motifVoyage}</Badge>
                </div>
              )}
            </div>
          </div>
        );

      case "Assurance Emprunteur":
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-700">
              <CreditCard className="w-4 h-4" />
              <span className="font-medium">Emprunt</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-6">
              {data.montantPret && (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Montant</span>
                  <span className="font-medium">{data.montantPret}</span>
                </div>
              )}
              {data.dureePret && (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Durée</span>
                  <span className="font-medium">{data.dureePret}</span>
                </div>
              )}
              {data.situationPro && (
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 uppercase tracking-wide">Situation pro</span>
                  <Badge variant="outline">{data.situationPro}</Badge>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="shadow-lg border-0 bg-white">
      <CardHeader className={`${getColor()} text-white`}>
        <CardTitle className="flex items-center gap-3">
          {getIcon()}
          <div>
            <h3 className="text-xl font-bold">Récapitulatif de votre demande</h3>
            <p className="text-sm opacity-90">{insuranceType}</p>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {renderPersonalInfo()}
        <div className="border-t pt-4">
          {renderContactInfo()}
        </div>
        {renderSpecificInfo() && (
          <div className="border-t pt-4">
            {renderSpecificInfo()}
          </div>
        )}
        
        <div className="border-t pt-6">
          <div className="flex flex-col sm:flex-row gap-3 justify-end">
            <Button
              variant="outline"
              onClick={onModify}
              className="flex items-center gap-2 hover:bg-gray-50"
            >
              <Edit3 className="w-4 h-4" />
              Modifier les informations
            </Button>
            <Button
              onClick={onValidate}
              className={`${getColor()} hover:opacity-90 flex items-center gap-2 text-white`}
            >
              <Check className="w-4 h-4" />
              Valider et continuer
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProspectSummary;
