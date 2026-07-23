import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Download, Send } from "lucide-react";
import { generateDevisPDF, calculateTarifs, DevisData } from "@/services/devisService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

interface DevisGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  demande: any;
}

type SmtpConfig = Tables<'smtp_configs'>;

const DevisGenerationModal = ({ isOpen, onClose, demande }: DevisGenerationModalProps) => {
  const getTypeLabel = (type: string) => {
    const labels = {
      auto: "Auto",
      habitation: "Habitation", 
      sante: "Santé",
      moto: "Moto",
      emprunteur: "Emprunteur",
      voyage: "Voyage"
    };
    return labels[type as keyof typeof labels] || type;
  };

  // Toutes les garanties disponibles par type d'assurance
  const getAllGaranties = (typeAssurance: string) => {
    const garantiesParType = {
      auto: [
        'Responsabilité civile',
        'Dommages tous accidents',
        'Vol et incendie',
        'Assistance 24h/24',
        'Bris de glace',
        'Protection juridique',
        'Prêt de véhicule',
        'Dommages aux équipements',
        'Catastrophes naturelles',
        'Garantie personnelle du conducteur'
      ],
      habitation: [
        'Responsabilité civile',
        'Incendie',
        'Dégâts des eaux',
        'Vol et vandalisme',
        'Bris de glace',
        'Catastrophes naturelles',
        'Protection juridique',
        'Assistance habitat',
        'Perte d\'exploitation',
        'Objets de valeur',
        'Jardin et dépendances'
      ],
      sante: [
        'Hospitalisation',
        'Médecine courante',
        'Dentaire',
        'Optique',
        'Pharmacie',
        'Analyses et examens',
        'Maternité',
        'Médecines douces',
        'Cures thermales',
        'Psychologie',
        'Prévention'
      ],
      moto: [
        'Responsabilité civile',
        'Vol et incendie',
        'Équipement du pilote',
        'Assistance',
        'Dommages tous accidents',
        'Accessoires et aménagements',
        'Protection juridique',
        'Garantie personnelle du conducteur',
        'Catastrophes naturelles',
        'Prêt de véhicule'
      ],
      emprunteur: [
        'Décès',
        'Invalidité',
        'Incapacité temporaire',
        'Perte d\'emploi',
        'Maladies graves',
        'Hospitalisation',
        'Invalidité partielle',
        'Incapacité professionnelle',
        'Rente de survie',
        'Exonération des primes'
      ],
      voyage: [
        'Annulation',
        'Rapatriement',
        'Bagages',
        'Responsabilité civile',
        'Frais médicaux',
        'Retard de transport',
        'Interruption de séjour',
        'Sports et loisirs',
        'Assistance juridique',
        'Capital décès'
      ]
    };
    
    return garantiesParType[typeAssurance as keyof typeof garantiesParType] || garantiesParType.auto;
  };

  const [isGenerating, setIsGenerating] = useState(false);
  const initialTarifs = calculateTarifs(demande);
  const [customTarifs, setCustomTarifs] = useState(initialTarifs);
  const [selectedGaranties, setSelectedGaranties] = useState<string[]>(initialTarifs.garanties);
  const [emailSubject, setEmailSubject] = useState(`Votre devis d'assurance ${getTypeLabel(demande?.type_assurance || '')}`);

  const allGaranties = getAllGaranties(demande?.type_assurance || 'auto');

  const handleGarantieToggle = (garantie: string, checked: boolean) => {
    let newSelectedGaranties;
    if (checked) {
      newSelectedGaranties = [...selectedGaranties, garantie];
    } else {
      newSelectedGaranties = selectedGaranties.filter(g => g !== garantie);
    }
    
    setSelectedGaranties(newSelectedGaranties);
    setCustomTarifs(prev => ({
      ...prev,
      garanties: newSelectedGaranties
    }));
  };

  const getDefaultSmtpConfig = async (): Promise<SmtpConfig | null> => {
    try {
      console.log('Recherche de configuration SMTP par défaut...');
      
      const { data, error } = await supabase
        .from('smtp_configs')
        .select('*')
        .eq('enabled', true)
        .eq('is_default', true)
        .single();

      if (error) {
        console.log('Pas de config par défaut trouvée, recherche de la première config activée...', error);
        
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('smtp_configs')
          .select('*')
          .eq('enabled', true)
          .limit(1)
          .single();

        if (fallbackError) {
          console.error('Aucune configuration SMTP activée trouvée:', fallbackError);
          return null;
        }
        
        console.log('Configuration SMTP de fallback trouvée:', fallbackData?.name);
        return fallbackData;
      }

      console.log('Configuration SMTP par défaut trouvée:', data?.name);
      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération de la configuration SMTP:', error);
      return null;
    }
  };

  const getLogoSettings = async (): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'company_logo')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      return data?.value || null;
    } catch (error) {
      console.error('Erreur lors de la récupération du logo:', error);
      return null;
    }
  };

  const sendEmailWithAttachment = async (pdfBlob: Blob, smtpConfig: SmtpConfig) => {
    try {
      console.log('Conversion du PDF en base64...');
      
      const reader = new FileReader();
      const pdfBase64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier PDF'));
        reader.readAsDataURL(pdfBlob);
      });

      console.log('PDF converti, préparation de l\'email...');

      const emailPayload = {
        to: demande.email,
        subject: emailSubject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Bonjour ${demande.prenom},</h2>
            <p>Veuillez trouver ci-joint votre devis d'assurance ${getTypeLabel(demande.type_assurance)}.</p>
            <p>Ce devis est valable 30 jours à compter de la date d'émission.</p>
            <p>N'hésitez pas à nous contacter pour toute question.</p>
            <p>Cordialement,<br/>${smtpConfig.sender_name || 'AssureAI Support'}</p>
          </div>
        `,
        attachments: [
          {
            filename: `devis_${demande.nom}_${demande.prenom}.pdf`,
            content: pdfBase64,
            contentType: 'application/pdf'
          }
        ],
        smtpConfig: {
          host: smtpConfig.host,
          port: parseInt(smtpConfig.port),
          secure: smtpConfig.security === 'ssl',
          auth: {
            user: smtpConfig.username,
            pass: smtpConfig.password
          },
          from: {
            name: smtpConfig.sender_name || 'AssureAI Support',
            email: smtpConfig.sender_email || smtpConfig.username
          }
        }
      };

      console.log('Appel de l\'edge function send-email...', {
        host: smtpConfig.host,
        port: smtpConfig.port,
        to: demande.email
      });

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: emailPayload
      });

      if (error) {
        console.error('Erreur de l\'edge function:', error);
        throw new Error(`Erreur edge function: ${error.message}`);
      }

      console.log('Email envoyé avec succès:', data);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error);
      throw error;
    }
  };

  const handleGenerateAndDownload = async () => {
    setIsGenerating(true);
    try {
      const logoUrl = await getLogoSettings();
      
      const devisData: DevisData = {
        demande,
        tarifs: customTarifs,
        logoUrl: logoUrl || undefined
      };

      const doc = await generateDevisPDF(devisData);
      doc.save(`devis_${demande.nom}_${demande.prenom}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast.success("Devis PDF généré et téléchargé avec succès");
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      toast.error("Erreur lors de la génération du devis");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAndSend = async () => {
    setIsGenerating(true);
    try {
      console.log('Début de la génération et envoi du devis...');
      
      const smtpConfig = await getDefaultSmtpConfig();
      if (!smtpConfig) {
        toast.error("Aucune configuration SMTP activée trouvée. Veuillez configurer et activer une configuration SMTP dans les réglages.");
        return;
      }

      console.log('Configuration SMTP trouvée:', smtpConfig.name);

      const logoUrl = await getLogoSettings();
      
      const devisData: DevisData = {
        demande,
        tarifs: customTarifs,
        logoUrl: logoUrl || undefined
      };

      console.log('Génération du PDF avec logo...', logoUrl ? 'Logo trouvé' : 'Pas de logo');
      const doc = await generateDevisPDF(devisData);
      const pdfBlob = doc.output('blob');
      
      console.log('PDF généré, envoi de l\'email...');
      
      await sendEmailWithAttachment(pdfBlob, smtpConfig);
      
      toast.success(`Devis envoyé avec succès à ${demande.email}`);
      onClose();
    } catch (error) {
      console.error('Erreur lors de l\'envoi du devis:', error);
      
      let errorMessage = "Erreur lors de l'envoi du devis.";
      
      if (error.message?.includes('Failed to send a request to the Edge Function')) {
        errorMessage = "Impossible de contacter le service d'envoi d'email. Vérifiez votre connexion.";
      } else if (error.message?.includes('edge function')) {
        errorMessage = "Erreur du service d'envoi d'email. Vérifiez la configuration SMTP.";
      } else if (error.message?.includes('SMTP')) {
        errorMessage = "Erreur de configuration SMTP. Vérifiez les paramètres du serveur de messagerie.";
      }
      
      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!demande) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Génération de devis - {demande.nom} {demande.prenom}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3">Informations client</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Nom:</span>
                <span className="ml-2 font-medium">{demande.nom} {demande.prenom}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>
                <span className="ml-2 font-medium">{demande.email}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Téléphone:</span>
                <span className="ml-2 font-medium">{demande.telephone}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Type:</span>
                <Badge variant="outline" className="ml-2">
                  {getTypeLabel(demande.type_assurance)}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-3">Tarification</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="prime_mensuelle">Prime mensuelle (€)</Label>
                <Input
                  id="prime_mensuelle"
                  type="number"
                  value={customTarifs.prime_mensuelle}
                  onChange={(e) => setCustomTarifs(prev => ({
                    ...prev,
                    prime_mensuelle: parseFloat(e.target.value) || 0
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="prime_annuelle">Prime annuelle (€)</Label>
                <Input
                  id="prime_annuelle"
                  type="number"
                  value={customTarifs.prime_annuelle}
                  onChange={(e) => setCustomTarifs(prev => ({
                    ...prev,
                    prime_annuelle: parseFloat(e.target.value) || 0
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="franchise">Franchise (€)</Label>
                <Input
                  id="franchise"
                  type="number"
                  value={customTarifs.franchise}
                  onChange={(e) => setCustomTarifs(prev => ({
                    ...prev,
                    franchise: parseFloat(e.target.value) || 0
                  }))}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Garanties disponibles</h3>
            <div className="max-h-48 overflow-y-auto space-y-2 border rounded-lg p-4">
              {allGaranties.map((garantie, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`garantie-${index}`}
                    checked={selectedGaranties.includes(garantie)}
                    onCheckedChange={(checked) => handleGarantieToggle(garantie, checked as boolean)}
                  />
                  <Label htmlFor={`garantie-${index}`} className="text-sm cursor-pointer">
                    {garantie}
                  </Label>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <p className="text-sm text-muted-foreground">
                {selectedGaranties.length} garantie{selectedGaranties.length > 1 ? 's' : ''} sélectionnée{selectedGaranties.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <Separator />

          <div>
            <Label htmlFor="email_subject">Objet de l'email</Label>
            <Input
              id="email_subject"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button 
              onClick={handleGenerateAndDownload}
              disabled={isGenerating}
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Télécharger PDF
            </Button>
            <Button 
              onClick={handleGenerateAndSend}
              disabled={isGenerating}
            >
              <Send className="w-4 h-4 mr-2" />
              {isGenerating ? "Génération en cours..." : "Générer et Envoyer"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DevisGenerationModal;
