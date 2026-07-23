
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Save, X } from "lucide-react";

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  demande: any;
  onClientUpdated: () => void;
}

const EditClientModal = ({ isOpen, onClose, demande, onClientUpdated }: EditClientModalProps) => {
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm({
    defaultValues: {
      nom: "",
      prenom: "",
      email: "",
      telephone: "",
      date_naissance: "",
      adresse_complete: "",
      code_postal: "",
      profession: "",
      situation_familiale: "",
    }
  });

  useEffect(() => {
    if (demande && isOpen) {
      form.reset({
        nom: demande.nom || "",
        prenom: demande.prenom || "",
        email: demande.email || "",
        telephone: demande.telephone || "",
        date_naissance: demande.date_naissance ? new Date(demande.date_naissance).toISOString().split('T')[0] : "",
        adresse_complete: demande.adresse_complete || "",
        code_postal: demande.code_postal || "",
        profession: demande.profession || "",
        situation_familiale: demande.situation_familiale || "",
      });
    }
  }, [demande, isOpen, form]);

  const onSubmit = async (data: any) => {
    console.log('=== DÉBUT DE LA MISE À JOUR ===');
    console.log('ID de la demande:', demande?.id);
    console.log('Données du formulaire:', data);
    
    setIsSaving(true);
    try {
      // Vérifier la session utilisateur
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      console.log('Session utilisateur:', session);
      if (sessionError) throw sessionError;
      
      // Préparer uniquement les champs qui existent dans la table
      const updateData: Record<string, any> = {
        nom: data.nom?.trim() || '',
        prenom: data.prenom?.trim() || '',
        email: data.email?.trim() || '',
        telephone: data.telephone?.trim() || ''
      };
      
      // Ajouter les champs optionnels s'ils existent dans le formulaire
      if (data.date_naissance) updateData.date_naissance = data.date_naissance;
      if (data.adresse_complete) updateData.adresse_complete = data.adresse_complete.trim();
      if (data.code_postal) updateData.code_postal = data.code_postal.trim();
      
      console.log('Données à mettre à jour:', updateData);
      
      // Effectuer la mise à jour
      const { data: updatedData, error } = await supabase
        .from('demandes_assurance')
        .update(updateData)
        .eq('id', demande.id)
        .select();
      
      console.log('Réponse de la mise à jour:', { updatedData, error });

      if (error) {
        console.error('Erreur détaillée:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('Mise à jour réussie, rafraîchissement...');
      toast.success("✅ Informations client mises à jour avec succès");
      onClientUpdated();
      onClose();
    } catch (error) {
      console.error('=== ERREUR LORS DE LA MISE À JOUR ===', {
        name: error.name,
        message: error.message,
        ...(error.code && { code: error.code })
      });
      
      let errorMessage = "Erreur lors de la mise à jour des informations";
      if (error?.message) {
        if (error.message.includes('permission denied')) {
          errorMessage = "Erreur de permissions. Vérifiez que vous êtes connecté en tant qu'administrateur.";
        } else if (error.message.includes('JWT')) {
          errorMessage = "Session expirée. Veuillez vous reconnecter.";
        } else if (error.message.includes('duplicate key')) {
          errorMessage = "Cette adresse email est déjà utilisée par un autre client.";
        }
      }
      
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Modifier les informations client
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nom de famille" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="prenom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénom *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Prénom" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="Email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="telephone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Numéro de téléphone" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date_naissance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de naissance</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="profession"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profession</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Profession" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="situation_familiale"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Situation familiale</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une situation" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="celibataire">Célibataire</SelectItem>
                      <SelectItem value="marie">Marié(e)</SelectItem>
                      <SelectItem value="divorce">Divorcé(e)</SelectItem>
                      <SelectItem value="veuf">Veuf/Veuve</SelectItem>
                      <SelectItem value="concubinage">Concubinage</SelectItem>
                      <SelectItem value="pacs">PACS</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="adresse_complete"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresse complète</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Adresse complète" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code_postal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code postal</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Code postal" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Save className="w-4 h-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditClientModal;
