
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone, Mail, Calendar, X } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import AdvancedEmailModal from "../admin/AdvancedEmailModal";
import ScheduleReminderModal from "../admin/ScheduleReminderModal";

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
}

interface ClientContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client | null;
  onContactUpdate: () => void;
}

export const ClientContactModal = ({
  isOpen,
  onClose,
  client,
  onContactUpdate
}: ClientContactModalProps) => {
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);

  if (!client) return null;

  const handleCall = () => {
    if (client.telephone) {
      window.open(`tel:${client.telephone}`);
      toast.success(`Appel vers ${client.nom} ${client.prenom}`);
      onContactUpdate();
    } else {
      toast.error("Aucun numéro de téléphone disponible");
    }
  };

  const handleEmail = () => {
    setEmailModalOpen(true);
  };

  const handleScheduleRDV = () => {
    setReminderModalOpen(true);
  };

  const handleReminderCreated = () => {
    toast.success(`RDV programmé pour ${client.nom} ${client.prenom}`);
    setReminderModalOpen(false);
    onContactUpdate();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Contacter {client.nom} {client.prenom}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm text-gray-700">Informations client</h4>
              <div className="mt-2 space-y-1 text-sm">
                <p><span className="font-medium">Type:</span> {client.type_assurance}</p>
                <p><span className="font-medium">Statut:</span> {client.statut}</p>
                {client.telephone && <p><span className="font-medium">Tél:</span> {client.telephone}</p>}
                {client.email && <p><span className="font-medium">Email:</span> {client.email}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Button onClick={handleCall} className="flex items-center gap-2" disabled={!client.telephone}>
                <Phone className="w-4 h-4" />
                Appeler
              </Button>

              <Button onClick={handleEmail} variant="outline" className="flex items-center gap-2" disabled={!client.email}>
                <Mail className="w-4 h-4" />
                Envoyer un Email
              </Button>

              <Button onClick={handleScheduleRDV} variant="outline" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Programmer un RDV
              </Button>
            </div>

            <div className="pt-3 border-t">
              <Button onClick={onClose} variant="secondary" className="w-full">
                Fermer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal d'email avancé */}
      <AdvancedEmailModal 
        open={emailModalOpen} 
        onOpenChange={setEmailModalOpen} 
        demande={client} 
      />

      {/* Modal de programmation de RDV */}
      <ScheduleReminderModal 
        isOpen={reminderModalOpen} 
        onClose={() => setReminderModalOpen(false)} 
        demande={client} 
        onReminderCreated={handleReminderCreated} 
      />
    </>
  );
};
