
import jsPDF from 'jspdf';

export interface DevisData {
  demande: any;
  tarifs: {
    prime_mensuelle: number;
    prime_annuelle: number;
    franchise: number;
    garanties: string[];
  };
  logoUrl?: string;
}

export const calculateTarifs = (demande: any) => {
  // Calculs basiques des tarifs selon le type d'assurance
  const baseRates = {
    auto: { mensuelle: 45, annuelle: 500, franchise: 300 },
    habitation: { mensuelle: 25, annuelle: 280, franchise: 150 },
    sante: { mensuelle: 80, annuelle: 900, franchise: 0 },
    moto: { mensuelle: 35, annuelle: 400, franchise: 250 },
    emprunteur: { mensuelle: 60, annuelle: 650, franchise: 0 },
    voyage: { mensuelle: 15, annuelle: 150, franchise: 50 }
  };

  const rates = baseRates[demande?.type_assurance as keyof typeof baseRates] || baseRates.auto;

  const garanties = {
    auto: ['Responsabilité civile', 'Dommages tous accidents', 'Vol et incendie', 'Assistance 24h/24'],
    habitation: ['Responsabilité civile', 'Incendie', 'Dégâts des eaux', 'Vol et vandalisme'],
    sante: ['Hospitalisation', 'Médecine courante', 'Dentaire', 'Optique'],
    moto: ['Responsabilité civile', 'Vol et incendie', 'Équipement du pilote', 'Assistance'],
    emprunteur: ['Décès', 'Invalidité', 'Incapacité temporaire', 'Perte d\'emploi'],
    voyage: ['Annulation', 'Rapatriement', 'Bagages', 'Responsabilité civile']
  };

  return {
    prime_mensuelle: rates.mensuelle,
    prime_annuelle: rates.annuelle,
    franchise: rates.franchise,
    garanties: garanties[demande?.type_assurance as keyof typeof garanties] || garanties.auto
  };
};

// Fonction pour convertir une image en base64
const imageToBase64 = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      canvas.width = img.width;
      canvas.height = img.height;
      
      ctx?.drawImage(img, 0, 0);
      
      try {
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Impossible de charger l\'image'));
    };
    
    img.src = url;
  });
};

export const generateDevisPDF = async (data: DevisData) => {
  const doc = new jsPDF();
  
  // Configuration des couleurs (RGB values 0-255)
  const primaryColor = [41, 128, 185]; // Bleu
  const secondaryColor = [52, 73, 94]; // Gris foncé
  const lightGray = [236, 240, 241]; // Gris clair

  let logoHeight = 0;

  // En-tête avec logo si disponible
  if (data.logoUrl) {
    try {
      console.log('Chargement du logo:', data.logoUrl);
      const logoBase64 = await imageToBase64(data.logoUrl);
      
      // Ajouter le logo au PDF
      const logoWidth = 40;
      logoHeight = 20;
      
      doc.addImage(logoBase64, 'PNG', 20, 15, logoWidth, logoHeight);
      console.log('Logo ajouté au PDF avec succès');
      
    } catch (error) {
      console.error('Erreur lors de l\'ajout du logo:', error);
      // Fallback: afficher le nom de l'entreprise
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text('AssureAI', 20, 25);
      logoHeight = 10; // Espace réservé pour le texte
    }
  } else {
    // Pas de logo, afficher le nom de l'entreprise
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('AssureAI', 20, 25);
    logoHeight = 10;
  }

  // Ajuster les positions en fonction de la présence du logo
  const baseY = 15 + logoHeight + 10;

  // Titre principal
  doc.setFontSize(24);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('DEVIS D\'ASSURANCE', 20, baseY);

  // Informations de l'entreprise
  doc.setFontSize(10);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  const companyInfo = [
    'AssureAI',
    '123 Rue de l\'Assurance',
    '75001 Paris',
    'Tél: +33 1 23 45 67 89',
    'Email: contact@assureai.com'
  ];
  
  companyInfo.forEach((line, index) => {
    doc.text(line, 20, baseY + 10 + (index * 5));
  });

  // Informations client
  const clientY = baseY + 40;
  doc.setFontSize(12);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('INFORMATIONS CLIENT', 20, clientY);
  
  doc.setFontSize(10);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  const clientInfo = [
    `Nom: ${data.demande.nom} ${data.demande.prenom}`,
    `Email: ${data.demande.email}`,
    `Téléphone: ${data.demande.telephone}`,
    `Type d'assurance: ${data.demande.type_assurance}`,
    `Date de naissance: ${data.demande.date_naissance ? new Date(data.demande.date_naissance).toLocaleDateString('fr-FR') : 'Non renseignée'}`
  ];

  clientInfo.forEach((line, index) => {
    doc.text(line, 20, clientY + 10 + (index * 5));
  });

  // Tarification
  const tarifsY = clientY + 45;
  doc.setFontSize(12);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('TARIFICATION', 20, tarifsY);

  // Tableau des tarifs
  doc.setFontSize(10);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  
  const startY = tarifsY + 10;
  
  // En-têtes du tableau
  doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.rect(20, startY, 170, 8, 'F');
  doc.setTextColor(0);
  doc.text('Description', 25, startY + 5);
  doc.text('Montant', 160, startY + 5);

  // Lignes du tableau
  const tarifs = [
    ['Prime mensuelle', `${data.tarifs.prime_mensuelle}€`],
    ['Prime annuelle', `${data.tarifs.prime_annuelle}€`],
    ['Franchise', `${data.tarifs.franchise}€`]
  ];

  tarifs.forEach((tarif, index) => {
    const y = startY + 12 + (index * 8);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(tarif[0], 25, y);
    doc.text(tarif[1], 160, y);
    
    // Ligne de séparation
    doc.setDrawColor(200);
    doc.line(20, y + 2, 190, y + 2);
  });

  // Garanties
  const garantiesY = startY + 50;
  doc.setFontSize(12);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('GARANTIES INCLUSES', 20, garantiesY);

  doc.setFontSize(10);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  data.tarifs.garanties.forEach((garantie, index) => {
    doc.text(`• ${garantie}`, 25, garantiesY + 10 + (index * 5));
  });

  // Conditions générales
  const conditionsY = garantiesY + 10 + (data.tarifs.garanties.length * 5) + 20;
  doc.setFontSize(8);
  doc.setTextColor(100);
  const conditions = [
    'Ce devis est valable 30 jours à compter de la date d\'émission.',
    'Les tarifs sont donnés à titre indicatif et peuvent être modifiés selon votre profil.',
    'Ce devis ne constitue pas un engagement contractuel.',
    'Pour toute question, n\'hésitez pas à nous contacter.'
  ];

  conditions.forEach((condition, index) => {
    doc.text(condition, 20, conditionsY + (index * 4));
  });

  // Date et signature
  const signatureY = conditionsY + 25;
  doc.setFontSize(10);
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text(`Date d'émission: ${new Date().toLocaleDateString('fr-FR')}`, 20, signatureY);
  doc.text('AssureAI', 150, signatureY);

  return doc;
};
