
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Mail, Phone } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RendezVous {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email?: string;
  type_assurance: string;
}

interface EmailReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  rdv: RendezVous | null;
}

const EmailReminderModal = ({ isOpen, onClose, rdv }: EmailReminderModalProps) => {
  const [emailSubject, setEmailSubject] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [reminderDate, setReminderDate] = useState<Date>();
  const [reminderTime, setReminderTime] = useState("");
  const [reminderType, setReminderType] = useState("appel");
  const [loading, setLoading] = useState(false);

  const handleSendEmail = async () => {
    if (!rdv?.email || !emailSubject || !emailContent) {
      toast.error("Veuillez remplir tous les champs requis");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('to', rdv.email);
      formData.append('subject', emailSubject);
      formData.append('message', emailContent);

      const { error } = await supabase.functions.invoke('send-email', {
        body: formData
      });

      if (error) {
        console.error('Erreur envoi email:', error);
        toast.error('Erreur lors de l\'envoi de l\'email');
        return;
      }

      toast.success('Email envoyé avec succès');
      
      // Marquer le RDV comme contacté
      await supabase
        .from('demandes_assurance')
        .update({ 
          statut: 'en cours',
          date_modification: new Date().toISOString()
        })
        .eq('id', rdv.id);

      onClose();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'envoi de l\'email');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReminder = async () => {
    if (!reminderDate || !reminderTime) {
      toast.error("Veuillez sélectionner une date et heure pour le rappel");
      return;
    }

    setLoading(true);
    try {
      const [hours, minutes] = reminderTime.split(':').map(Number);
      const dateRappel = new Date(reminderDate);
      dateRappel.setHours(hours, minutes, 0, 0);

      const { error } = await supabase
        .from('rappels_clients')
        .insert({
          demande_id: rdv?.id,
          titre: `Rappel d'appel - ${rdv?.nom} ${rdv?.prenom}`,
          description: `Rappel pour appeler le client concernant son assurance ${rdv?.type_assurance}`,
          date_rappel: dateRappel.toISOString(),
          type_rappel: reminderType,
          statut: 'planifie'
        });

      if (error) {
        console.error('Erreur création rappel:', error);
        toast.error('Erreur lors de la création du rappel');
        return;
      }

      toast.success('Rappel créé avec succès');
      onClose();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la création du rappel');
    } finally {
      setLoading(false);
    }
  };

  if (!rdv) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Contact Client - {rdv.nom} {rdv.prenom}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Section Email */}
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Envoyer un Email</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Destinataire</Label>
                <Input
                  id="email"
                  value={rdv.email || "Pas d'email disponible"}
                  disabled
                  className="bg-gray-50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Objet *</Label>
                <Input
                  id="subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder={`Suivi de votre demande d'assurance ${rdv.type_assurance}`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Message *</Label>
                <Textarea
                  id="content"
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  placeholder={`Bonjour ${rdv.prenom},\n\nJ'espère que vous allez bien. Je vous contacte concernant votre demande d'assurance ${rdv.type_assurance}.\n\nN'hésitez pas à me contacter si vous avez des questions.\n\nCordialement`}
                  rows={6}
                />
              </div>

              <Button 
                onClick={handleSendEmail}
                disabled={loading || !rdv.email || !emailSubject || !emailContent}
                className="w-full"
              >
                <Mail className="w-4 h-4 mr-2" />
                {loading ? "Envoi en cours..." : "Envoyer l'Email"}
              </Button>
            </div>
          </div>

          {/* Section Rappel */}
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Phone className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold">Programmer un Rappel d'Appel</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reminderType">Type de rappel</Label>
                <Select value={reminderType} onValueChange={setReminderType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="appel">Rappel d'appel</SelectItem>
                    <SelectItem value="general">Rappel général</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminderDate">Date du rappel *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !reminderDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {reminderDate ? format(reminderDate, "PPP", { locale: fr }) : "Sélectionner une date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={reminderDate}
                      onSelect={setReminderDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminderTime">Heure du rappel *</Label>
                <Input
                  id="reminderTime"
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleCreateReminder}
                disabled={loading || !reminderDate || !reminderTime}
                className="w-full"
                variant="outline"
              >
                <Phone className="w-4 h-4 mr-2" />
                {loading ? "Création..." : "Créer le Rappel"}
              </Button>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailReminderModal;
