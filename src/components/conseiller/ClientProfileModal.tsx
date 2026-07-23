import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Phone, Mail, MapPin, Calendar, FileText, X, Edit } from "lucide-react";
import { toast } from "sonner";
interface Client {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse_complete: string;
  type_assurance: string;
  statut: string;
  date_creation: string;
  date_contact?: string;
  code_postal?: string;
  date_naissance?: string;
  notes_conseiller?: string;
}
interface ClientProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onEdit?: () => void;
}
export const ClientProfileModal = ({
  isOpen,
  onClose,
  client,
  onEdit
}: ClientProfileModalProps) => {
  if (!client) return null;
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  const formatDateOnly = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "termine":
        return <Badge className="bg-green-100 text-green-800">Client Actif</Badge>;
      case "en_cours":
        return <Badge className="bg-blue-100 text-blue-800">Prospect</Badge>;
      case "nouveau":
        return <Badge variant="secondary">Nouveau Contact</Badge>;
      default:
        return <Badge>{statut}</Badge>;
    }
  };
  const handleEdit = () => {
    toast.success("Fonction d'édition à implémenter");
    if (onEdit) onEdit();
  };
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Profil Client
            </div>
            
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* En-tête du profil */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h2 className="text-xl font-semibold">{client.nom} {client.prenom}</h2>
              <div className="flex items-center gap-2 mt-1">
                {getStatutBadge(client.statut)}
                <Badge variant="outline">{client.type_assurance}</Badge>
              </div>
            </div>
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
          </div>

          {/* Informations de contact */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Informations de contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {client.email && <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{client.email}</p>
                  </div>
                </div>}
              
              {client.telephone && <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Téléphone</p>
                    <p className="font-medium">{client.telephone}</p>
                  </div>
                </div>}
              
              {client.adresse_complete && <div className="flex items-center gap-3 p-3 border rounded-lg md:col-span-2">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Adresse</p>
                    <p className="font-medium">{client.adresse_complete}</p>
                    {client.code_postal && <p className="text-sm text-gray-600">{client.code_postal}</p>}
                  </div>
                </div>}
            </div>
          </div>

          {/* Informations personnelles */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Informations personnelles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {client.date_naissance && <div className="p-3 border rounded-lg">
                  <p className="text-sm text-gray-500">Date de naissance</p>
                  <p className="font-medium">{formatDateOnly(client.date_naissance)}</p>
                </div>}
              
              <div className="p-3 border rounded-lg">
                <p className="text-sm text-gray-500">Type d'assurance</p>
                <p className="font-medium capitalize">{client.type_assurance}</p>
              </div>
            </div>
          </div>

          {/* Historique */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Historique</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Client depuis</p>
                  <p className="font-medium">{formatDate(client.date_creation)}</p>
                </div>
              </div>
              
              {client.date_contact && <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Dernier contact</p>
                    <p className="font-medium">{formatDate(client.date_contact)}</p>
                  </div>
                </div>}
            </div>
          </div>

          {/* Notes */}
          {client.notes_conseiller && <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Notes du conseiller
              </h3>
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm">{client.notes_conseiller}</p>
              </div>
            </div>}

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Fermer
            </Button>
            <Button onClick={handleEdit} className="flex-1">
              <Edit className="w-4 h-4 mr-2" />
              Modifier le profil
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
};