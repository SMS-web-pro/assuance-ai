
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { User, CheckCircle, XCircle, Clock, Eye, Phone, Mail, Calendar, FileText, UserPlus, Archive, MessageSquare, Users, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { VoirDemandeModal } from "./VoirDemandeModal";
import ClientDetailsCard from "../admin/ClientDetailsCard";
import ScheduleReminderModal from "../admin/ScheduleReminderModal";
import DevisGenerationModal from "../admin/DevisGenerationModal";
import AdvancedEmailModal from "../admin/AdvancedEmailModal";
import EditClientModal from "../admin/EditClientModal";

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
  notes_conseiller?: string;
  adresse_complete?: string;
  code_postal?: string;
  date_naissance?: string;
  date_contact?: string;
}

interface TraiterDemandeModalProps {
  isOpen: boolean;
  onClose: () => void;
  demande: Demande | null;
  onDemandeUpdate: () => void;
}

export const TraiterDemandeModal = ({ isOpen, onClose, demande, onDemandeUpdate }: TraiterDemandeModalProps) => {
  const [newStatut, setNewStatut] = useState<string>("");
  const [newPriorite, setNewPriorite] = useState<string>("");
  const [commentaire, setCommentaire] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [devisModalOpen, setDevisModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [editClientModalOpen, setEditClientModalOpen] = useState(false);

  const handleSubmit = async () => {
    if (!demande) return;

    setLoading(true);
    try {
      const updates: any = {};
      
      if (newStatut) updates.statut = newStatut;
      if (newPriorite) updates.priorite = newPriorite;
      if (commentaire.trim()) updates.notes_conseiller = commentaire;

      const { error } = await supabase
        .from('demandes_assurance')
        .update(updates)
        .eq('id', demande.id);

      if (error) {
        console.error('Erreur lors de la mise à jour:', error);
        toast.error('Erreur lors de la mise à jour de la demande');
        return;
      }

      toast.success('Demande mise à jour avec succès');
      onDemandeUpdate();
      onClose();
      
      // Reset form
      setNewStatut("");
      setNewPriorite("");
      setCommentaire("");
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du traitement de la demande');
    } finally {
      setLoading(false);
    }
  };

  // Fonctions exactes du panel admin
  const handleViewDetails = (demande: any) => {
    setIsDetailsOpen(true);
  };

  const handleEditClient = (demande: any) => {
    setEditClientModalOpen(true);
  };

  const handleCallClient = (demande: any) => {
    if (demande.telephone) {
      window.open(`tel:${demande.telephone}`);
      toast.success(`Appel vers ${demande.nom} ${demande.prenom}`);
      updateContactDate();
    } else {
      toast.error("Aucun numéro de téléphone disponible");
    }
  };

  const handleEmailClient = (demande: any) => {
    setEmailModalOpen(true);
  };

  const handleGenerateQuote = (demande: any) => {
    setDevisModalOpen(true);
  };

  const handleScheduleCallback = (demande: any) => {
    setReminderModalOpen(true);
  };

  const handleReminderCreated = () => {
    toast.success(`Rappel programmé pour ${demande?.nom} ${demande?.prenom}`);
    setReminderModalOpen(false);
  };

  const handleClientUpdated = () => {
    onDemandeUpdate();
    setEditClientModalOpen(false);
  };

  const handleArchiveDemande = async (demandeId: string) => {
    try {
      const { error } = await supabase
        .from('demandes_assurance')
        .update({ statut: 'archive' })
        .eq('id', demandeId);

      if (error) throw error;
      toast.success("Demande archivée");
      onDemandeUpdate();
      onClose();
    } catch (error) {
      console.error('Error archiving demande:', error);
      toast.error("Erreur lors de l'archivage");
    }
  };

  const updateContactDate = async () => {
    if (!demande) return;
    
    try {
      await supabase
        .from('demandes_assurance')
        .update({ date_contact: new Date().toISOString() })
        .eq('id', demande.id);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la date de contact:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!demande) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Traiter la demande
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Résumé de la demande */}
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <h3 className="font-semibold">{demande.nom} {demande.prenom}</h3>
              <p className="text-sm text-gray-600">{demande.type_assurance}</p>
              <p className="text-xs text-gray-500">Créée le {formatDate(demande.date_creation)}</p>
              
              <div className="flex gap-2 mt-2">
                <div>
                  {demande.statut === "nouveau" && <Badge variant="secondary">Nouveau</Badge>}
                  {demande.statut === "en_cours" && <Badge className="bg-orange-100 text-orange-800">En cours</Badge>}
                  {demande.statut === "traite" && <Badge className="bg-green-100 text-green-800">Traité</Badge>}
                  {demande.statut === "termine" && <Badge className="bg-purple-100 text-purple-800">Terminé</Badge>}
                </div>
                <div>
                  {(demande.priorite === "haute" || demande.priorite === "urgent") && <Badge variant="destructive">{demande.priorite}</Badge>}
                  {demande.priorite === "normale" && <Badge variant="outline">{demande.priorite}</Badge>}
                  {demande.priorite === "basse" && <Badge className="bg-gray-100 text-gray-600">{demande.priorite}</Badge>}
                </div>
              </div>
            </div>

            {/* Actions rapides - exactement comme dans le panel admin */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Actions rapides</label>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" onClick={() => handleViewDetails(demande)}>
                  <Eye className="w-3 h-3 mr-1" />
                  Voir
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleEditClient(demande)}>
                  <UserPlus className="w-3 h-3 mr-1" />
                  Client
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleCallClient(demande)}>
                  <Phone className="w-3 h-3 mr-1" />
                  Appeler
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleEmailClient(demande)}>
                  <Mail className="w-3 h-3 mr-1" />
                  Email
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleGenerateQuote(demande)}>
                  <FileText className="w-3 h-3 mr-1" />
                  Devis
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleScheduleCallback(demande)}>
                  <Calendar className="w-3 h-3 mr-1" />
                  Rappel
                </Button>
              </div>
              
              {/* Bouton d'archivage séparé */}
              <div className="pt-2 border-t">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleArchiveDemande(demande.id)} 
                  title="Archiver"
                  className="w-full text-orange-600 hover:text-orange-700 hover:bg-orange-50 justify-start"
                >
                  <Archive className="w-3 h-3 mr-2" />
                  Archiver la demande
                </Button>
              </div>
            </div>

            {/* Modification du statut */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Nouveau statut</label>
              <Select value={newStatut} onValueChange={setNewStatut}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nouveau">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Nouveau
                    </div>
                  </SelectItem>
                  <SelectItem value="en_cours">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-500" />
                      En cours
                    </div>
                  </SelectItem>
                  <SelectItem value="traite">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Traité
                    </div>
                  </SelectItem>
                  <SelectItem value="termine">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-purple-500" />
                      Terminé (Contrat signé)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Modification de la priorité */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Nouvelle priorité</label>
              <Select value={newPriorite} onValueChange={setNewPriorite}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basse">Basse</SelectItem>
                  <SelectItem value="normale">Normale</SelectItem>
                  <SelectItem value="haute">Haute</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Commentaire */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Commentaire (optionnel)</label>
              <Textarea
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                placeholder="Ajouter un commentaire sur le traitement de cette demande..."
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Annuler
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={loading || (!newStatut && !newPriorite && !commentaire.trim())}
                className="flex-1"
              >
                {loading ? "Traitement..." : "Mettre à jour"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modals exactement comme dans le panel admin */}
      <ClientDetailsCard 
        demande={demande} 
        isOpen={isDetailsOpen} 
        onClose={() => setIsDetailsOpen(false)} 
      />

      <ScheduleReminderModal 
        isOpen={reminderModalOpen} 
        onClose={() => setReminderModalOpen(false)} 
        demande={demande} 
        onReminderCreated={handleReminderCreated} 
      />

      <DevisGenerationModal 
        isOpen={devisModalOpen} 
        onClose={() => setDevisModalOpen(false)} 
        demande={demande} 
      />

      <AdvancedEmailModal 
        open={emailModalOpen} 
        onOpenChange={setEmailModalOpen} 
        demande={demande} 
      />

      <EditClientModal 
        isOpen={editClientModalOpen} 
        onClose={() => setEditClientModalOpen(false)} 
        demande={demande} 
        onClientUpdated={handleClientUpdated} 
      />
    </>
  );
};
