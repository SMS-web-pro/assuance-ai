import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Send } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import NativeVoiceChatIntegration from "./NativeVoiceChatIntegration";
import AIDataExtractor from "./AIDataExtractor";
import InteractiveAvatar from "./InteractiveAvatar";
import { supabase } from "@/integrations/supabase/client";
import { useAITracking } from "@/hooks/useTracking";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  insuranceType: string;
}

const ChatInterface = ({ insuranceType }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastAgentMessage, setLastAgentMessage] = useState<string>("");
  const [currentDemandeId, setCurrentDemandeId] = useState<string | null>(null);
  const [conversationStartTime, setConversationStartTime] = useState<number>(Date.now());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { trackNewAIDemand, trackAIAgentInteraction, trackConversationComplete } = useAITracking();

  // Fonction pour mettre à jour le statut d'une demande
  const updateDemandeStatus = async (demandeId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('demandes_assurance')
        .update({ statut: status }) // Correction du nom de la colonne
        .eq('id', demandeId);
      
      if (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
        throw error;
      }
      console.log(`Statut de la demande ${demandeId} mis à jour avec succès: ${status}`);
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut de la demande:', error);
      return false;
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fonction pour extraire l'email des messages
  const extractClientEmailFromMessages = (): string | null => {
    // Expression régulière pour trouver un email dans le texte
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    
    // Parcourir tous les messages de l'utilisateur
    for (const message of messages) {
      if (message.role === 'user') {
        const emailMatch = message.content.match(emailRegex);
        if (emailMatch && emailMatch.length > 0) {
          console.log('Email trouvé dans le message:', emailMatch[0]);
          return emailMatch[0];
        }
      }
    }
    
    // Si aucun email n'est trouvé, vérifier dans les messages de l'assistant
    for (const message of messages) {
      if (message.role === 'assistant') {
        const emailMatch = message.content.match(emailRegex);
        if (emailMatch && emailMatch.length > 0) {
          console.log('Email trouvé dans la réponse de l\'assistant:', emailMatch[0]);
          return emailMatch[0];
        }
      }
    }
    
    console.log('Aucun email trouvé dans les messages');
    return null;
  };

  // Fonction pour extraire le nom du client des messages
  const extractClientNameFromMessages = (): string => {
    // Essayer de trouver un message qui contient une salutation avec un nom
    for (const message of messages) {
      if (message.role === 'user') {
        // Chercher des motifs comme "Je m'appelle X", "Mon nom est X", etc.
        const nameMatch = message.content.match(/(?:je m'appelle|mon nom est|nom:?|pr[ée]nom:?)\s+([A-Za-zÀ-ÿ-]+(?:\s+[A-Za-zÀ-ÿ-]+)*)/i);
        if (nameMatch && nameMatch[1]) {
          const name = nameMatch[1].trim();
          console.log('Nom trouvé dans le message:', name);
          return name;
        }
      }
    }
    
    console.log('Aucun nom trouvé, utilisation de "Client" par défaut');
    return 'Client';
  };

  // Fonction pour générer le message de confirmation
  const generateConfirmationMessage = (): string => {
    return "Pour confirmer votre demande et recevoir une copie par email, veuillez répondre par 'Oui, je confirme' ou simplement 'Confirmer'. Si vous souhaitez apporter des modifications, dites-moi ce que vous voulez changer.";
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getSystemPrompt = (type: string) => {
    const typeLabels: Record<string, string> = {
      "Assurance Auto": "automobile",
      "Assurance Habitation": "habitation",
      "Assurance Santé": "santé",
      "Assurance Moto": "moto",
      "Assurance Emprunteur": "emprunteur",
      "Assurance Voyage": "voyage"
    };
    const typeLabel = typeLabels[type] || "assurance";

    return `### ROLE
Tu es l'expert n°1 en courtage d'assurance en France et en ingénierie de conversion (Lead Generation). Tu travailles pour le cabinet AssureAI. Ton objectif est d'aider l'utilisateur à analyser ses besoins en assurance ${typeLabel} tout en collectant ses informations pour un rappel humain, en stricte conformité avec la loi française du 11/08/2026.

### MISSION
1. Accueillir l'utilisateur de manière chaleureuse et professionnelle.
2. Pose UNE SEULE question à la fois (pas de bloc de questions) pour qualifier son besoin.
3. Crée une "friction positive" : Valorise tes conseils IA pour donner envie de laisser ses coordonnées.

### CONFORMITÉ LÉGALE (RGPD & LOI CAZENAVE 2026)
- Avant de demander le numéro de téléphone, tu DOIS obligatoirement afficher et faire accepter cette mention :
"Conformément à la réglementation sur le démarchage téléphonique, en validant ce formulaire, vous acceptez d'être rappelé par le cabinet AssureAI pour une étude personnalisée. Vos données sont protégées par le RGPD."
- Tu dois collecter le consentement de manière explicite (le client doit taper 'OUI' ou cliquer sur un bouton de validation).

### MÉTHODE DE CONVERSION - ÉTAPES OBLIGATOIRES

### ÉTAPE 1 : Collecte de l'identité
Demande nom et prénom. Ensuite date de naissance.

### ÉTAPE 2 : Collecte du besoin spécifique selon le type d'assurance
${type === 'Assurance Auto' ? `Pose questions sur : marque véhicule, modèle, année circulation, carburant, usage (privé/pro/mixte), bonus/malus, antécédents, options souhaitées (tous risques, bris de glace, assistance...)` : ''}
${type === 'Assurance Habitation' ? `Pose questions sur : type logement (maison/appartement), usage (résidence principale/secondaire/location), superficie m², nombre pièces, année construction, sécurité, valeur biens, antécédents` : ''}
${type === 'Assurance Santé' ? `Pose questions sur : situation familiale, profession, régime sécurité sociale, couverture actuelle, besoins spécifiques (optique/dentaire/hospitalisation), nombre personnes à assurer` : ''}
${type === 'Assurance Moto' ? `Pose questions sur : type deux-roues, marque/modèle, année circulation, usage (quotidien/loisirs), bonus/malus, antécédents` : ''}
${type === 'Assurance Emprunteur' ? `Pose questions sur : situation professionnelle, montant prêt, durée prêt, type bien financé, état santé général, couverture souhaitée (décès/invalidité/ITT/chômage)` : ''}
${type === 'Assurance Voyage' ? `Pose questions sur : destination, dates séjour, motif (tourisme/affaires/études), nombre voyageurs, âge voyageurs, couverture souhaitée (annulation/soins/rapatriement/bagages)` : ''}

### ÉTAPE 3 : Collecte email
Demande l'adresse email.

### ÉTAPE 4 : FICHE RÉCAPITULATIVE
Une fois les données collectées (SAUF téléphone), affiche une fiche récapitulative professionnelle avec toutes les informations. Demande si l'utilisateur souhaite modifier.

### ÉTAPE 5 : VALEUR + FOURCHETTE D'ÉCONOMIE (FRICTION POSITIVE)
Après validation, DONNE UNE VALEUR avant de demander le téléphone. Exemple :
"D'après vos réponses, vous pourriez économiser entre 15% et 25% sur votre cotisation actuelle tout en améliorant votre couverture ${typeLabel}."
Puis enchaîne avec l'étape 6.

### ÉTAPE 6 : CONSENTEMENT RGPD OBLIGATOIRE
AVANT de demander le téléphone, tu DOIS afficher EXACTEMENT cette mention :
"Conformément à la réglementation sur le démarchage téléphonique, en validant ce formulaire, vous acceptez d'être rappelé par le cabinet AssureAI pour une étude personnalisée de votre demande d'assurance ${typeLabel}. Vos données sont protégées par le RGPD et ne seront jamais partagées à des tiers."
Puis demande : "Acceptez-vous d'être rappelé ? Répondez par OUI pour valider."

### ÉTAPE 7 : COLLECTE DU TÉLÉPHONE (OBLIGATOIRE)
SI l'utilisateur a répondu "OUI" au consentement RGPD, demande le numéro de téléphone avec :
"Parfait ! Pour finaliser votre étude personnalisée et bloquer cette fourchette d'économie, quel est le meilleur numéro pour vous joindre ?"
Le numéro de téléphone est OBLIGATOIRE. La conversation ne peut pas se terminer sans numéro de téléphone.

### ÉTAPE 8 : MESSAGE FINAL
Termine TOUJOURS par ce message en insérant le numéro de téléphone collecté :
"Parfait ! Vos informations ont été validées avec succès.
Un de nos experts en assurance ${typeLabel} va maintenant traiter soigneusement votre demande et préparer une étude comparative personnalisée qui répondra parfaitement à vos besoins.
📞 Nous vous contacterons au [NUMÉRO] très prochainement pour vous présenter les meilleures options adaptées à votre profil.
Merci de votre confiance et à très bientôt ! 🎯"

### RÈGLES FONDAMENTALES
- Tu utilises TOUJOURS le "Vous"
- Tu poses UNE SEULE question à la fois
- Tu ne répètes JAMAIS le nom ou le prénom de l'utilisateur
- Tu ne mentionnes JAMAIS de format de date spécifique
- Tu ne donnes JAMAIS de tarif final précis (erreurs juridiques), mais une "fourchette d'économie potentielle"
- Ne donne pas de tarif final précis, mais une "fourchette d'économie potentielle"
- Le numéro de téléphone est OBLIGATOIRE pour terminer la conversation
- La mention RGPD est OBLIGATOIRE. Tu ne dois JAMAIS demander le téléphone sans avoir affiché cette mention et obtenu le consentement "OUI" de l'utilisateur.`;
  };

  useEffect(() => {
    if (messages.length === 0) {
      const initialMessage: Message = {
        role: "assistant",
        content: getInitialMessage(insuranceType)
      };
      setMessages([initialMessage]);
      setLastAgentMessage(initialMessage.content);
      
      // Suivi du démarrage d'une nouvelle conversation
      trackAIAgentInteraction('conversation_started', {
        insurance_type: insuranceType,
        timestamp: new Date().toISOString()
      });
    }
  }, [insuranceType]);

  const getInitialMessage = (type: string) => {
    const greetings: Record<string, string> = {
      "Assurance Auto": "Bonjour et bienvenue chez AssureAI ! Je suis votre expert en courtage d'assurance automobile. Je vais vous accompagner pour trouver la couverture idéale pour votre véhicule, tout en vous faisant potentiellelemment économiser sur votre cotisation.\n\nPour commencer, pourriez-vous me donner vos nom et prénom ?",
      "Assurance Habitation": "Bonjour et bienvenue chez AssureAI ! Je suis votre expert en courtage d'assurance habitation. Je vais analyser vos besoins pour vous proposer une couverture adaptée à votre logement.\n\nPour commencer, pourriez-vous me donner vos nom et prénom ?",
      "Assurance Santé": "Bonjour et bienvenue chez AssureAI ! Je suis votre expert en courtage de complémentaires santé. Je vais vous aider à trouver la mutuelle optimale pour vous et votre famille.\n\nPour commencer, pourriez-vous me donner vos nom et prénom ?",
      "Assurance Moto": "Bonjour et bienvenue chez AssureAI ! Je suis votre expert en courtage d'assurance moto. Je vais vous accompagner pour protéger votre deux-roues avec la meilleure couverture.\n\nPour commencer, pourriez-vous me donner vos nom et prénom ?",
      "Assurance Emprunteur": "Bonjour et bienvenue chez AssureAI ! Je suis votre expert en courtage d'assurance emprunteur. Je vais vous aider à sécuriser votre projet immobilier avec les meilleures conditions.\n\nPour commencer, pourriez-vous me donner vos nom et prénom ?",
      "Assurance Voyage": "Bonjour et bienvenue chez AssureAI ! Je suis votre expert en courtage d'assurance voyage. Je vais vous accompagner pour partir l'esprit tranquille avec une couverture adaptée.\n\nPour commencer, pourriez-vous me donner vos nom et prénom ?"
    };
    return greetings[type as keyof typeof greetings] || greetings["Assurance Auto"];
  };

  const sendAdminNotification = async (clientEmail: string, clientName: string) => {
    console.log('Début de l\'envoi de la notification admin pour:', clientEmail, clientName);
    try {
      // Récupérer la configuration SMTP
      console.log('Récupération de la configuration SMTP...');
      const { data: smtpConfig, error: smtpError } = await supabase
        .from('smtp_configs')
        .select('*')
        .eq('enabled', true)
        .eq('is_default', true)
        .single();

      if (smtpError || !smtpConfig) {
        const errorMsg = smtpError ? smtpError.message : 'Aucune configuration SMTP par défaut trouvée';
        console.error('Erreur de configuration SMTP:', errorMsg);
        return false;
      }
      
      console.log('Configuration SMTP récupérée:', {
        host: smtpConfig.host,
        port: smtpConfig.port,
        from: smtpConfig.sender_email
      });

      // Créer le contenu HTML de l'email d'administration
      const emailHtml = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 0; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
          <!-- En-tête -->
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 30px 20px; color: white; text-align: center;">
            <h1 style="margin: 0 0 10px 0; font-size: 24px; font-weight: 600;">Nouvelle Demande de Devis</h1>
            <p style="margin: 0; opacity: 0.9; font-size: 16px;">Une nouvelle demande nécessite votre attention</p>
          </div>
          
          <!-- Contenu principal -->
          <div style="padding: 30px;">
            <p style="margin: 0 0 20px 0; color: #333; line-height: 1.6;">
              Bonjour,<br><br>
              Une nouvelle demande de devis a été soumise par <strong>${clientName}</strong> (${clientEmail}) pour une <strong>${insuranceType || 'assurance'}</strong>.
            </p>
            
            <!-- Détails de la demande -->
            <div style="background: #f8fafc; border-left: 4px solid #2563eb; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
              <h2 style="margin: 0 0 15px 0; color: #1e3a8a; font-size: 18px;">📋 Détails de la Demande</h2>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; width: 40%; color: #64748b;">Client</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${clientName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Email</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${clientEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Type d'assurance</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${insuranceType || 'Non spécifié'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Date de la demande</td>
                  <td style="padding: 8px 0;">${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                </tr>
              </table>
              
              <div style="margin-top: 20px; text-align: center;">
                <a href="${window.location.origin}/admin/demandes" style="display: inline-block; background: #2563eb; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; font-weight: 500;">
                  Voir la demande dans l'interface d'administration
                </a>
              </div>
            </div>
            
            <p style="margin: 0; color: #334155; line-height: 1.6;">
              Cordialement,<br>
              <strong style="color: #1e3a8a;">L'équipe AssureAI</strong>
            </p>
          </div>
          
          <!-- Pied de page -->
          <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; color: #94a3b8; font-size: 12px;">
              © ${new Date().getFullYear()} AssureAI - Tous droits réservés
            </p>
          </div>
        </div>
      `;

      // Adresse email de l'administrateur
      const adminEmails = [
        'admin@assuranceia.com',
        'sahabyoussef@gmail.com',  // Email de test
        'demo.admin@gmail.com'     // Email de test
      ];
      
      console.log('Envoi de la notification aux administrateurs:', adminEmails);
      
      // Envoyer à tous les administrateurs
      const sendPromises = adminEmails.map(async (adminEmail) => {

      // Préparer les données pour l'edge function
      const emailData = {
        to: adminEmail,
        subject: `Nouvelle demande de devis - ${clientName}`,
        html: emailHtml,
        smtpConfig: {
          host: smtpConfig.host,
          port: parseInt(smtpConfig.port, 10),
          secure: smtpConfig.security === 'ssl' || smtpConfig.security === 'tls',
          auth: {
            user: smtpConfig.username,
            pass: smtpConfig.password
          },
          from: smtpConfig.sender_email,
          replyTo: smtpConfig.sender_email
        },
        sender: {
          name: smtpConfig.sender_name || 'AssureAI Notifications',
          email: smtpConfig.sender_email || smtpConfig.username
        }
      };

        console.log('Appel de la fonction send-email pour:', adminEmail);
        
        try {
          const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-email', {
            body: emailData
          });

          if (emailError) {
            console.error(`Erreur lors de l'envoi à ${adminEmail}:`, emailError);
            return { success: false, email: adminEmail, error: emailError };
          }

          console.log(`Notification envoyée avec succès à ${adminEmail}`);
          return { success: true, email: adminEmail };
        } catch (error) {
          console.error(`Exception lors de l'envoi à ${adminEmail}:`, error);
          return { success: false, email: adminEmail, error };
        }
      });

      // Attendre que tous les envois soient terminés
      const results = await Promise.all(sendPromises);
      
      // Vérifier les résultats
      const failedSends = results.filter(r => !r.success);
      
      if (failedSends.length > 0) {
        console.error('Échec de l\'envoi à certains administrateurs:', failedSends);
        if (failedSends.length === results.length) {
          // Tous les envois ont échoué
          throw new Error('Échec de l\'envoi à tous les administrateurs');
        }
      }
      
      console.log('Notifications admin traitées avec succès');
      return true;
    } catch (error) {
      console.error('Erreur dans sendAdminNotification:', error);
      return false;
    }
  };

  const sendConfirmationEmail = async (clientEmail: string, clientName: string) => {
    try {
      // Récupérer la configuration SMTP
      const { data: smtpConfig, error: smtpError } = await supabase
        .from('smtp_configs')
        .select('*')
        .eq('enabled', true)
        .eq('is_default', true)
        .single();

      if (smtpError || !smtpConfig) {
        throw new Error('Aucune configuration SMTP active trouvée');
      }

      // Générer un numéro de demande unique s'il n'existe pas
      const demandeNumber = currentDemandeId || `DEM-${Date.now()}`;
      
      // Extraire le prénom du nom complet pour une salutation plus personnelle
      const prenom = clientName.split(' ')[0] || 'Client';

      // Créer le contenu HTML de l'email avec une meilleure organisation
      const emailHtml = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 640px; margin: 0 auto; padding: 0; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden;">
          <!-- En-tête -->
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 30px 20px; color: white; text-align: center;">
            <h1 style="margin: 0 0 10px 0; font-size: 24px; font-weight: 600;">Confirmation de votre demande de devis</h1>
            <p style="margin: 0; opacity: 0.9; font-size: 16px;">Votre demande a bien été enregistrée</p>
          </div>
          
          <!-- Contenu principal -->
          <div style="padding: 30px;">
            <p style="margin: 0 0 20px 0; color: #333; line-height: 1.6;">
              Bonjour ${prenom},<br><br>
              Nous vous remercions pour votre confiance et vous confirmons que votre demande de devis pour une <strong>${insuranceType || 'assurance'}</strong> a bien été enregistrée sous le numéro <strong>${demandeNumber}</strong>.
            </p>
            
            <!-- Fiche récapitulative -->
            <div style="background: #f8fafc; border-left: 4px solid #2563eb; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
              <h2 style="margin: 0 0 15px 0; color: #1e3a8a; font-size: 18px;">📋 Fiche Récapitulative</h2>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; width: 40%; color: #64748b;">Numéro de demande</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 500;">${demandeNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Date de la demande</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; color: #64748b;">Type d'assurance</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${insuranceType || 'Non spécifié'}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Statut</td>
                  <td style="padding: 8px 0; color: #15803d; font-weight: 500;">En cours de traitement</td>
                </tr>
              </table>
            </div>
            
            <!-- Prochaines étapes -->
            <div style="margin: 30px 0 25px 0;">
              <h3 style="margin: 0 0 12px 0; color: #1e293b; font-size: 18px;">Prochaines étapes</h3>
              <ol style="margin: 0; padding-left: 20px; color: #334155; line-height: 1.8;">
                <li>Notre équipe d'experts analyse votre demande</li>
                <li>Un conseiller vous contactera sous 24h ouvrées</li>
                <li>Réception de votre devis personnalisé</li>
              </ol>
            </div>
            
            <!-- Contact -->
            <div style="background: #f1f5f9; padding: 18px; border-radius: 8px; margin: 30px 0 25px 0;">
              <h3 style="margin: 0 0 12px 0; color: #1e293b; font-size: 16px;">📞 Besoin d'aide ?</h3>
              <p style="margin: 0 0 10px 0; color: #334155; font-size: 15px;">
                Notre service client est à votre disposition du lundi au vendredi de 9h à 18h.
              </p>
              <p style="margin: 0; color: #2563eb; font-weight: 500;">
                📞 01 23 45 67 89<br>
                ✉️ contact@assureai.fr
              </p>
            </div>
            
            <p style="margin: 0 0 20px 0; color: #334155; line-height: 1.6;">
              Nous vous remercions pour votre confiance et restons à votre disposition pour toute information complémentaire.
            </p>
            
            <p style="margin: 0; color: #334155; line-height: 1.6;">
              Cordialement,<br>
              <strong style="color: #1e3a8a;">L'équipe AssureAI</strong>
            </p>
          </div>
          
          <!-- Pied de page -->
          <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0 0 10px 0; color: #64748b; font-size: 14px;">
              Ceci est un email automatique, merci de ne pas y répondre.
            </p>
            <p style="margin: 0; color: #94a3b8; font-size: 12px;">
              © ${new Date().getFullYear()} AssureAI - Tous droits réservés<br>
              <a href="https://www.assureai.fr" style="color: #3b82f6; text-decoration: none;">www.assureai.fr</a> | 
              <a href="#" style="color: #3b82f6; text-decoration: none; margin: 0 8px;">Mentions légales</a> | 
              <a href="#" style="color: #3b82f6; text-decoration: none;">Politique de confidentialité</a>
            </p>
          </div>
        </div>
      `;

      // Préparer les données pour l'edge function
      const emailData = {
        to: clientEmail,
        subject: `Confirmation de votre demande de devis ${insuranceType || ''}`,
        html: emailHtml,
        smtpConfig: {
          host: smtpConfig.host,
          port: parseInt(smtpConfig.port, 10),
          secure: smtpConfig.security === 'ssl' || smtpConfig.security === 'tls',
          auth: {
            user: smtpConfig.username,
            pass: smtpConfig.password
          },
          from: smtpConfig.sender_email,
          replyTo: smtpConfig.sender_email
        },
        sender: {
          name: smtpConfig.sender_name || 'AssurConnect Support',
          email: smtpConfig.sender_email || smtpConfig.username
        }
      };

      console.log('Envoi de l\'email avec les données:', {
        to: clientEmail,
        subject: `Confirmation de votre demande de devis ${insuranceType || ''}`,
        hasHtml: !!emailHtml
      });

      // Appeler l'edge function send-email
      const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-email', {
        body: emailData
      });

      if (emailError) {
        console.error('Erreur lors de l\'appel de l\'edge function:', emailError);
        throw new Error('Échec de l\'envoi de l\'email de confirmation');
      }

      console.log('Email envoyé avec succès:', emailResult);
      return true;
    } catch (error) {
      console.error('Erreur dans sendConfirmationEmail:', error);
      throw error;
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    console.log('Message utilisateur reçu:', input);

    // Vérifier si c'est une confirmation (maintenant utilisé uniquement pour la réponse de l'assistant)
    const isConfirmation = input.toLowerCase().includes('oui') || 
      input.toLowerCase().includes('confirmer') ||
      input.toLowerCase().startsWith('confirmer') ||
      input.toLowerCase().startsWith('je confirme');

    // Si c'est une confirmation, on répond simplement à l'utilisateur
    // L'email sera envoyé automatiquement après la sauvegarde
    if (isConfirmation) {
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "✅ Parfait ! Je vais enregistrer votre demande et vous enverrai une confirmation par email." 
      }]);
      setIsLoading(false);
      return;
    }

    console.log('Sending message to chat function...', { 
      insuranceType, 
      messageCount: messages.length + 1,
      isConfirmation
    });

    try {
      // Si c'est une confirmation, envoyer l'email avant de continuer
      if (input.toLowerCase().includes('confirmer') || input.toLowerCase().includes('valider')) {
        console.log('Détection d\'une confirmation, extraction des données client...');
        const clientEmail = extractClientEmailFromMessages();
        const clientName = extractClientNameFromMessages();
        
        if (clientEmail) {
          console.log('Email client extrait:', clientEmail);
          console.log('Nom client extrait:', clientName);
          
          try {
            // Suivi de la soumission de la demande
            trackNewAIDemand(insuranceType, {
              email: clientEmail,
              name: clientName,
              demand_id: currentDemandeId || 'new_demand_'+Date.now()
            });
            
            console.log('Tentative d\'envoi de l\'email de confirmation à:', clientEmail);
            const emailSent = await sendConfirmationEmail(clientEmail, clientName);
            
            if (emailSent) {
              console.log('Email de confirmation envoyé avec succès à:', clientEmail);
              toast.success('Email de confirmation envoyé avec succès');
              
              // Mettre à jour le statut de la demande si nécessaire
              if (currentDemandeId) {
                console.log('Mise à jour du statut de la demande:', currentDemandeId);
                await updateDemandeStatus(currentDemandeId, 'email_envoye');
                
                // Suivi de l'envoi de l'email de confirmation
                trackAIAgentInteraction('email_confirmation_sent', {
                  demand_id: currentDemandeId,
                  insurance_type: insuranceType
                });
              }
            } else {
              console.warn('L\'envoi de l\'email a échoué sans erreur');
              toast.warning('L\'envoi de l\'email a échoué');
            }
          } catch (error) {
            console.error('Erreur lors de l\'envoi de l\'email de confirmation:', error);
            toast.error(`Erreur lors de l'envoi de l'email: ${error.message}`);
          }
        } else {
          console.log('Aucun email client trouvé dans les messages');
          toast.warning('Aucune adresse email trouvée pour l\'envoi de la confirmation');
        }
      }

      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          messages: [
            { role: "system", content: getSystemPrompt(insuranceType) },
            ...messages,
            userMessage
          ],
          insuranceType
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error("Erreur lors de la communication avec l'IA");
      }

      console.log('Received response from chat function:', { 
        responseLength: data?.message?.length || 0 
      });

      const assistantMessage: Message = { role: "assistant", content: data.message };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Déclencher la lecture vocale du message de l'agent
      setLastAgentMessage(data.message);
      
      // Mettre à jour le statut de la demande
      if (currentDemandeId) {
        await updateDemandeStatus(currentDemandeId, 'en_cours');
      }

      // Vérifier si c'est un message final pour le suivi
      const isFinalMessage = data.message && (
        data.message.includes('📞 Nous vous contacterons au') || 
        data.message.includes('Merci de votre confiance')
      );
      
      if (isFinalMessage) {
        console.log('Final message detected, tracking conversation completion');
        const clientEmail = extractClientEmailFromMessages();
        const clientName = extractClientNameFromMessages();
        
        // Suivi de la fin de la conversation
        trackConversationComplete({
          duration: Date.now() - conversationStartTime,
          messagesCount: messages.length + 1, // +1 pour le message actuel
          demandType: insuranceType
        });
        
        // Suivi supplémentaire avec plus de détails
        trackAIAgentInteraction('conversation_completed', {
          duration: Date.now() - conversationStartTime,
          messagesCount: messages.length + 1,
          demandType: insuranceType,
          email: clientEmail || '',
          name: clientName || 'Anonymous',
          demand_id: currentDemandeId || 'unknown'
        });
        
        // Suivi de l'événement de conversion
        trackAIAgentInteraction('conversion_complete', {
          demand_id: currentDemandeId || 'unknown',
          insurance_type: insuranceType,
          email: clientEmail || '',
          name: clientName || 'Anonymous'
        });
      }

    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la communication avec l'IA");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceMessage = (message: string) => {
    setInput(message);
    // Envoyer automatiquement le message vocal
    setTimeout(() => {
      if (message.trim()) {
        const userMessage: Message = { role: "user", content: message };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        // Appeler handleSend logic ici
        supabase.functions.invoke('chat', {
          body: {
            messages: [
              { role: "system", content: getSystemPrompt(insuranceType) },
              ...messages,
              userMessage
            ],
            insuranceType
          }
        }).then(({ data, error }) => {
          if (error) {
            console.error('Supabase function error:', error);
            toast.error("Erreur lors de la communication avec l'IA");
          } else {
            const assistantMessage: Message = { role: "assistant", content: data.message };
            setMessages(prev => [...prev, assistantMessage]);
            setLastAgentMessage(data.message);
          }
          setIsLoading(false);
        }).catch((error) => {
          console.error("Erreur:", error);
          toast.error("Erreur lors de la communication avec l'IA");
          setIsLoading(false);
        });
      }
    }, 100);
  };

  // Fonction pour gérer la sauvegarde réussie et envoyer les emails
  const handleSaveSuccess = async (clientData: any) => {
    console.log('=== DÉBUT handleSaveSuccess ===');
    console.log('Données client reçues:', JSON.stringify(clientData, null, 2));
    
    try {
      // Extraire l'email et le nom du client des données sauvegardées
      const clientEmail = clientData.email || extractClientEmailFromMessages();
      const clientName = clientData.nom || clientData.prenom || extractClientNameFromMessages() || 'Client';
      
      console.log('Email client extrait:', clientEmail);
      console.log('Nom client extrait:', clientName);
      
      if (clientEmail) {
        console.log('=== ENVOI DE L\'EMAIL DE CONFIRMATION ===');
        console.log('Destinataire:', clientEmail);
        
        // Envoyer d'abord l'email de confirmation au client
        const emailSent = await sendConfirmationEmail(clientEmail, clientName);
        
        if (emailSent) {
          console.log('=== EMAIL DE CONFIRMATION ENVOYÉ AVEC SUCCÈS ===');
          
          // Ensuite, envoyer la notification à l'administrateur
          console.log('=== ENVOI DE LA NOTIFICATION ADMIN ===');
          try {
            const notificationSent = await sendAdminNotification(clientEmail, clientName);
            if (notificationSent) {
              console.log('=== NOTIFICATION ADMIN ENVOYÉE AVEC SUCCÈS ===');
            } else {
              console.warn('=== ÉCHEC DE L\'ENVOI DE LA NOTIFICATION ADMIN (retourné false) ===');
            }
          } catch (adminError) {
            console.error('=== ERREUR LORS DE L\'ENVOI DE LA NOTIFICATION ADMIN ===', adminError);
            // Ne pas bloquer le flux en cas d'échec de la notification admin
          }
          
          // Mettre à jour l'interface utilisateur
          setMessages(prev => [...prev, { 
            role: "assistant", 
            content: "✅ Votre demande a été enregistrée avec succès ! Un email de confirmation vous a été envoyé. Un conseiller vous contactera bientôt pour finaliser votre devis personnalisé." 
          }]);
          
          // Mettre à jour le statut de la demande si nécessaire
          if (currentDemandeId) {
            await updateDemandeStatus(currentDemandeId, 'email_envoye');
          }
        } else {
          throw new Error('Échec de l\'envoi de l\'email de confirmation');
        }
      } else {
        console.warn('Aucun email trouvé pour l\'envoi de la confirmation');
        throw new Error('Aucune adresse email trouvée');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email de confirmation:', error);
      // Ajouter un message d'erreur à l'utilisateur
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: "✅ Votre demande a été enregistrée, mais nous n'avons pas pu vous envoyer d'email de confirmation. Notre équipe vous contactera prochainement." 
      }]);
    }
  };

  return (
    <div className="flex flex-col h-[800px] w-full max-w-4xl mx-auto">
      <AIDataExtractor 
        messages={messages} 
        insuranceType={insuranceType} 
        onSaveSuccess={handleSaveSuccess}
      />
      
      {/* Avatar interactif */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <InteractiveAvatar insuranceType={insuranceType} isActive={true} />
      </div>
      
      {/* Chat Messages - Expanded Area */}
      <div ref={chatContainerRef} className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="px-6 py-6">
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl p-4 shadow-sm ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-white text-gray-900 border border-gray-200"
                    }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed text-sm">
                      {message.content}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-900 border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Voice Chat Integration avec le système natif GRATUIT - SEULEMENT ACTIF */}
      <div className="p-4 border-t bg-gray-50">
        <NativeVoiceChatIntegration 
          onSendMessage={handleVoiceMessage}
          lastAgentMessage={lastAgentMessage}
          insuranceType={insuranceType}
          isActive={true}
        />
      </div>

      {/* Input Area */}
      <div className="flex gap-2 p-4 border-t bg-white">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tapez votre message..."
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          disabled={isLoading}
          className="flex-1 h-12"
        />
        <Button onClick={handleSend} disabled={isLoading || !input.trim()} className="h-12 px-6">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default ChatInterface;
