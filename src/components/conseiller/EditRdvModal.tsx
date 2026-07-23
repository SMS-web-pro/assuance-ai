
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
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
  statut: string;
  date_creation: string;
  date_contact?: string;
  priorite: string;
  notes_conseiller?: string;
  donnees_specifiques?: any;
}

interface EditRdvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRdvUpdated: () => void;
  rdv: RendezVous | null;
}

const EditRdvModal = ({ isOpen, onClose, onRdvUpdated, rdv }: EditRdvModalProps) => {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("");
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [telephone, setTelephone] = useState("");
  const [email, setEmail] = useState("");
  const [typeAssurance, setTypeAssurance] = useState("");
  const [statut, setStatut] = useState("");
  const [priorite, setPriorite] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (rdv && isOpen) {
      setNom(rdv.nom || "");
      setPrenom(rdv.prenom || "");
      setTelephone(rdv.telephone || "");
      setEmail(rdv.email || "");
      setTypeAssurance(rdv.type_assurance);
      setStatut(rdv.statut);
      setPriorite(rdv.priorite || "normale");
      setNotes(rdv.notes_conseiller || "");
      
      const rdvDate = new Date(rdv.date_contact || rdv.date_creation);
      setDate(rdvDate);
      setTime(format(rdvDate, 'HH:mm'));
    }
  }, [rdv, isOpen]);

  const handleSubmit = async () => {
    if (!rdv || !date || !time) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setLoading(true);
    try {
      const [hours, minutes] = time.split(':').map(Number);
      const dateRdv = new Date(date);
      dateRdv.setHours(hours, minutes, 0, 0);

      const { error } = await supabase
        .from('demandes_assurance')
        .update({
          nom,
          prenom,
          telephone,
          email: email || null,
          type_assurance: typeAssurance,
          statut,
          priorite,
          notes_conseiller: notes,
          date_contact: dateRdv.toISOString(),
          date_modification: new Date().toISOString()
        })
        .eq('id', rdv.id);

      if (error) {
        console.error('Erreur lors de la modification:', error);
        toast.error('Erreur lors de la modification du rendez-vous');
        return;
      }

      toast.success('Rendez-vous modifié avec succès');
      onRdvUpdated();
      onClose();
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la modification du rendez-vous');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!rdv) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('demandes_assurance')
        .update({
          statut: 'annule',
          date_modification: new Date().toISOString()
        })
        .eq('id', rdv.id);

      if (error) {
        console.error('Erreur lors de l\'annulation:', error);
        toast.error('Erreur lors de l\'annulation du rendez-vous');
        return;
      }

      toast.success('Rendez-vous annulé');
      onRdvUpdated();
      onClose();
      
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'annulation du rendez-vous');
    } finally {
      setLoading(false);
    }
  };

  if (!rdv) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier le Rendez-vous</DialogTitle>
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
            <Label htmlFor="statut">Statut</Label>
            <Select value={statut} onValueChange={setStatut}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner le statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nouveau">Nouveau</SelectItem>
                <SelectItem value="en cours">En cours</SelectItem>
                <SelectItem value="termine">Terminé</SelectItem>
                <SelectItem value="annule">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priorite">Priorité</Label>
            <Select value={priorite} onValueChange={setPriorite}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner la priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="faible">Faible</SelectItem>
                <SelectItem value="normale">Normale</SelectItem>
                <SelectItem value="haute">Haute</SelectItem>
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
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes sur le rendez-vous..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Annulation..." : "Annuler RDV"}
            </Button>
            <Button variant="outline" onClick={onClose} className="flex-1">
              Fermer
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading || !date || !time || !nom || !prenom}
              className="flex-1"
            >
              {loading ? "Modification..." : "Modifier"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditRdvModal;
