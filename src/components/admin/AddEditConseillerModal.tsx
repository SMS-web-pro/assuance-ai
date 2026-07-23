import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Key, Mail, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { CheckedState } from "@radix-ui/react-checkbox";

interface Conseiller {
  id: number;
  nom: string;
  email: string;
  telephone?: string;
  specialite?: string;
  statut: string;
  date_embauche?: string;
  competences?: string[];
  objectif_mensuel?: number;
  demandsactuelles?: number;
}

interface AddEditConseillerModalProps {
  isOpen: boolean;
  onClose: () => void;
  conseiller?: Conseiller | null;
  onSave: (conseiller: any) => void;
}

const AddEditConseillerModal = ({ isOpen, onClose, conseiller, onSave }: AddEditConseillerModalProps) => {
  const [formData, setFormData] = useState<Partial<Conseiller>>({
    nom: "",
    email: "",
    telephone: "",
    specialite: "",
    statut: "En ligne",
    date_embauche: "",
    competences: [],
    objectif_mensuel: 0,
  });

  const [newCompetence, setNewCompetence] = useState("");
  const [generatePassword, setGeneratePassword] = useState(!conseiller);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [sendEmail, setSendEmail] = useState(!conseiller);
  const [isLoading, setIsLoading] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [sendNotification, setSendNotification] = useState(true);

  // Pré-remplir les données quand le modal s'ouvre pour modification
  useEffect(() => {
    if (conseiller && isOpen) {
      setFormData({
        nom: conseiller.nom || "",
        email: conseiller.email || "",
        telephone: conseiller.telephone || "",
        specialite: conseiller.specialite || "",
        statut: conseiller.statut || "En ligne",
        date_embauche: conseiller.date_embauche || "",
        competences: conseiller.competences || [],
        objectif_mensuel: conseiller.objectif_mensuel || 0,
      });
    } else if (!conseiller && isOpen) {
      // Réinitialiser pour un nouveau conseiller
      setFormData({
        nom: "",
        email: "",
        telephone: "",
        specialite: "",
        statut: "En ligne",
        date_embauche: "",
        competences: [],
        objectif_mensuel: 0,
      });
    }
  }, [conseiller, isOpen]);

  const specialites = [
    "Auto/Moto",
    "Habitation", 
    "Santé",
    "Emprunteur",
    "Voyage",
    "Professionnel"
  ];

  const generateRandomPassword = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const handleGeneratePassword = () => {
    const password = generateRandomPassword();
    setGeneratedPassword(password);
    setNewPassword(password);
    toast.success("Mot de passe généré avec succès");
  };

  const handleGenerateNewPassword = () => {
    const password = generateRandomPassword();
    setNewPassword(password);
    toast.success("Nouveau mot de passe généré");
  };

  const createSupabaseAuthUser = async (email: string, password: string, userData: any) => {
    try {
      console.log('Création du compte Supabase Auth via Edge Function pour:', email);
      
      const { data, error } = await supabase.functions.invoke('create-conseiller-account', {
        body: {
          email: email,
          password: password,
          userData: userData
        }
      });

      if (error) {
        console.error('Erreur fonction Edge:', error);
        throw error;
      }

      if (!data.success) {
        console.error('Erreur création compte:', data.error);
        throw new Error(data.error);
      }

      console.log('Compte Supabase Auth créé avec succès via Edge Function');
      return data.user;
    } catch (error) {
      console.error('Erreur lors de la création du compte:', error);
      throw error;
    }
  };

  const updateConseillerPassword = async (email: string, newPassword: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('update-conseiller-password', {
        body: {
          email: email,
          newPassword: newPassword
        }
      });

      if (error) {
        console.error('Erreur fonction Edge:', error);
        throw error;
      }

      if (!data.success) {
        console.error('Erreur mise à jour mot de passe:', data.error);
        throw new Error(data.error);
      }

      console.log('Mot de passe mis à jour avec succès');
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du mot de passe:', error);
      throw error;
    }
  };

  const sendWelcomeEmail = async (email: string, nom: string, password: string) => {
    try {
      const { data: smtpConfig, error: smtpError } = await supabase
        .from('smtp_configs')
        .select('*')
        .eq('is_default', true)
        .eq('enabled', true)
        .single();

      if (smtpError) {
        console.error('Erreur récupération config SMTP:', smtpError);
        toast.error("Aucune configuration SMTP activée par défaut");
        return false;
      }

      if (!smtpConfig) {
        toast.error("Aucune configuration SMTP par défaut trouvée");
        return false;
      }

      const loginUrl = `${window.location.origin}/conseiller`;
      
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Bienvenue ${nom} !</h2>
          <p>Votre compte conseiller a été créé avec succès.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Vos identifiants de connexion :</h3>
            <p><strong>Email :</strong> ${email}</p>
            <p><strong>Mot de passe :</strong> <code style="background-color: #e2e8f0; padding: 4px 8px; border-radius: 4px;">${password}</code></p>
          </div>
          
          <p>Vous pouvez vous connecter à votre panel conseiller en cliquant sur le lien ci-dessous :</p>
          <a href="${loginUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">Accéder au Panel Conseiller</a>
          
          <p style="margin-top: 30px; color: #64748b; font-size: 14px;">
            Pour votre sécurité, nous vous recommandons de changer votre mot de passe lors de votre première connexion.
          </p>
        </div>
      `;

      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: email,
          subject: 'Bienvenue - Vos identifiants de connexion',
          html: emailHtml,
          smtpConfig: {
            host: smtpConfig.host,
            port: parseInt(smtpConfig.port),
            secure: smtpConfig.security === 'ssl',
            auth: {
              user: smtpConfig.username,
              pass: smtpConfig.password
            },
            from: {
              name: smtpConfig.sender_name || 'Plateforme Assurance',
              email: smtpConfig.sender_email || 'noreply@assurance.com'
            }
          }
        }
      });

      if (error) {
        console.error('Erreur envoi email:', error);
        toast.error("Erreur lors de l'envoi de l'email");
        return false;
      }

      toast.success("Email envoyé avec succès");
      return true;
    } catch (error) {
      console.error('Erreur envoi email:', error);
      toast.error("Erreur lors de l'envoi de l'email");
      return false;
    }
  };

  const sendUpdateNotification = async (email: string, nom: string, changes: string[]) => {
    try {
      const { data: smtpConfig, error: smtpError } = await supabase
        .from('smtp_configs')
        .select('*')
        .eq('is_default', true)
        .eq('enabled', true)
        .single();

      if (smtpError || !smtpConfig) {
        console.error('Erreur récupération config SMTP:', smtpError);
        return false;
      }

      const loginUrl = `${window.location.origin}/conseiller`;
      const changesHtml = changes.map(change => `<li>${change}</li>`).join('');
      
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Mise à jour de votre profil</h2>
          <p>Bonjour ${nom},</p>
          <p>Votre profil conseiller a été mis à jour par l'administrateur.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Modifications apportées :</h3>
            <ul style="margin: 10px 0; padding-left: 20px;">
              ${changesHtml}
            </ul>
          </div>
          
          <p>Vous pouvez consulter vos informations mises à jour en vous connectant à votre panel :</p>
          <a href="${loginUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0;">Accéder au Panel Conseiller</a>
          
          <p style="margin-top: 30px; color: #64748b; font-size: 14px;">
            Si vous avez des questions concernant ces modifications, n'hésitez pas à contacter l'administration.
          </p>
        </div>
      `;

      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: email,
          subject: 'Mise à jour de votre profil conseiller',
          html: emailHtml,
          smtpConfig: {
            host: smtpConfig.host,
            port: parseInt(smtpConfig.port),
            secure: smtpConfig.security === 'ssl',
            auth: {
              user: smtpConfig.username,
              pass: smtpConfig.password
            },
            from: {
              name: smtpConfig.sender_name || 'Plateforme Assurance',
              email: smtpConfig.sender_email || 'noreply@assurance.com'
            }
          }
        }
      });

      if (error) {
        console.error('Erreur envoi notification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erreur envoi notification:', error);
      return false;
    }
  };

  const addCompetence = () => {
    if (newCompetence.trim() && !formData.competences?.includes(newCompetence.trim())) {
      setFormData({
        ...formData,
        competences: [...(formData.competences || []), newCompetence.trim()]
      });
      setNewCompetence("");
    }
  };

  const removeCompetence = (competence: string) => {
    setFormData({
      ...formData,
      competences: formData.competences?.filter(c => c !== competence) || []
    });
  };

  const detectChanges = (oldData: Conseiller, newData: any) => {
    const changes: string[] = [];
    
    if (oldData.nom !== newData.nom) changes.push(`Nom: ${oldData.nom} → ${newData.nom}`);
    if (oldData.email !== newData.email) changes.push(`Email: ${oldData.email} → ${newData.email}`);
    if (oldData.telephone !== newData.telephone) changes.push(`Téléphone: ${oldData.telephone || 'Non défini'} → ${newData.telephone || 'Non défini'}`);
    if (oldData.specialite !== newData.specialite) changes.push(`Spécialité: ${oldData.specialite} → ${newData.specialite}`);
    if (oldData.statut !== newData.statut) changes.push(`Statut: ${oldData.statut} → ${newData.statut}`);
    if (oldData.date_embauche !== newData.date_embauche) changes.push(`Date d'embauche: ${oldData.date_embauche || 'Non définie'} → ${newData.date_embauche || 'Non définie'}`);
    if (oldData.objectif_mensuel !== newData.objectif_mensuel) changes.push(`Objectif mensuel: ${oldData.objectif_mensuel} → ${newData.objectif_mensuel}`);
    
    const oldCompetences = oldData.competences?.sort() || [];
    const newCompetences = newData.competences?.sort() || [];
    if (JSON.stringify(oldCompetences) !== JSON.stringify(newCompetences)) {
      changes.push(`Compétences mises à jour`);
    }
    
    if (changePassword && newPassword) {
      changes.push(`Mot de passe modifié`);
    }
    
    return changes;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Vérifier si l'email existe déjà pour un nouveau conseiller
      if (!conseiller?.id) {
        const { data: existingConseiller, error: checkError } = await supabase
          .from('conseillers')
          .select('id')
          .ilike('email', formData.email?.trim() || '')
          .maybeSingle();

        if (existingConseiller && !checkError) {
          toast.error("Un conseiller avec cet email existe déjà");
          setIsLoading(false);
          return;
        }
      }

      let passwordToUse = generatedPassword;
      if (generatePassword && !generatedPassword) {
        passwordToUse = generateRandomPassword();
        setGeneratedPassword(passwordToUse);
      }

      const conseillerData = {
        ...(conseiller?.id && { id: conseiller.id }),
        nom: formData.nom || "",
        email: formData.email?.trim().toLowerCase() || "",
        telephone: formData.telephone || "",
        specialite: formData.specialite || "",
        statut: formData.statut || "En ligne",
        date_embauche: formData.date_embauche || null,
        competences: formData.competences || [],
        objectif_mensuel: formData.objectif_mensuel || 0,
      };

      // Détecter les changements pour la notification
      const changes = conseiller ? detectChanges(conseiller, conseillerData) : [];

      // Créer le compte Supabase Auth pour le nouveau conseiller
      if (!conseiller?.id && generatePassword && passwordToUse) {
        await createSupabaseAuthUser(
          conseillerData.email, 
          passwordToUse, 
          {
            nom: conseillerData.nom,
            specialite: conseillerData.specialite
          }
        );
      }

      // Mettre à jour le mot de passe si demandé
      if (conseiller?.id && changePassword && newPassword) {
        await updateConseillerPassword(conseillerData.email, newPassword);
      }

      await onSave(conseillerData);

      // Envoyer l'email de bienvenue pour nouveau conseiller
      if (!conseiller?.id && generatePassword && sendEmail && passwordToUse) {
        await sendWelcomeEmail(
          formData.email || "",
          formData.nom || "",
          passwordToUse
        );
      }

      // Envoyer la notification de mise à jour
      if (conseiller?.id && sendNotification && changes.length > 0) {
        await sendUpdateNotification(
          formData.email || "",
          formData.nom || "",
          changes
        );
        toast.success("Notification envoyée au conseiller");
      }

      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {conseiller ? "Modifier le conseiller" : "Ajouter un conseiller"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom complet *</Label>
              <Input
                id="nom"
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telephone">Téléphone</Label>
              <Input
                id="telephone"
                value={formData.telephone}
                onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_embauche">Date d'embauche</Label>
              <Input
                id="date_embauche"
                type="date"
                value={formData.date_embauche}
                onChange={(e) => setFormData({ ...formData, date_embauche: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="specialite">Spécialité *</Label>
              <Select
                value={formData.specialite}
                onValueChange={(value) => setFormData({ ...formData, specialite: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une spécialité" />
                </SelectTrigger>
                <SelectContent>
                  {specialites.map((spec) => (
                    <SelectItem key={spec} value={spec}>
                      {spec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="statut">Statut</Label>
              <Select
                value={formData.statut}
                onValueChange={(value) => setFormData({ ...formData, statut: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="En ligne">En ligne</SelectItem>
                  <SelectItem value="Absent">Absent</SelectItem>
                  <SelectItem value="En pause">En pause</SelectItem>
                  <SelectItem value="Congé">Congé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="objectifs">Objectifs mensuels (nombre de dossiers)</Label>
            <Input
              id="objectifs"
              type="number"
              value={formData.objectif_mensuel}
              onChange={(e) => setFormData({ ...formData, objectif_mensuel: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="space-y-2">
            <Label>Compétences</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ajouter une compétence"
                value={newCompetence}
                onChange={(e) => setNewCompetence(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCompetence())}
              />
              <Button type="button" onClick={addCompetence} variant="outline">
                Ajouter
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.competences?.map((competence) => (
                <Badge key={competence} variant="secondary" className="flex items-center gap-1">
                  {competence}
                  <X
                    size={14}
                    className="cursor-pointer hover:text-red-500"
                    onClick={() => removeCompetence(competence)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          {/* Section mot de passe */}
          <div className="border-t pt-4 space-y-4">
            {!conseiller && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="generate-password"
                  checked={generatePassword}
                  onCheckedChange={(checked: CheckedState) => setGeneratePassword(checked === true)}
                />
                <Label htmlFor="generate-password" className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Créer un compte avec mot de passe automatique
                </Label>
              </div>
            )}

            {conseiller && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="change-password"
                  checked={changePassword}
                  onCheckedChange={(checked: CheckedState) => setChangePassword(checked === true)}
                />
                <Label htmlFor="change-password" className="flex items-center gap-2">
                  <Key className="w-4 h-4" />
                  Changer le mot de passe
                </Label>
              </div>
            )}

            {((generatePassword && !conseiller) || (changePassword && conseiller)) && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      placeholder="Mot de passe"
                      type={showPassword ? "text" : "password"}
                      value={conseiller ? newPassword : generatedPassword}
                      onChange={(e) => conseiller ? setNewPassword(e.target.value) : setGeneratedPassword(e.target.value)}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Button
                    type="button"
                    onClick={conseiller ? handleGenerateNewPassword : handleGeneratePassword}
                    variant="outline"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Générer
                  </Button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="send-email"
                    checked={sendEmail}
                    onCheckedChange={(checked: CheckedState) => setSendEmail(checked === true)}
                  />
                  <Label htmlFor="send-email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Envoyer les identifiants par email
                  </Label>
                </div>
              </div>
            )}

            {conseiller && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="send-notification"
                  checked={sendNotification}
                  onCheckedChange={(checked: CheckedState) => setSendNotification(checked === true)}
                />
                <Label htmlFor="send-notification" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Notifier le conseiller des modifications
                </Label>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Annuler
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
              {isLoading ? "En cours..." : conseiller ? "Modifier" : "Ajouter"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddEditConseillerModal;
