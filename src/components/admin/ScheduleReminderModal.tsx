
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

interface Demande {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  type_assurance: string;
}

interface ScheduleReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  demande: Demande | null;
  onReminderCreated: () => void;
}

const ScheduleReminderModal = ({ isOpen, onClose, demande, onReminderCreated }: ScheduleReminderModalProps) => {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("");
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [typeRappel, setTypeRappel] = useState("rdv");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!demande || !date || !time || !titre) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setLoading(true);
    try {
      // Combiner date et heure
      const [hours, minutes] = time.split(':').map(Number);
      const dateRappel = new Date(date);
      dateRappel.setHours(hours, minutes, 0, 0);

      const { error } = await supabase
        .from('rappels_clients')
        .insert({
          demande_id: demande.id,
          date_rappel: dateRappel.toISOString(),
          titre,
          description,
          type_rappel: typeRappel,
          statut: 'planifie'
        });

      if (error) {
        console.error('Erreur lors de la création du rappel:', error);
        toast.error('Erreur lors de la création du rappel');
        return;
      }

      // Générer le fichier ICS pour le calendrier
      generateICSFile(dateRappel, titre, description, demande);

      toast.success('Rappel créé avec succès');
      onReminderCreated();
      onClose();
      
      // Reset form
      setDate(undefined);
      setTime("");
      setTitre("");
      setDescription("");
      setTypeRappel("rdv");
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la création du rappel');
    } finally {
      setLoading(false);
    }
  };

  const generateICSFile = (dateRappel: Date, titre: string, description: string, demande: Demande) => {
    const startDate = dateRappel.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const endDate = new Date(dateRappel.getTime() + 60 * 60 * 1000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'; // +1 heure

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//AssureAI//FR
BEGIN:VEVENT
UID:${Date.now()}@assureai.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:${titre}
DESCRIPTION:${description}\\n\\nClient: ${demande.nom} ${demande.prenom}\\nType: ${demande.type_assurance}\\nTéléphone: ${demande.telephone}\\nEmail: ${demande.email}
LOCATION:Bureau AssureAI
BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
DESCRIPTION:Rappel: ${titre}
END:VALARM
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rdv-${demande.nom}-${demande.prenom}-${format(dateRappel, 'yyyy-MM-dd')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Fichier calendrier téléchargé');
  };

  if (!demande) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Programmer un RDV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-sm text-gray-700">Client</h4>
            <p className="text-sm">{demande.nom} {demande.prenom}</p>
            <p className="text-xs text-gray-600">{demande.type_assurance}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="titre">Titre du RDV *</Label>
            <Input
              id="titre"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex: Rendez-vous assurance auto"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
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
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Heure *</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type de RDV</Label>
            <Select value={typeRappel} onValueChange={setTypeRappel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rdv">Rendez-vous</SelectItem>
                <SelectItem value="appel">Appel téléphonique</SelectItem>
                <SelectItem value="email">Suivi email</SelectItem>
                <SelectItem value="autre">Autre</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
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
              disabled={loading || !date || !time || !titre}
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

export default ScheduleReminderModal;
