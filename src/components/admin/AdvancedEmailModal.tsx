import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Send, Paperclip, X, FileText, Mail, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { generateDevisPDF, calculateTarifs } from "@/services/devisService";

interface AdvancedEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  demande: any;
}

const AdvancedEmailModal = ({
  open,
  onOpenChange,
  demande
}: AdvancedEmailModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [conseillers, setConseillers] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("devis");
  const [manualCcEmail, setManualCcEmail] = useState("");
  const [emailData, setEmailData] = useState({
    to: demande?.email || "",
    cc: "",
    subject: `Votre devis d'assurance ${demande?.type_assurance || ""}`,
    message: ""
  });
  const [attachPDF, setAttachPDF] = useState(true);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [ccEmails, setCcEmails] = useState<string[]>([]);

  // Modèles d'emails
  const emailTemplates = {
    devis: {
      subject: `Votre devis d'assurance ${demande?.type_assurance || ""}`,
      message: `Bonjour ${demande?.prenom || ""} ${demande?.nom || ""},

Nous avons le plaisir de vous faire parvenir votre devis d'assurance ${demande?.type_assurance || ""} personnalisé.

Vous trouverez en pièce jointe le détail de notre proposition tarifaire ainsi que les garanties incluses.

N'hésitez pas à nous contacter si vous avez des questions ou si vous souhaitez ajuster certains aspects de votre couverture.

Cordialement,
L'équipe AssureAI`
    },
    suivi: {
      subject: `Suivi de votre demande d'assurance ${demande?.type_assurance || ""}`,
      message: `Bonjour ${demande?.prenom || ""} ${demande?.nom || ""},

Nous espérons que vous vous portez bien.

Nous souhaitions faire le point avec vous concernant votre demande d'assurance ${demande?.type_assurance || ""}.

N'hésitez pas à nous contacter si vous avez des questions ou si vous souhaitez programmer un entretien.

Cordialement,
L'équipe AssureAI`
    },
    rappel: {
      subject: `Rappel - Votre demande d'assurance ${demande?.type_assurance || ""}`,
      message: `Bonjour ${demande?.prenom || ""} ${demande?.nom || ""},

Nous vous contactons concernant votre demande d'assurance ${demande?.type_assurance || ""} qui est en attente de votre retour.

Pour finaliser votre dossier, nous aurions besoin de quelques informations complémentaires.

Pouvez-vous nous contacter à votre convenance ?

Cordialement,
L'équipe AssureAI`
    },
    personnalise: {
      subject: "Votre message personnalisé",
      message: `Bonjour ${demande?.prenom || ""} ${demande?.nom || ""},

`
    }
  };

  useEffect(() => {
    if (open) {
      loadConseillers();
      // Réinitialiser les données email avec le modèle par défaut
      const template = emailTemplates[selectedTemplate as keyof typeof emailTemplates];
      setEmailData({
        to: demande?.email || "",
        cc: "",
        subject: template.subject,
        message: template.message
      });
      setCcEmails([]);
      setManualCcEmail("");
    }
  }, [open, demande, selectedTemplate]);

  const loadConseillers = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('conseillers').select('nom, email').eq('statut', 'En ligne');
      if (error) throw error;
      setConseillers(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des conseillers:', error);
    }
  };

  const handleTemplateChange = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    const template = emailTemplates[templateKey as keyof typeof emailTemplates];
    setEmailData(prev => ({
      ...prev,
      subject: template.subject,
      message: template.message
    }));
  };

  const addCcEmail = (email: string) => {
    if (email && !ccEmails.includes(email)) {
      const newCcEmails = [...ccEmails, email];
      setCcEmails(newCcEmails);
      updateCcField(newCcEmails);
    }
  };

  const removeCcEmail = (emailToRemove: string) => {
    const newCcEmails = ccEmails.filter(email => email !== emailToRemove);
    setCcEmails(newCcEmails);
    updateCcField(newCcEmails);
  };

  const updateCcField = (emails: string[]) => {
    setEmailData(prev => ({
      ...prev,
      cc: emails.join(', ')
    }));
  };

  const handleAddManualEmail = () => {
    if (manualCcEmail.trim()) {
      addCcEmail(manualCcEmail.trim());
      setManualCcEmail("");
    }
  };

  const handleConseillerSelect = (email: string) => {
    addCcEmail(email);
  };

  const handleSendEmail = async () => {
    try {
      setIsLoading(true);
      console.log('Début de l\'envoi de l\'email');

      let pdfBlob = null;
      if (attachPDF) {
        console.log('Génération du PDF...');
        // Récupérer le logo
        const {
          data: logoData
        } = await supabase.from('app_settings').select('value').eq('key', 'company_logo').single();
        
        const tarifs = calculateTarifs(demande);
        const pdfDoc = await generateDevisPDF({
          demande,
          tarifs,
          logoUrl: logoData?.value
        });
        pdfBlob = pdfDoc.output('blob');
        console.log('PDF généré avec succès');
      }

      // Créer FormData pour les fichiers
      const formData = new FormData();
      formData.append('to', emailData.to);
      formData.append('cc', emailData.cc);
      formData.append('subject', emailData.subject);
      formData.append('message', emailData.message);
      
      if (pdfBlob) {
        formData.append('pdf', pdfBlob, `devis_${demande.nom}_${demande.prenom}.pdf`);
      }
      
      attachments.forEach((file, index) => {
        formData.append(`attachment_${index}`, file);
      });

      console.log('Envoi de l\'email avec FormData...');

      const {
        data,
        error
      } = await supabase.functions.invoke('send-email', {
        body: formData
      });

      if (error) {
        console.error('Erreur de la fonction edge:', error);
        throw error;
      }

      console.log('Réponse de la fonction edge:', data);
      toast.success("Email envoyé avec succès !");
      onOpenChange(false);
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      toast.error("Erreur lors de l'envoi de l'email");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileAttachment = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Envoi d'email avancé
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sélection du modèle d'email */}
          <div className="space-y-2">
            <Label>Modèle d'email</Label>
            <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir un modèle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="devis">Envoi de devis</SelectItem>
                <SelectItem value="suivi">Suivi de demande</SelectItem>
                <SelectItem value="rappel">Rappel client</SelectItem>
                <SelectItem value="personnalise">Message personnalisé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Destinataires */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="to">Destinataire *</Label>
              <Input id="to" type="email" value={emailData.to} onChange={e => setEmailData(prev => ({
              ...prev,
              to: e.target.value
            }))} placeholder="email@exemple.com" />
            </div>

            {/* CC avec saisie manuelle et sélection */}
            <div className="space-y-3">
              <Label>CC - Copie</Label>
              
              {/* Saisie manuelle */}
              <div className="flex gap-2">
                <Input type="email" value={manualCcEmail} onChange={e => setManualCcEmail(e.target.value)} placeholder="Saisir un email manuellement" onKeyPress={e => e.key === 'Enter' && handleAddManualEmail()} />
                <Button type="button" variant="outline" size="sm" onClick={handleAddManualEmail}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {/* Sélection depuis la liste des conseillers */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Ou choisir parmi les Emails
 :</Label>
                <Select onValueChange={handleConseillerSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un conseiller" />
                  </SelectTrigger>
                  <SelectContent>
                    {conseillers.map(conseiller => <SelectItem key={conseiller.email} value={conseiller.email}>
                        {conseiller.nom} ({conseiller.email})
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Affichage des emails CC sélectionnés */}
              {ccEmails.length > 0 && <div className="space-y-2">
                  <Label className="text-sm">Emails en copie :</Label>
                  <div className="flex flex-wrap gap-2">
                    {ccEmails.map(email => <Badge key={email} variant="secondary" className="flex items-center gap-1">
                        {email}
                        <Button type="button" variant="ghost" size="sm" className="h-auto p-0 w-4 h-4" onClick={() => removeCcEmail(email)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>)}
                  </div>
                </div>}
            </div>
          </div>

          <Separator />

          {/* Contenu de l'email */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="subject">Objet *</Label>
              <Input id="subject" value={emailData.subject} onChange={e => setEmailData(prev => ({
              ...prev,
              subject: e.target.value
            }))} placeholder="Objet de l'email" />
            </div>

            <div>
              <Label htmlFor="message">Message *</Label>
              <Textarea id="message" value={emailData.message} onChange={e => setEmailData(prev => ({
              ...prev,
              message: e.target.value
            }))} placeholder="Votre message..." rows={10} />
            </div>
          </div>

          <Separator />

          {/* Pièces jointes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Joindre le devis PDF</Label>
              <Switch checked={attachPDF} onCheckedChange={setAttachPDF} />
            </div>

            <div>
              <Label htmlFor="attachments">Pièces jointes supplémentaires</Label>
              <Input id="attachments" type="file" multiple onChange={handleFileAttachment} className="mt-1" />
            </div>

            {attachments.length > 0 && <div className="space-y-2">
                <Label>Fichiers joints :</Label>
                {attachments.map((file, index) => <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <Paperclip className="w-4 h-4" />
                      <span className="text-sm">{file.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeAttachment(index)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>)}
              </div>}

            {attachPDF && <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700">
                  Devis PDF sera joint automatiquement
                </span>
              </div>}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleSendEmail} disabled={isLoading || !emailData.to || !emailData.subject || !emailData.message}>
              {isLoading ? <>
                  <Send className="w-4 h-4 mr-2 animate-pulse" />
                  Envoi en cours...
                </> : <>
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer
                </>}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
};

export default AdvancedEmailModal;
