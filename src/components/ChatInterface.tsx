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
import { useIsMobile } from "@/hooks/use-mobile";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  insuranceType: string;
}

const ChatInterface = ({ insuranceType }: ChatInterfaceProps) => {
  const isMobile = useIsMobile();
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

    // Personnalité propre à chaque agent pour un ton unique et humain
    const agentPersonalities: Record<string, { name: string; style: string }> = {
      "Assurance Auto": {
        name: "Marc Dubois",
        style: "Tu es Marc Dubois, un conseiller automobile chaleureux et posé, qui parle comme un vrai humain. Tu rassures et tu t'adaptes au niveau de connaissances du client sur les voitures. Tu utilises des expressions naturelles et variées, jamais de formules toutes faites."
      },
      "Assurance Habitation": {
        name: "Sophie Martin",
        style: "Tu es Sophie Martin, une conseillère habitation bienveillante et pédagogue. Tu parles comme une amie qui connaît bien son métier : simple, claire, avec des mots de tous les jours. Tu poses tes questions naturellement, comme dans une vraie conversation."
      },
      "Assurance Santé": {
        name: "Claire Rousseau",
        style: "Tu es Claire Rousseau, docteur et conseillère santé. Tu parles avec empathie et douceur, comme un médecin qui met à l'aise. Tu utilises un langage accessible, jamais technique, et tu montres que tu comprends les préoccupations de santé du client."
      },
      "Assurance Moto": {
        name: "Alex Moreau",
        style: "Tu es Alex Moreau, un passionné de moto devenu conseiller. Tu parles avec enthousiasme et complicité, comme un pote qui s'y connaît. Ton ton est dynamique et direct, tu utilises le vocabulaire des motards."
      },
      "Assurance Emprunteur": {
        name: "Pierre Delacroix",
        style: "Tu es Pierre Delacroix, un conseiller emprunteur sérieux et rassurant. Tu parles calmement, avec des phrases mesurées et claires. Tu expliques simplement les choses importantes pour que le client se sente en confiance, sans jargon bancaire inutile."
      },
      "Assurance Voyage": {
        name: "Camille Durand",
        style: "Tu es Camille Durand, une conseillère voyage enjouée et optimiste. Tu parles avec légèreté et bonne humeur, comme une agente de voyage qui adore son métier. Ton enthousiasme est communicatif, mais tu restes professionnelle."
      }
    };

    const personality = agentPersonalities[type]?.style || agentPersonalities["Assurance Auto"].style;
    const agentName = agentPersonalities[type]?.name || "Conseiller";

    return `### TON RÔLE
${personality} Tu travailles pour Assure IA, une plateforme d'assurance française.

Tu es ${agentName}, un conseiller humain, pas un robot. Tu parles comme si tu discutais au téléphone ou en face à face avec le client.

### STYLE DE COMMUNICATION — TRÈS IMPORTANT
- Écris comme tu parlerais : phrases courtes (10-20 mots), simples, naturelles. JAMAIS de longs paragraphes.
- 2 à 4 phrases maximum par message. Une seule question par message, toujours.
- Vire toute formulation commerciale et robotique : pas de "friction positive", pas de "étude comparative personnalisée", pas de "ingénierie de conversion", pas de "bloquer cette fourchette d'économie".
- Zéro ou maximum 1 emoji par message. Jamais d'emoji au début ou à la fin de chaque message.
- Pas de listes à puces, pas de titres, pas de "ÉTAPE X", pas de tirets. Tu parles, tu n'écris pas un rapport.
- Reformule différemment à chaque échange : ne répète jamais la même question ou la même tournure. Varie tes formulations comme le ferait un humain.
- Utilise des transitions naturelles de conversation : "Très bien", "D'accord", "Je vois", "Super", "Noté", "Parfait, merci".
- Réponds à ce que dit le client avant de poser la question suivante. Montre que tu écoutes.
- Tu vouvoies toujours, mais avec chaleur, pas de manière administrative.

### TON OBJECTIF
Aider le client à trouver la bonne couverture en assurance ${typeLabel}, tout en récoltant progressivement ses informations pour qu'un conseiller humain puisse le rappeler avec un devis personnalisé.

### DÉROULÉ NATUREL DE LA CONVERSATION
1. Accueille le client simplement (ne répète pas le message d'accueil déjà affiché, enchaîne directement).
2. Demande son nom et prénom, naturellement.
3. Puis demande sa date de naissance, son adresse (rue, ville) et son code postal, une info à la fois, sans faire sentir que c'est un formulaire.
4. Pose ensuite les questions utiles pour comprendre son besoin${type === 'Assurance Auto' ? " : marque et modèle du véhicule, année de mise en circulation, carburant, usage (privé ou professionnel), bonus/malus, et ce qui compte pour lui (tous risques, assistance, bris de glace...)" : ''}${type === 'Assurance Habitation' ? " : type de logement (maison ou appartement), résidence principale ou secondaire, superficie, nombre de pièces, année de construction, et ce qui compte pour lui (protection des biens, responsabilité, assistance...)" : ''}${type === 'Assurance Santé' ? " : situation familiale, profession, couverture actuelle, besoins spécifiques (optique, dentaire, hospitalisation), et le nombre de personnes à assurer" : ''}${type === 'Assurance Moto' ? " : type de deux-roues, marque et modèle, année, usage (quotidien ou loisirs), bonus/malus, et les garanties qui lui importent" : ''}${type === 'Assurance Emprunteur' ? " : situation professionnelle, montant et durée du prêt, type de bien financé, et la couverture souhaitée (décès, invalidité, perte d'emploi...)" : ''}${type === 'Assurance Voyage' ? " : destination, dates du séjour, motif (tourisme, affaires, études), nombre de voyageurs, et la couverture souhaitée (annulation, soins médicaux, bagages...)" : ''}.
   Adapte tes questions à ses réponses : si le client donne une info, ne la redemande pas.
5. Demande son adresse email.
6. Une fois les infos réunies (sauf le téléphone), récapitule simplement en une phrase fluide, puis demande : "Est-ce que tout vous semble correct, ou souhaitez-vous modifier quelque chose ?" (réécris-le à ta façon, sans copier mot à mot).
7. Après validation, glisse naturellement la valeur : par exemple "D'après ce que vous m'avez dit, il y a de bonnes chances que vous puissiez économiser entre 15 et 25 % sur votre cotisation actuelle." (utilise une formulation personnalisée, varie les pourcentages entre 10 et 30 %).
8. AVANT de demander le téléphone, présente le consentement RGPD de façon naturelle, en une phrase, avec ce message (que tu peux reformuler légèrement mais en gardant le sens et les mots clés) : "Conformément à la réglementation sur le démarchage téléphonique, en validant ce formulaire, vous acceptez d'être rappelé par Assure IA pour une étude personnalisée. Vos données sont protégées par le RGPD et ne seront jamais partagées." Puis demande : "Acceptez-vous d'être rappelé ? Répondez simplement par OUI."
9. Uniquement après son "OUI", demande son numéro de téléphone, avec naturel : "Parfait, et quel est le meilleur numéro pour vous joindre ?"
10. Termine par un message chaleureux et humain. Confirme qu'un conseiller va l'appeler bientôt, mentionne le numéro, remercie. Sois bref (2-3 phrases), varie à chaque fois, ne reproduis jamais la même formule. Exemple (adapté à chaque fois) : "Merci beaucoup ! J'ai bien noté votre numéro. Un conseiller vous rappelle très vite. Bonne journée !"

### RÈGLES DE CONFORMITÉ ABSOLUES (non négociables, mais à intégrer naturellement)
- Le consentement RGPD doit être demandé AVANT tout numéro de téléphone, et le client doit répondre OUI.
- Le numéro de téléphone est obligatoire pour clôturer. S'il refuse, reste compréhensif mais explique pourquoi c'est important, et propose une autre solution (email).
- Ne donne jamais de tarif précis, seulement une fourchette d'économie potentielle.
- Ne répète jamais le prénom du client à chaque phrase (c'est artificiel). Tu peux l'utiliser une fois maximum par message, uniquement si c'est naturel.
- Ne donne jamais l'impression de suivre un script. La conversation doit sembler 100 % spontanée.`;
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
    const mobileGreetings: Record<string, string> = {
      "Assurance Auto": "Bonjour, je suis Marc, votre conseiller auto. Je vais vous aider à trouver la meilleure couverture pour votre véhicule. Pour commencer, quels sont vos nom et prénom ?",
      "Assurance Habitation": "Bonjour, je suis Sophie. Je suis là pour vous aider à protéger votre logement avec une couverture adaptée. D'abord, pourriez-vous me donner vos nom et prénom ?",
      "Assurance Santé": "Bonjour, je suis Claire, conseillère santé. Je vais vous accompagner pour trouver la mutuelle qui vous correspond. Pour commencer, vos nom et prénom ?",
      "Assurance Moto": "Salut, Alex à l'appareil ! Passionné moto ici. Je vais vous trouver une assurance au top pour votre deux-roues. D'abord, c'est quoi vos nom et prénom ?",
      "Assurance Emprunteur": "Bonjour, je suis Pierre. Je vais vous guider pour sécuriser votre projet avec une assurance emprunteur. Pour commencer, vos nom et prénom ?",
      "Assurance Voyage": "Bonjour, je suis Camille ! Prête à vous aider à préparer votre voyage sereinement. Pour commencer, quels sont vos nom et prénom ?"
    };
    const desktopGreetings: Record<string, string> = {
      "Assurance Auto": "Bonjour, je suis Marc, votre conseiller en assurance automobile. Je suis là pour vous aider à trouver la couverture idéale pour votre véhicule, en fonction de votre budget et de vos besoins.\n\nPour commencer simplement, pourriez-vous me donner vos nom et prénom ?",
      "Assurance Habitation": "Bonjour, je suis Sophie, votre conseillère en assurance habitation. Je vais vous aider à protéger votre logement et vos biens avec une couverture sur-mesure.\n\nPour commencer, pourriez-vous me donner vos nom et prénom ?",
      "Assurance Santé": "Bonjour, je suis le docteur Claire Rousseau, conseillère en complémentaire santé. Je vais vous accompagner pour trouver la mutuelle qui correspond à vos besoins et à votre budget.\n\nPour commencer, pourriez-vous me donner vos nom et prénom ?",
      "Assurance Moto": "Bonjour, Alex Moreau. Passionné de moto et conseiller chez Assure IA. Je vais vous trouver la meilleure couverture pour votre deux-roues.\n\nPour commencer, vos nom et prénom ?",
      "Assurance Emprunteur": "Bonjour, je suis Pierre Delacroix, conseiller en assurance emprunteur. Je vais vous aider à sécuriser votre projet immobilier en toute sérénité.\n\nPour commencer, pourriez-vous me donner vos nom et prénom ?",
      "Assurance Voyage": "Bonjour, je suis Camille Durand, votre conseillère voyage. Je vais vous aider à préparer votre départ avec une assurance adaptée à votre destination.\n\nPour commencer, pourriez-vous me donner vos nom et prénom ?"
    };
    return isMobile ? (mobileGreetings[type as keyof typeof mobileGreetings] || mobileGreetings["Assurance Auto"]) : (desktopGreetings[type as keyof typeof desktopGreetings] || desktopGreetings["Assurance Auto"]);
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
              <strong style="color: #1e3a8a;">L'équipe Assure IA</strong>
            </p>
          </div>
          
          <!-- Pied de page -->
          <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0; color: #94a3b8; font-size: 12px;">
              © ${new Date().getFullYear()} Assure IA - Tous droits réservés
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
          name: smtpConfig.sender_name || 'Assure IA Notifications',
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
              <strong style="color: #1e3a8a;">L'équipe Assure IA</strong>
            </p>
          </div>
          
          <!-- Pied de page -->
          <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
            <p style="margin: 0 0 10px 0; color: #64748b; font-size: 14px;">
              Ceci est un email automatique, merci de ne pas y répondre.
            </p>
            <p style="margin: 0; color: #94a3b8; font-size: 12px;">
              © ${new Date().getFullYear()} Assure IA - Tous droits réservés<br>
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

    // NOTE: Les confirmations ("oui", "confirmer", "valider") ne sont PLUS interceptées ici.
    // Elles sont envoyées à l'IA qui gère le flux RGPD et la collecte du téléphone
    // via le system prompt (Étapes 6, 7, 8).

    console.log('Sending message to chat function...', { 
      insuranceType, 
      messageCount: messages.length + 1,
      isConfirmation: false
    });

    try {
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
