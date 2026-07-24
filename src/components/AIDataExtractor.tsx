import { useEffect, useRef } from 'react';
import { useInsuranceDataCollection } from '@/hooks/useInsuranceDataCollection';
import { TypeAssurance } from '@/services/demandesService';

interface AIDataExtractorProps {
  messages: Array<{ role: string; content: string }>;
  insuranceType: string;
  onSaveSuccess?: (clientData: any) => Promise<void>;
}

const AIDataExtractor = ({ messages, insuranceType, onSaveSuccess }: AIDataExtractorProps) => {
  const typeMapping: { [key: string]: TypeAssurance } = {
    'Assurance Auto': 'auto',
    'Assurance Habitation': 'habitation', 
    'Assurance Santé': 'sante',
    'Assurance Moto': 'moto',
    'Assurance Emprunteur': 'emprunteur',
    'Assurance Voyage': 'voyage'
  };

  const mappedType = typeMapping[insuranceType];
  const { saveCollectedData } = useInsuranceDataCollection(mappedType);
  const processedRef = useRef(false);

  // Liste des noms de conseillers virtuels à exclure
  const virtualConseillers = [
    'Marc Dubois', 'Sophie Martin', 'Claire Rousseau', 'Alex Moreau', 
    'Pierre Delacroix', 'Camille Durand', 'Dr. Claire Rousseau'
  ];

  // Liste des titres à ignorer dans l'extraction du nom
  const titlesToIgnore = ['monsieur', 'madame', 'mademoiselle', 'm.', 'mme', 'mlle', 'dr', 'docteur', 'pr', 'professeur'];

  // Fonction pour détecter le consentement RGPD (utilisateur répond "OUI" après mention RGPD)
  const detectRGPDConsent = (messages: Array<{ role: string; content: string }>): { consentement: boolean; preuve: any } | null => {
    // Chercher si un message assistant contient la mention RGPD
    const rgpdMentionIndex = messages.findIndex(m => 
      m.role === 'assistant' && 
      (m.content.includes('démarchage téléphonique') || 
       m.content.includes('RGPD') || 
       m.content.includes('Loi Cazenave') ||
       m.content.includes('consentement'))
    );

    if (rgpdMentionIndex === -1) return null;

    // Chercher la réponse de l'utilisateur APRÈS la mention RGPD
    const subsequentMessages = messages.slice(rgpdMentionIndex + 1);
    const userResponse = subsequentMessages.find(m => m.role === 'user');

    if (!userResponse) return null;

    const response = userResponse.content.toLowerCase().trim();
    const consentPatterns = [
      /^oui$/i,
      /^j'accepte$/i,
      /^j'accepte$/i,
      /^c'est accepté$/i,
      /^validé$/i,
      /^valide$/i,
      /^pourquoi pas$/i,
      /^ok$/i,
      /^d'accord$/i,
      /^oui je confirme$/i,
      /^oui,? je suis d'accord$/i,
      /^oui,? c'est bon$/i
    ];

    const hasConsent = consentPatterns.some(pattern => pattern.test(response));

    if (hasConsent) {
      return {
        consentement: true,
        preuve: {
          date: new Date().toISOString(),
          message_consentement: userResponse.content,
          mention_rgpd_affichee: true
        }
      };
    }

    return null;
  };

  // Fonction pour obtenir l'IP de l'utilisateur (via API publique)
  const getUserIP = async (): Promise<string | null> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip || null;
    } catch {
      return null;
    }
  };

  // Fonction pour convertir une date française en format ISO
  const convertFrenchDateToISO = (frenchDate: string): string | null => {
    try {
      const frenchDatePattern = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
      const match = frenchDate.match(frenchDatePattern);
      
      if (match) {
        const [, day, month, year] = match;
        const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        
        const dateObj = new Date(isoDate);
        if (!isNaN(dateObj.getTime())) {
          console.log(`📅 Date convertie: ${frenchDate} → ${isoDate}`);
          return isoDate;
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Erreur lors de la conversion de date:', error);
      return null;
    }
  };

  // Fonction pour extraire les données de tout le texte de conversation
  const extractAllDataFromConversation = (messages: Array<{ role: string; content: string }>) => {
    console.log('🔍 Extraction de toutes les données de la conversation...');
    
    // Séparer les messages utilisateur et assistant
    const userMessages = messages.filter(m => m.role === 'user').map(m => m.content).join(' ');
    const allText = messages.map(m => m.content).join(' ');
    
    const extractedData: any = {};

    // Extraction du nom et prénom UNIQUEMENT des messages utilisateur - CORRIGÉ POUR NOMS COMPLETS
    console.log('🔍 Recherche nom/prénom dans:', userMessages.substring(0, 200));
    
    // Patterns pour capturer les noms complets - CORRIGÉ
    const nomCompletPatterns = [
      // Pattern spécifique pour "Je m'appelle Prénom Nom" ou "Je suis Prénom Nom"
      /(?:je\s+m'appelle|je\s+suis|bonjour,?\s*(?:je\s+suis\s*)?)\s+([A-Za-zÀ-ÿ\-']+)\s+([A-Za-zÀ-ÿ\-']+)/i,
      // Pattern pour "Mon nom est Prénom Nom"
      /mon\s+nom\s+(?:est|c'est)\s+([A-Za-zÀ-ÿ\-']+)\s+([A-Za-zÀ-ÿ\-']+)/i,
      // Pattern pour "Monsieur/Madame Prénom Nom"
      /(?:monsieur|madame|mademoiselle|m\.|mme|mlle)\s+([A-Za-zÀ-ÿ\-']+)\s+([A-Za-zÀ-ÿ\-']+)/i,
      // Pattern général pour deux mots consécutifs qui pourraient être un nom
      /\b([A-Za-zÀ-ÿ\-']+)\s+([A-Za-zÀ-ÿ\-']+)\b/g
    ];

    // Chercher tous les patterns de noms complets
    for (const pattern of nomCompletPatterns) {
      let matches;
      
      if (pattern.global) {
        matches = Array.from(userMessages.matchAll(pattern));
      } else {
        const match = userMessages.match(pattern);
        matches = match ? [match] : [];
      }
      
      for (const match of matches) {
        if (match && match.length >= 3) {
          let premierMot = match[1]?.trim();
          let deuxiemeMot = match[2]?.trim();
          
          // Ignorer les titres
          if (titlesToIgnore.includes(premierMot.toLowerCase())) {
            // Si le premier mot est un titre, le deuxième mot est le prénom
            // Chercher le troisième mot pour le nom
            const afterTitle = userMessages.match(new RegExp(`(?:monsieur|madame|mademoiselle|m\\.|mme|mlle)\\s+${premierMot}\\s+${deuxiemeMot}\\s+([A-Za-zÀ-ÿ\\-']+)`, 'i'));
            if (afterTitle && afterTitle[1]) {
              premierMot = deuxiemeMot;
              deuxiemeMot = afterTitle[1];
            }
          }
          
          if (premierMot && deuxiemeMot && premierMot !== deuxiemeMot) {
            // Vérifier que ce n'est pas un titre
            if (titlesToIgnore.includes(premierMot.toLowerCase()) || titlesToIgnore.includes(deuxiemeMot.toLowerCase())) {
              continue;
            }
            
            // Vérifier que ce n'est pas un nom de conseiller virtuel
            const fullName = `${premierMot} ${deuxiemeMot}`;
            const isVirtualConsultant = virtualConseillers.some(consultant => 
              consultant.toLowerCase().includes(fullName.toLowerCase()) ||
              fullName.toLowerCase().includes(consultant.toLowerCase())
            );

            if (!isVirtualConsultant) {
              // Convention française : Premier mot = Prénom, Deuxième mot = Nom
              extractedData.prenom = premierMot;
              extractedData.nom = deuxiemeMot;
              
              console.log(`👤 Nom complet trouvé: Prénom="${extractedData.prenom}", Nom="${extractedData.nom}"`);
              break;
            }
          }
        }
      }
      
      // Si on a trouvé un nom et prénom valides, on sort de la boucle
      if (extractedData.nom && extractedData.prenom && extractedData.nom !== extractedData.prenom) {
        break;
      }
    }

    // Si pas trouvé avec les patterns de noms complets, essayer les patterns individuels
    if (!extractedData.nom || !extractedData.prenom || extractedData.nom === extractedData.prenom) {
      // Pattern pour prénom spécifiquement mentionné
      const prenomPatterns = [
        /(?:mon\s+)?prénom\s+(?:est|c'est)\s+([A-Za-zÀ-ÿ\-']+)/i,
        /(?:je\s+m'appelle|appellez-moi)\s+([A-Za-zÀ-ÿ\-']+)(?:\s|,|\.|$)/i
      ];
      
      for (const pattern of prenomPatterns) {
        const match = userMessages.match(pattern);
        if (match && !virtualConseillers.some(name => name.toLowerCase().includes(match[1].toLowerCase()))) {
          extractedData.prenom = match[1].trim();
          console.log(`👤 Prénom seul trouvé: ${extractedData.prenom}`);
          break;
        }
      }
      
      // Pattern pour nom de famille spécifiquement mentionné
      const nomPatterns = [
        /(?:mon\s+)?nom\s+(?:de\s+famille\s+)?(?:est|c'est)\s+([A-Za-zÀ-ÿ\-']+)/i,
        /famille\s+([A-Za-zÀ-ÿ\-']+)/i
      ];
      
      for (const pattern of nomPatterns) {
        const match = userMessages.match(pattern);
        if (match && !virtualConseillers.some(name => name.toLowerCase().includes(match[1].toLowerCase()))) {
          extractedData.nom = match[1].trim();
          console.log(`👤 Nom seul trouvé: ${extractedData.nom}`);
          break;
        }
      }
    }

    // Extraction de l'email depuis les messages utilisateur
    const emailMatch = userMessages.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailMatch) {
      extractedData.email = emailMatch[1];
      console.log(`📧 Email trouvé: ${extractedData.email}`);
    }

    // Extraction du téléphone depuis les messages utilisateur
    const phonePatterns = [
      /(?:téléphone|telephone|tel|portable|mobile|numéro)[:\s]*([0-9\s\.\-\+]{10,})/i,
      /([0-9]{2}\s*[0-9]{2}\s*[0-9]{2}\s*[0-9]{2}\s*[0-9]{2})/,
      /((?:\+33|0)[1-9](?:[0-9]{8}))/
    ];

    for (const pattern of phonePatterns) {
      const match = userMessages.match(pattern);
      if (match) {
        extractedData.telephone = match[1].replace(/\s+/g, ' ').trim();
        console.log(`📞 Téléphone trouvé: ${extractedData.telephone}`);
        break;
      }
    }

    // Extraction de l'adresse complète depuis les messages utilisateur
    const adressePatterns = [
      /(?:adresse|habite(?:\s+au)?|domicile(?:\s+au)?|j'habite)[:\s]+([^.!?]*?)(?:\s*(?:code\s+postal|cp|[0-9]{5})|$)/i,
      /(?:rue|avenue|boulevard|place|impasse)[:\s]+([^.!?]*?)(?:\s*(?:code\s+postal|cp|[0-9]{5})|$)/i
    ];

    for (const pattern of adressePatterns) {
      const match = userMessages.match(pattern);
      if (match) {
        extractedData.adresse_complete = match[1].trim();
        console.log(`🏠 Adresse trouvée: ${extractedData.adresse_complete}`);
        break;
      }
    }

    // Extraction du code postal depuis les messages utilisateur
    const codePostalPatterns = [
      /(?:code\s+postal|cp)[:\s]*([0-9]{5})/i,
      /([0-9]{5})\s*(?:Paris|Lyon|Marseille|Toulouse|Nice|Nantes|Strasbourg|Montpellier|Bordeaux|Lille)/i,
      /\b([0-9]{5})\b/g
    ];

    for (const pattern of codePostalPatterns) {
      const match = userMessages.match(pattern);
      if (match) {
        extractedData.code_postal = match[1];
        console.log(`📮 Code postal trouvé: ${extractedData.code_postal}`);
        break;
      }
    }

    // Extraction de la date de naissance depuis les messages utilisateur
    const naissancePatterns = [
      /(?:né|née|naissance|date\s+de\s+naissance)[:\s]*(?:le\s+)?([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{4})/i,
      /(?:date\s+de\s+naissance)[:\s]*([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{4})/i
    ];

    for (const pattern of naissancePatterns) {
      const match = userMessages.match(pattern);
      if (match) {
        const convertedDate = convertFrenchDateToISO(match[1]);
        if (convertedDate) {
          extractedData.date_naissance = convertedDate;
          console.log(`🎂 Date de naissance trouvée: ${extractedData.date_naissance}`);
          break;
        }
      }
    }

    // Extraction spécifique pour l'assurance auto depuis les messages utilisateur
    if (mappedType === 'auto') {
      // Marque du véhicule
      const marquePatterns = [
        /(?:marque|véhicule|voiture|auto)\s*(?:est|du)?\s*[:\s]*([A-Za-zÀ-ÿ]+)/i,
        /(?:j'ai|c'est|conduit|roule)\s+une?\s+([A-Za-zÀ-ÿ]+)/i,
        /\b(Honda|Toyota|Peugeot|Renault|Citroën|Citroen|BMW|Mercedes|Audi|Volkswagen|Vw|Ford|Opel|Nissan|Hyundai|Kia|Mazda|Suzuki|Fiat|Seat|Skoda|Dacia|Tesla|Porsche|Volvo|Subaru|Mitsubishi|SsangYong|Alfa|Romeo|Jeep|Land\s*Rover|Mini|Smart|DS|Cupra)\b/i
      ];

      for (const pattern of marquePatterns) {
        const match = userMessages.match(pattern);
        if (match && match[1] && !['une', 'le', 'la', 'mon', 'ma', 'est', 'du'].includes(match[1].toLowerCase())) {
          extractedData.marque_vehicule = match[1].trim();
          console.log(`🚗 Marque trouvée: ${extractedData.marque_vehicule}`);
          break;
        }
      }

      // Modèle du véhicule
      const modelePatterns = [
        /(?:modèle|modele|model)\s*(?:est|du)?\s*[:\s]*([A-Za-zÀ-ÿ0-9\s]+?)(?:\s*[,.]|\s+(?:de|pour|essence|diesel|ann|année)|\s*$)/i,
        // Pattern pour "honda jazz" (marque suivie du modèle)
        new RegExp(`(?:${extractedData.marque_vehicule || 'XXX'})\\s+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ0-9\\s]*?)(?:\\s+(?:essence|diesel|électrique|hybride|de|pour|ann|année|model|modèle|\\d{4})|$)`, 'i'),
        // Pattern pour modèle avec chiffres ex: "308", "Clio", "Golf"
        /\b(Clio|Megane|Captur|Golf|Polo|308|3008|208|2008|C3|C5|Yaris|Corolla|Ibiza|Leon|Octavia|Superb|Sandero|Duster|Model|Jazz|Civic|Corse|I20|Tucson|Kadjar|Koleos|Qashqai|Juke|Astra|Corsa|Fabia|Rapid)\b/i
      ];

      for (const pattern of modelePatterns) {
        const match = userMessages.match(pattern);
        if (match && match[1]) {
          const modele = match[1].trim();
          // Ignorer les mots courants qui ne sont pas des modèles
          if (!['une', 'le', 'la', 'mon', 'ma', 'est', 'du', 'model', 'modèle'].includes(modele.toLowerCase())) {
            extractedData.modele_vehicule = modele;
            console.log(`🚗 Modèle trouvé: ${extractedData.modele_vehicule}`);
            break;
          }
        }
      }

      // Année de circulation du véhicule - CORRIGÉ pour distinguer de l'année de naissance
      const anneeCirculationPatterns = [
        /(?:année\s+de\s+circulation|circulation|mise\s+en\s+circulation)[:\s]*([0-9]{4})/i,
        /(?:de\s+)?([0-9]{4})(?:\s+(?:pour|de)\s+(?:circulation|mise\s+en\s+circulation))/i,
        // Pattern pour "voiture de 2018" ou "véhicule de 2020"
        /(?:voiture|véhicule|auto)\s+de\s+([0-9]{4})/i
      ];

      for (const pattern of anneeCirculationPatterns) {
        const match = userMessages.match(pattern);
        if (match) {
          const annee = parseInt(match[1]);
          if (annee >= 1950 && annee <= new Date().getFullYear()) {
            extractedData.annee_circulation = annee;
            console.log(`🚗 Année de circulation trouvée: ${extractedData.annee_circulation}`);
            break;
          }
        }
      }

      // Si pas trouvé spécifiquement, chercher une année isolée mais vérifier le contexte
      if (!extractedData.annee_circulation) {
        const contexteAnnee = userMessages.match(/(?:voiture|véhicule|auto|marque|modèle).*?([0-9]{4})/i);
        if (contexteAnnee) {
          const annee = parseInt(contexteAnnee[1]);
          if (annee >= 1950 && annee <= new Date().getFullYear()) {
            extractedData.annee_circulation = annee;
            console.log(`🚗 Année de circulation trouvée par contexte: ${extractedData.annee_circulation}`);
          }
        }
      }

      // Type de carburant
      const carburantMatch = userMessages.match(/(essence|diesel|électrique|électric|hybride|gpl)/i);
      if (carburantMatch) {
        extractedData.type_carburant = carburantMatch[1].toLowerCase();
        console.log(`⛽ Carburant trouvé: ${extractedData.type_carburant}`);
      }

      // Usage du véhicule
      const usageMatch = userMessages.match(/(?:usage|utilisation|trajet)[:\s]*(privé|professionnel|mixte|personnel|travail)/i);
      if (usageMatch) {
        const usageMapping: { [key: string]: string } = {
          'privé': 'prive',
          'personnel': 'prive',
          'professionnel': 'professionnel',
          'travail': 'professionnel',
          'mixte': 'mixte'
        };
        extractedData.usage_vehicule = usageMapping[usageMatch[1].toLowerCase()] || usageMatch[1].toLowerCase();
        console.log(`🚗 Usage trouvé: ${extractedData.usage_vehicule}`);
      }

      // Bonus/Malus
      const bonusMatch = userMessages.match(/(?:bonus|malus|coefficient)[:\s]*([0-9,.\s]+|aucun|sans)/i);
      if (bonusMatch) {
        extractedData.bonus_malus = bonusMatch[1].trim();
        console.log(`🎯 Bonus/Malus trouvé: ${extractedData.bonus_malus}`);
      }

      // Options souhaitées
      const optionsPatterns = [
        /(?:options?\s+(?:choisies?|souhaitées?|demandées?))[:\s]*([^.!?]*?)(?:\s*(?:\n|\.|!|\?|$))/i,
        /(?:couverture|formule)[:\s]*(tous\s+risques?|tiers?|vol|incendie|bris\s+de\s+glace|assistance)/i,
        /(tous\s+risques?|tiers?|vol|incendie|bris\s+de\s+glace|assistance)/i
      ];

      for (const pattern of optionsPatterns) {
        const match = allText.match(pattern);
        if (match) {
          let options = match[1].trim();
          if (options.toLowerCase().includes('tous risques')) {
            options = 'Tous risques';
          } else if (options.toLowerCase().includes('tiers')) {
            options = 'Tiers';
          }
          extractedData.options_souhaitees = options;
          console.log(`🛡️ Options trouvées: ${extractedData.options_souhaitees}`);
          break;
        }
      }
    }

    // Extraction spécifique pour l'assurance habitation
    if (mappedType === 'habitation') {
      // Type de logement
      const typeLogementMatch = userMessages.match(/(?:type\s+de\s+logement|logement|habitation)[:\s]*(maison|appartement|studio|loft)/i);
      if (typeLogementMatch) {
        extractedData.type_logement = typeLogementMatch[1].toLowerCase();
        console.log(`🏠 Type de logement trouvé: ${extractedData.type_logement}`);
      }

      // Superficie
      const superficieMatch = userMessages.match(/(?:superficie|surface|taille)[:\s]*([0-9]+)\s*(?:m²|m2|mètres?\s*carrés?)/i);
      if (superficieMatch) {
        extractedData.superficie_m2 = parseInt(superficieMatch[1]);
        console.log(`📐 Superficie trouvée: ${extractedData.superficie_m2} m²`);
      }

      // Nombre de pièces
      const nbPiecesMatch = userMessages.match(/(?:nombre\s+de\s+pièces|pièces|chambres)[:\s]*([0-9]+)/i);
      if (nbPiecesMatch) {
        extractedData.nombre_pieces = parseInt(nbPiecesMatch[1]);
        console.log(`🏠 Nombre de pièces trouvé: ${extractedData.nombre_pieces}`);
      }

      // Année de construction
      const anneeConstructionPatterns = [
        /(?:année\s+de\s+construction|construction|construite?)[:\s]*(?:en\s+)?([0-9]{4})/i,
        /(?:bâtiment|immeuble|maison)\s+de\s+([0-9]{4})/i
      ];

      for (const pattern of anneeConstructionPatterns) {
        const match = userMessages.match(pattern);
        if (match) {
          const annee = parseInt(match[1]);
          if (annee >= 1800 && annee <= new Date().getFullYear()) {
            extractedData.annee_construction = annee;
            console.log(`🏗️ Année de construction trouvée: ${extractedData.annee_construction}`);
            break;
          }
        }
      }

      // Usage du logement
      const usageMatch = userMessages.match(/(?:usage|utilisation|occupation)[:\s]*(résidence\s+principale|résidence\s+secondaire|location|locatif)/i);
      if (usageMatch) {
        extractedData.usage_logement = usageMatch[1].toLowerCase();
        console.log(`🏠 Usage trouvé: ${extractedData.usage_logement}`);
      }
    }

    // Extraction du consentement RGPD
    const rgpdConsent = detectRGPDConsent(messages);
    if (rgpdConsent) {
      extractedData.consentement_rgpd = rgpdConsent;
      console.log(`🔒 Consentement RGPD détecté:`, rgpdConsent);
    }

    console.log('📋 Toutes les données extraites:', extractedData);
    return extractedData;
  };

  useEffect(() => {
    if (!messages || messages.length === 0 || processedRef.current) return;

    console.log('🔍 AIDataExtractor: Analyse des messages...', messages.length);

    // Chercher le message final
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'assistant') return;

    const content = lastMessage.content;
    console.log('🔍 Analyse du dernier message:', content.substring(0, 200) + '...');

    // Patterns pour détecter le message final
    const finalMessagePatterns = [
      /📞\s*(?:Nous vous contacterons|Un de nos experts vous contactera)/i,
      /Merci de votre confiance/i,
      /À très bientôt/i,
      /Validation confirmée/i,
      /Votre demande a bien été enregistrée/i,
      /bien été validée/i,
      /parfait.*votre.*demande/i,
      /nos experts.*analyser/i,
      /nous vous contacterons.*prochainement/i,
      /✅.*Validation confirmée/i
    ];

    const isFinalMessage = finalMessagePatterns.some(pattern => pattern.test(content));

    if (isFinalMessage && !processedRef.current) {
      console.log('🎯 Message final détecté! Extraction et sauvegarde...');
      processedRef.current = true;
      
      try {
        // Extraire toutes les données de la conversation
        const allData = extractAllDataFromConversation(messages);
        
        // Tentative de sauvegarde immédiate
        setTimeout(async () => {
          console.log('💾 Sauvegarde des données extraites...');
          try {
            // Récupérer l'IP de l'utilisateur pour la preuve RGPD
            if (allData.consentement_rgpd) {
              const userIP = await getUserIP();
              if (userIP) {
                allData.consentement_rgpd.preuve.ip = userIP;
              }
            }

            const success = await saveCollectedData(allData);
            if (success) {
              console.log('✅ Sauvegarde réussie!');
              // Appeler la fonction de rappel après une sauvegarde réussie
              if (onSaveSuccess) {
                try {
                  await onSaveSuccess(allData);
                } catch (error) {
                  console.error('Erreur lors de l\'envoi de l\'email de confirmation:', error);
                }
              }
            } else {
              console.error('❌ Échec de la sauvegarde');
            }
          } catch (error) {
            console.error('❌ Erreur lors de la sauvegarde:', error);
          }
        }, 1000);
        
      } catch (error) {
        console.error('❌ Erreur lors de l\'extraction:', error);
      }
    }
  }, [messages, mappedType, saveCollectedData]);

  return null;
};

export default AIDataExtractor;
