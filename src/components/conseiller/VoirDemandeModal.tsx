
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Mail, Phone, FileText, Calendar, MapPin, Car, Home, Heart, Bike, CreditCard, Plane } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Demande {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  type_assurance: string;
  statut: string;
  priorite: string;
  date_creation: string;
  conseiller_assigne: string;
  date_naissance?: string;
  adresse_complete?: string;
  code_postal?: string;
}

interface VoirDemandeModalProps {
  isOpen: boolean;
  onClose: () => void;
  demande: Demande | null;
  onDemandeUpdate: () => void;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'auto': return Car;
    case 'habitation': return Home;
    case 'sante': return Heart;
    case 'moto': return Bike;
    case 'emprunteur': return CreditCard;
    case 'voyage': return Plane;
    default: return FileText;
  }
};

export const VoirDemandeModal = ({ isOpen, onClose, demande, onDemandeUpdate }: VoirDemandeModalProps) => {
  const [specificData, setSpecificData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchSpecificData = async (demandeId: string, typeAssurance: string) => {
    setLoading(true);
    try {
      let data = null;
      let error = null;

      // Utiliser des requêtes spécifiques au lieu d'une variable dynamique
      switch (typeAssurance) {
        case 'auto':
          const autoResult = await supabase
            .from('assurance_auto')
            .select('*')
            .eq('demande_id', demandeId)
            .single();
          data = autoResult.data;
          error = autoResult.error;
          break;
        case 'habitation':
          const habitationResult = await supabase
            .from('assurance_habitation')
            .select('*')
            .eq('demande_id', demandeId)
            .single();
          data = habitationResult.data;
          error = habitationResult.error;
          break;
        case 'sante':
          const santeResult = await supabase
            .from('assurance_sante')
            .select('*')
            .eq('demande_id', demandeId)
            .single();
          data = santeResult.data;
          error = santeResult.error;
          break;
        case 'moto':
          const motoResult = await supabase
            .from('assurance_moto')
            .select('*')
            .eq('demande_id', demandeId)
            .single();
          data = motoResult.data;
          error = motoResult.error;
          break;
        case 'emprunteur':
          const emprunteurResult = await supabase
            .from('assurance_emprunteur')
            .select('*')
            .eq('demande_id', demandeId)
            .single();
          data = emprunteurResult.data;
          error = emprunteurResult.error;
          break;
        case 'voyage':
          const voyageResult = await supabase
            .from('assurance_voyage')
            .select('*')
            .eq('demande_id', demandeId)
            .single();
          data = voyageResult.data;
          error = voyageResult.error;
          break;
        default:
          console.log('Type d\'assurance non supporté:', typeAssurance);
          return;
      }

      if (error) {
        console.error('Erreur lors de la récupération des données spécifiques:', error);
        return;
      }

      setSpecificData(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const renderSpecificData = () => {
    if (!specificData) return null;

    switch (demande?.type_assurance) {
      case 'auto':
        return (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-gray-700">Informations véhicule</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {specificData.marque_vehicule && (
                <div><span className="font-medium">Marque:</span> {specificData.marque_vehicule}</div>
              )}
              {specificData.modele_vehicule && (
                <div><span className="font-medium">Modèle:</span> {specificData.modele_vehicule}</div>
              )}
              {specificData.annee_circulation && (
                <div><span className="font-medium">Année:</span> {specificData.annee_circulation}</div>
              )}
              {specificData.type_carburant && (
                <div><span className="font-medium">Carburant:</span> {specificData.type_carburant}</div>
              )}
              {specificData.usage_vehicule && (
                <div><span className="font-medium">Usage:</span> {specificData.usage_vehicule}</div>
              )}
              {specificData.bonus_malus && (
                <div><span className="font-medium">Bonus/Malus:</span> {specificData.bonus_malus}</div>
              )}
            </div>
          </div>
        );
      case 'habitation':
        return (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-gray-700">Informations logement</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {specificData.type_logement && (
                <div><span className="font-medium">Type:</span> {specificData.type_logement}</div>
              )}
              {specificData.superficie_m2 && (
                <div><span className="font-medium">Superficie:</span> {specificData.superficie_m2} m²</div>
              )}
              {specificData.nombre_pieces && (
                <div><span className="font-medium">Pièces:</span> {specificData.nombre_pieces}</div>
              )}
              {specificData.annee_construction && (
                <div><span className="font-medium">Année construction:</span> {specificData.annee_construction}</div>
              )}
              {specificData.valeur_biens_euros && (
                <div><span className="font-medium">Valeur biens:</span> {specificData.valeur_biens_euros} €</div>
              )}
            </div>
          </div>
        );
      default:
        return (
          <div className="text-sm text-gray-600">
            Données spécifiques disponibles pour ce type d'assurance.
          </div>
        );
    }
  };

  if (!demande) return null;

  const TypeIcon = getTypeIcon(demande.type_assurance);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TypeIcon className="w-5 h-5" />
            Détails de la demande - {demande.type_assurance}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations client */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <User className="w-4 h-4" />
              Informations client
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Nom complet:</span>
                <p>{demande.nom} {demande.prenom}</p>
              </div>
              <div>
                <span className="font-medium">Email:</span>
                <p className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {demande.email}
                </p>
              </div>
              <div>
                <span className="font-medium">Téléphone:</span>
                <p className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {demande.telephone}
                </p>
              </div>
              <div>
                <span className="font-medium">Date de création:</span>
                <p className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(demande.date_creation)}
                </p>
              </div>
              {demande.date_naissance && (
                <div>
                  <span className="font-medium">Date de naissance:</span>
                  <p>{formatDate(demande.date_naissance)}</p>
                </div>
              )}
              {demande.adresse_complete && (
                <div className="col-span-2">
                  <span className="font-medium">Adresse:</span>
                  <p className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {demande.adresse_complete} {demande.code_postal}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Statut et priorité */}
          <div className="flex gap-4">
            <div>
              <span className="font-medium text-sm">Statut:</span>
              <div className="mt-1">
                {demande.statut === "nouveau" && <Badge variant="secondary">Nouveau</Badge>}
                {demande.statut === "en cours" && <Badge className="bg-orange-100 text-orange-800">En cours</Badge>}
                {demande.statut === "termine" && <Badge className="bg-green-100 text-green-800">Terminé</Badge>}
              </div>
            </div>
            <div>
              <span className="font-medium text-sm">Priorité:</span>
              <div className="mt-1">
                {(demande.priorite === "haute" || demande.priorite === "urgent") && <Badge variant="destructive">{demande.priorite}</Badge>}
                {demande.priorite === "normale" && <Badge variant="outline">{demande.priorite}</Badge>}
                {demande.priorite === "basse" && <Badge className="bg-gray-100 text-gray-600">{demande.priorite}</Badge>}
              </div>
            </div>
          </div>

          {/* Bouton pour charger les données spécifiques */}
          {!specificData && (
            <Button 
              onClick={() => fetchSpecificData(demande.id, demande.type_assurance)}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? "Chargement..." : "Afficher les détails spécifiques"}
            </Button>
          )}

          {/* Données spécifiques */}
          {specificData && renderSpecificData()}
        </div>
      </DialogContent>
    </Dialog>
  );
};
