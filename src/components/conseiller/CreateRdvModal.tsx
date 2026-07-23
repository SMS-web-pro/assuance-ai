
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateRdvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRdvCreated: () => void;
  conseillerNom: string;
}

const CreateRdvModal = ({ isOpen, onClose, onRdvCreated, conseillerNom }: CreateRdvModalProps) => {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("");
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [typeAssurance, setTypeAssurance] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!date || !time || !nom || !prenom || !typeAssurance) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setLoading(true);
    try {
      // Combiner date et heure pour le rendez-vous
      const [hours, minutes] = time.split(':').map(Number);
      const dateRdv = new Date(date);
      dateRdv.setHours(hours, minutes, 0, 0);

      // Créer la demande d'assurance avec le statut "en cours" pour le RDV
      const { data: demande, error: demandeError } = await supabase
        .from('demandes_assurance')
        .insert({
          nom,
          prenom,
          telephone,
          email,
          type_assurance: typeAssurance,
          statut: 'en cours',
          conseiller_assigne: conseillerNom,
          priorite: 'normale',
          date_contact: dateRdv.toISOString(),
          donnees_specifiques: {
            type_rdv: 'planifie',
            description: description
          }
        })
        .select()
        .single();

      if (demandeError) {
        console.error('Erreur lors de la création de la demande:', demandeError);
        toast.error('Erreur lors de la création du rendez-vous');
        return;
      }

      // Créer un rappel pour le RDV
      const { error: rappelError } = await supabase
        .from('rappels_clients')
        .insert({
          demande_id: demande.id,
          date_rappel: dateRdv.toISOString(),
          titre: `RDV ${typeAssurance} - ${nom} ${prenom}`,
          description: description || `Rendez-vous programmé pour ${typeAssurance}`,
          type_rappel: 'rdv',
          statut: 'planifie',
          created_by: conseillerNom
        });

      if (rappelError) {
        console.error('Erreur lors de la création du rappel:', rappelError);
        // Ne pas bloquer si le rappel échoue
      }

      // Générer le fichier ICS pour le calendrier
      generateICSFile(dateRdv, `RDV ${typeAssurance}`, description, { nom, prenom, telephone, email, type_assurance: typeAssurance });

      toast.success('Rendez-vous créé avec succès');
      onRdvCreated();
      onClose();
      
      // Reset form
      setDate(undefined);
      setTime("");
      setNom("");
      setPrenom("");
      setTelephone("");
      setEmail("");
      setTypeAssurance("");
      setDescription("");
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la création du rendez-vous');
    } finally {
      setLoading(false);
    }
  };

  const generateICSFile = (dateRdv: Date, title: string, description: string, client: any) => {
    const startDate = dateRdv.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endDate = new Date(dateRdv.getTime() + 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'; // +1 heure

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//AssureAI//FR
BEGIN:VEVENT
UID:${Date.now()}@assureai.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${title}
DESCRIPTION:${description}\\n\\nClient: ${client.nom} ${client.prenom}\\nType: ${client.type_assurance}\\nTéléphone: ${client.telephone}\\nEmail: ${client.email}
LOCATION:Bureau AssureAI
BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
DESCRIPTION:Rappel: ${title}
END:VALARM
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rdv-${client.nom}-${client.prenom}-${format(dateRdv, 'yyyy-MM-dd')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Fichier calendrier téléchargé');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouveau Rendez-vous</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom *</Label>
              <Input
                id="nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Nom du client"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prenom">Prénom *</Label>
              <Input
                id="prenom"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Prénom du client"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="telephone">Téléphone</Label>
            <Input
              id="telephone"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              placeholder="Numéro de téléphone"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Adresse email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type d'assurance *</Label>
            <Select value={typeAssurance} onValueChange={setTypeAssurance}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner le type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Assurance Auto</SelectItem>
                <SelectItem value="habitation">Assurance Habitation</SelectItem>
                <SelectItem value="sante">Assurance Santé</SelectItem>
                <SelectItem value="moto">Assurance Moto</SelectItem>
                <SelectItem value="voyage">Assurance Voyage</SelectItem>
                <SelectItem value="emprunteur">Assurance Emprunteur</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date du RDV *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: fr }) : "Sélectionner une date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Heure du RDV *</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description / Notes</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Détails du rendez-vous..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading || !date || !time || !nom || !prenom || !typeAssurance}
              className="flex-1"
            >
              {loading ? "Création..." : "Créer RDV"}
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            <Download className="w-3 h-3 inline mr-1" />
            Le fichier calendrier sera automatiquement téléchargé
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRdvModal;
