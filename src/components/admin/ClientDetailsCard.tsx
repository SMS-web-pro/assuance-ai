import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  User, Mail, Phone, MapPin, Calendar, FileText, 
  Car, Home, Heart, Bike, CreditCard, Plane, 
  Clock, AlertCircle, CheckCircle, XCircle, MessageSquare, Send 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from 'jspdf';

interface ClientDetailsCardProps {
  demande: any;
  isOpen: boolean;
  onClose: () => void;
}

const ClientDetailsCard: React.FC<ClientDetailsCardProps> = ({ demande, isOpen, onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [emailTo, setEmailTo] = useState(demande?.email || '');
  const [emailSubject, setEmailSubject] = useState(`Nouvelle demande ${getTypeLabel(demande?.type_assurance || '')} - ID: ${demande?.id?.slice(0, 8) || ''}`);

  if (!demande) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "auto": return <Car className="w-5 h-5 text-blue-600" />;
      case "habitation": return <Home className="w-5 h-5 text-green-600" />;
      case "sante": return <Heart className="w-5 h-5 text-red-600" />;
      case "moto": return <Bike className="w-5 h-5 text-orange-600" />;
      case "emprunteur": return <CreditCard className="w-5 h-5 text-purple-600" />;
      case "voyage": return <Plane className="w-5 h-5 text-cyan-600" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  function getTypeLabel(type: string) {
    const labels = {
      auto: "Assurance Auto",
      habitation: "Assurance Habitation", 
      sante: "Assurance Santé",
      moto: "Assurance Moto",
      emprunteur: "Assurance Emprunteur",
      voyage: "Assurance Voyage"
    };
    return labels[type as keyof typeof labels] || type;
  }

  const getStatutIcon = (statut: string) => {
    switch (statut) {
      case "nouveau": return <Clock className="w-4 h-4 text-yellow-600" />;
      case "en_cours": return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case "traite": return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "archive": return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "nouveau":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Nouveau</Badge>;
      case "en_cours":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">En cours</Badge>;
      case "traite":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Traité</Badge>;
      case "archive":
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Archivé</Badge>;
      default:
        return <Badge variant="secondary">{statut}</Badge>;
    }
  };

  const renderDetailField = (label: string, value: any, isArray = false) => {
    if (!value || (isArray && (!Array.isArray(value) || value.length === 0))) return null;
    
    return (
      <div>
        <span className="text-gray-500">{label} :</span>
        <span className="ml-2 font-medium">
          {isArray ? value.join(', ') : value}
        </span>
      </div>
    );
  };

  const renderSpecificDetails = () => {
    const type = demande.type_assurance;
    let specificData = null;
    
    // Récupérer les données des tables spécifiques ET des données génériques
    const donneesSpecifiques = demande.donnees_specifiques || {};
    console.log('Données spécifiques pour', type, ':', donneesSpecifiques);

    // Fusionner les données de la table spécifique avec donnees_specifiques
    switch (type) {
      case 'auto':
        specificData = { 
          ...(demande.assurance_auto?.[0] || {}),
          ...donneesSpecifiques 
        };
        if (specificData && Object.keys(specificData).length > 0) {
          return (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                <Car className="w-4 h-4" />
                Détails du véhicule
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {renderDetailField("Marque", specificData.marque_vehicule || specificData.marque)}
                {renderDetailField("Modèle", specificData.modele_vehicule || specificData.modele)}
                {renderDetailField("Année", specificData.annee_circulation || specificData.annee)}
                {renderDetailField("Carburant", specificData.type_carburant || specificData.carburant)}
                {renderDetailField("Usage", specificData.usage_vehicule || specificData.usage)}
                {renderDetailField("Bonus/Malus", specificData.bonus_malus || specificData.bonusMalus)}
                {renderDetailField("Puissance", specificData.puissance)}
                {renderDetailField("Nombre de places", specificData.nbPlaces)}
                {renderDetailField("Valeur du véhicule", specificData.valeurVehicule ? `${specificData.valeurVehicule} €` : null)}
                {renderDetailField("Kilométrage annuel", specificData.kilometrageAnnuel)}
                {renderDetailField("Stationnement", specificData.stationnement)}
              </div>
              {renderDetailField("Options souhaitées", specificData.options_souhaitees || specificData.optionsSouhaitees, true) && (
                <div>
                  <span className="text-gray-500">Options souhaitées :</span>
                  <p className="mt-1 text-sm bg-gray-50 p-2 rounded">
                    {Array.isArray(specificData.options_souhaitees || specificData.optionsSouhaitees) 
                      ? (specificData.options_souhaitees || specificData.optionsSouhaitees).join(', ')
                      : (specificData.options_souhaitees || specificData.optionsSouhaitees)
                    }
                  </p>
                </div>
              )}
              {(specificData.antecedents_assurance || specificData.antecedents) && (
                <div>
                  <span className="text-gray-500">Antécédents :</span>
                  <p className="mt-1 text-sm bg-gray-50 p-2 rounded">{specificData.antecedents_assurance || specificData.antecedents}</p>
                </div>
              )}
            </div>
          );
        }
        break;

      case 'habitation':
        specificData = { 
          ...(demande.assurance_habitation?.[0] || {}),
          ...donneesSpecifiques 
        };
        if (specificData && Object.keys(specificData).length > 0) {
          return (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                <Home className="w-4 h-4" />
                Détails du logement
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {renderDetailField("Type", specificData.type_logement || specificData.typeLogement)}
                {renderDetailField("Usage", specificData.usage_logement || specificData.usageLogement)}
                {renderDetailField("Superficie", specificData.superficie_m2 || specificData.superficie ? `${specificData.superficie_m2 || specificData.superficie} m²` : null)}
                {renderDetailField("Pièces", specificData.nombre_pieces || specificData.nbPieces)}
                {renderDetailField("Année construction", specificData.annee_construction || specificData.anneeConstruction)}
                {renderDetailField("Système sécurité", specificData.systeme_securite ? 'Oui' : (specificData.systeme_securite === false ? 'Non' : null))}
                {renderDetailField("Valeur des biens", specificData.valeur_biens_euros || specificData.valeurBiens ? `${(specificData.valeur_biens_euros || specificData.valeurBiens).toLocaleString()} €` : null)}
                {renderDetailField("Étage", specificData.etage)}
                {renderDetailField("Cave/Garage", specificData.caveGarage)}
                {renderDetailField("Balcon/Terrasse", specificData.balconTerrasse)}
              </div>
              {(specificData.antecedents_sinistres || specificData.antecedentsSinistres) && (
                <div>
                  <span className="text-gray-500">Antécédents sinistres :</span>
                  <p className="mt-1 text-sm bg-gray-50 p-2 rounded">{specificData.antecedents_sinistres || specificData.antecedentsSinistres}</p>
                </div>
              )}
            </div>
          );
        }
        break;

      case 'sante':
        specificData = { 
          ...(demande.assurance_sante?.[0] || {}),
          ...donneesSpecifiques 
        };
        if (specificData && Object.keys(specificData).length > 0) {
          return (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Détails santé
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {renderDetailField("Situation familiale", specificData.situation_familiale || specificData.situationFamiliale)}
                {renderDetailField("Profession", specificData.profession)}
                {renderDetailField("Régime SS", specificData.regime_securite_sociale || specificData.regimeSS)}
                {renderDetailField("Personnes à assurer", specificData.nombre_personnes_assurer || specificData.nbPersonnes)}
                {renderDetailField("Âge", specificData.age)}
                {renderDetailField("Revenus annuels", specificData.revenusAnnuels ? `${specificData.revenusAnnuels} €` : null)}
              </div>
              {renderDetailField("Besoins spécifiques", specificData.besoins_specifiques || specificData.besoinsSpecifiques, true) && (
                <div>
                  <span className="text-gray-500">Besoins spécifiques :</span>
                  <p className="mt-1 text-sm bg-gray-50 p-2 rounded">
                    {Array.isArray(specificData.besoins_specifiques || specificData.besoinsSpecifiques) 
                      ? (specificData.besoins_specifiques || specificData.besoinsSpecifiques).join(', ')
                      : (specificData.besoins_specifiques || specificData.besoinsSpecifiques)
                    }
                  </p>
                </div>
              )}
              {(specificData.couverture_actuelle || specificData.couverture) && (
                <div>
                  <span className="text-gray-500">Couverture actuelle :</span>
                  <p className="mt-1 text-sm bg-gray-50 p-2 rounded">{specificData.couverture_actuelle || specificData.couverture}</p>
                </div>
              )}
            </div>
          );
        }
        break;

      case 'moto':
        specificData = { 
          ...(demande.assurance_moto?.[0] || {}),
          ...donneesSpecifiques 
        };
        if (specificData && Object.keys(specificData).length > 0) {
          return (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                <Bike className="w-4 h-4" />
                Détails du deux-roues
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {renderDetailField("Type", specificData.type_deux_roues || specificData.typeDeuxRoues)}
                {renderDetailField("Marque/Modèle", specificData.marque_modele || specificData.marqueModele)}
                {renderDetailField("Cylindrée", specificData.cylindree ? `${specificData.cylindree}cc` : null)}
                {renderDetailField("Usage", specificData.usage_moto || specificData.usage)}
                {renderDetailField("Année", specificData.annee_circulation || specificData.annee)}
                {renderDetailField("Bonus/Malus", specificData.bonus_malus || specificData.bonusMalus)}
                {renderDetailField("Puissance", specificData.puissance)}
                {renderDetailField("Valeur du véhicule", specificData.valeurVehicule ? `${specificData.valeurVehicule} €` : null)}
                {renderDetailField("Kilométrage annuel", specificData.kilometrageAnnuel)}
              </div>
              {(specificData.antecedents_assurance || specificData.antecedents) && (
                <div>
                  <span className="text-gray-500">Antécédents :</span>
                  <p className="mt-1 text-sm bg-gray-50 p-2 rounded">{specificData.antecedents_assurance || specificData.antecedents}</p>
                </div>
              )}
            </div>
          );
        }
        break;

      case 'emprunteur':
        specificData = { 
          ...(demande.assurance_emprunteur?.[0] || {}),
          ...donneesSpecifiques 
        };
        if (specificData && Object.keys(specificData).length > 0) {
          return (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Détails du prêt
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {renderDetailField("Situation pro", specificData.situation_professionnelle || specificData.situationPro)}
                {renderDetailField("Montant prêt", specificData.montant_pret || specificData.montantPret ? `${(specificData.montant_pret || specificData.montantPret).toLocaleString()} €` : null)}
                {renderDetailField("Durée", specificData.duree_pret_mois || specificData.dureePret ? `${specificData.duree_pret_mois || specificData.dureePret} mois` : null)}
                {renderDetailField("Bien financé", specificData.type_bien_finance || specificData.typeBien)}
                {renderDetailField("Âge", specificData.age)}
                {renderDetailField("Revenus mensuels", specificData.revenusmensuels ? `${specificData.revenusmensuels} €` : null)}
                {renderDetailField("Apport personnel", specificData.apportPersonnel ? `${specificData.apportPersonnel} €` : null)}
              </div>
              {renderDetailField("Couvertures souhaitées", specificData.couvertures_souhaitees || specificData.couverturesSouhaitees, true) && (
                <div>
                  <span className="text-gray-500">Couvertures souhaitées :</span>
                  <p className="mt-1 text-sm bg-gray-50 p-2 rounded">
                    {Array.isArray(specificData.couvertures_souhaitees || specificData.couverturesSouhaitees) 
                      ? (specificData.couvertures_souhaitees || specificData.couverturesSouhaitees).join(', ')
                      : (specificData.couvertures_souhaitees || specificData.couverturesSouhaitees)
                    }
                  </p>
                </div>
              )}
              {specificData.etat_sante && (
                <div>
                  <span className="text-gray-500">État de santé :</span>
                  <p className="mt-1 text-sm bg-gray-50 p-2 rounded">{specificData.etat_sante}</p>
                </div>
              )}
            </div>
          );
        }
        break;

      case 'voyage':
        specificData = { 
          ...(demande.assurance_voyage?.[0] || {}),
          ...donneesSpecifiques 
        };
        if (specificData && Object.keys(specificData).length > 0) {
          return (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                <Plane className="w-4 h-4" />
                Détails du voyage
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {renderDetailField("Destination", specificData.destination)}
                {renderDetailField("Motif", specificData.motif_voyage || specificData.motifVoyage)}
                {renderDetailField("Départ", specificData.date_depart || specificData.dateDepart ? new Date(specificData.date_depart || specificData.dateDepart).toLocaleDateString('fr-FR') : null)}
                {renderDetailField("Retour", specificData.date_retour || specificData.dateRetour ? new Date(specificData.date_retour || specificData.dateRetour).toLocaleDateString('fr-FR') : null)}
                {renderDetailField("Voyageurs", specificData.nombre_voyageurs || specificData.nbVoyageurs)}
                {renderDetailField("Budget voyage", specificData.budgetVoyage ? `${specificData.budgetVoyage} €` : null)}
                {renderDetailField("Activités pratiquées", specificData.activitesPratiquees)}
              </div>
              {renderDetailField("Âges voyageurs", specificData.ages_voyageurs || specificData.agesVoyageurs, true) && (
                <div>
                  <span className="text-gray-500">Âges des voyageurs :</span>
                  <p className="mt-1 text-sm bg-gray-50 p-2 rounded">
                    {Array.isArray(specificData.ages_voyageurs || specificData.agesVoyageurs) 
                      ? (specificData.ages_voyageurs || specificData.agesVoyageurs).join(', ')
                      : (specificData.ages_voyageurs || specificData.agesVoyageurs)
                    }
                  </p>
                </div>
              )}
              {renderDetailField("Couvertures souhaitées", specificData.couvertures_souhaitees || specificData.couverturesSouhaitees, true) && (
                <div>
                  <span className="text-gray-500">Couvertures souhaitées :</span>
                  <p className="mt-1 text-sm bg-gray-50 p-2 rounded">
                    {Array.isArray(specificData.couvertures_souhaitees || specificData.couverturesSouhaitees) 
                      ? (specificData.couvertures_souhaitees || specificData.couverturesSouhaitees).join(', ')
                      : (specificData.couvertures_souhaitees || specificData.couverturesSouhaitees)
                    }
                  </p>
                </div>
              )}
            </div>
          );
        }
        break;
    }

    // Si aucune donnée spécifique n'est trouvée, afficher un message
    return (
      <div className="text-center text-gray-500 py-4">
        <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>Aucun détail spécifique disponible</p>
      </div>
    );
  };

  const generateClientDetailsPDF = () => {
    const doc = new jsPDF();
    
    // Configuration des couleurs
    const primaryColor = [41, 128, 185];
    const secondaryColor = [52, 73, 94];
    const lightGray = [248, 249, 250];
    const accentColor = [26, 188, 156];
    const clientColor = [52, 152, 219];
    const agentColor = [149, 165, 166];
    
    let y = 25;
    const lh = 6;
    const lm = 20;
    const rm = 190;
    const pw = rm - lm;
    
    // Fonction pour nettoyer le texte pour le PDF
    const cleanTextForPDF = (text: string): string => {
      if (!text) return '';
      return text
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/#{1,6}\s/g, '')
        .replace(/`{1,3}[^`]*`{1,3}/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/[-]{3,}/g, '')
        .replace(/[=]{3,}/g, '')
        .replace(/[•]{3,}/g, '')
        .replace(/[─━═—]{3,}/g, '')
        .replace(/[►▸▹‣⁃]/g, '')
        .replace(/[✓✔✅☑️]/g, '')
        .replace(/[❌✗✘]/g, '')
        .replace(/[📞📧📱💡🎯🔒🛡️🏠📐🏗️📅]/g, '')
        .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]/gu, '')
        .replace(/Ø=ÜÞ/g, '')
        .replace(/\|/g, '')
        .replace(/[\[\]{}]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };
    
    const checkPage = (h: number = 30) => {
      if (y + h > 265) {
        doc.addPage();
        y = 25;
      }
    };
    
    const drawSectionTitle = (title: string) => {
      checkPage(25);
      doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.rect(lm - 2, y - 4, 4, 10, 'F');
      doc.setFontSize(12);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text(title, lm + 5, y + 2);
      y += 14;
    };
    
    const drawField = (label: string, value: string, labelWidth: number = 35) => {
      if (!value || value.trim() === '') return;
      const cleanValue = cleanTextForPDF(value);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.text(label + ':', lm + 5, y);
      doc.setFont('helvetica', 'normal');
      doc.text(cleanValue.substring(0, 65), lm + 5 + labelWidth, y);
      y += lh;
    };
    
    // ==================== EN-TÊTE ====================
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.rect(0, 38, 210, 2, 'F');
    
    doc.setFontSize(26);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('ASSURE IA', lm, 22);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(200, 230, 255);
    doc.text('Solutions d\'assurance nouvelle génération', lm, 32);
    
    y = 52;
    
    // Titre
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.roundedRect(lm - 5, y - 8, pw + 10, 14, 2, 2, 'F');
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('FICHE DE DEMANDE D\'ASSURANCE', lm, y);
    y += 12;
    
    // Référence
    doc.setFontSize(8);
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.setFont('helvetica', 'normal');
    doc.text(`Réf: ${demande.id.slice(0, 8).toUpperCase()} | Date: ${new Date().toLocaleDateString('fr-FR')} | Statut: ${demande.statut.toUpperCase()}`, lm, y);
    y += 10;
    
    // ==================== INFOS CLIENT ====================
    drawSectionTitle('INFORMATIONS CLIENT');
    
    const col2 = lm + pw / 2;
    
    doc.setFontSize(9);
    drawField('Nom complet', `${demande.nom || ''} ${demande.prenom || ''}`.trim());
    drawField('Email', demande.email);
    drawField('Téléphone', demande.telephone);
    drawField('Date naissance', demande.date_naissance ? new Date(demande.date_naissance).toLocaleDateString('fr-FR') : '');
    drawField('Adresse', demande.adresse_complete);
    drawField('Code postal', demande.code_postal);
    y += 5;
    
    // ==================== DEMANDE ASSURANCE ====================
    drawSectionTitle('DEMANDE D\'ASSURANCE');
    
    drawField('Type', getTypeLabel(demande.type_assurance));
    drawField('Priorité', demande.priorite || 'normale');
    drawField('Créée le', `${new Date(demande.date_creation).toLocaleDateString('fr-FR')} à ${new Date(demande.date_creation).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`);
    drawField('Modifiée le', `${new Date(demande.date_modification).toLocaleDateString('fr-FR')} à ${new Date(demande.date_modification).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`);
    y += 5;
    
    // ==================== INFOS LEAD ====================
    const ds = demande.donnees_specifiques || {};
    if (ds.lien_agent || ds.ip_client || ds.nombre_messages) {
      drawSectionTitle('INFORMATIONS LEAD');
      
      drawField('Lien agent', ds.lien_agent);
      drawField('IP client', ds.ip_client);
      drawField('Messages', ds.nombre_messages?.toString());
      drawField('Début conversation', ds.debut_conversation ? new Date(ds.debut_conversation).toLocaleString('fr-FR') : '');
      drawField('Fin conversation', ds.fin_conversation ? new Date(ds.fin_conversation).toLocaleString('fr-FR') : '');
      
      // Consentement RGPD
      if (demande.consentement_rgpd) {
        const consentText = demande.consentement_rgpd.consentement ? 'ACCEPTÉ' : 'REFUSÉ';
        const consentColor = demande.consentement_rgpd.consentement ? [39, 174, 96] : [231, 76, 60];
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.text('Consentement RGPD:', lm + 5, y);
        
        doc.setFillColor(consentColor[0], consentColor[1], consentColor[2]);
        const tw = doc.getTextWidth(consentText) + 6;
        doc.roundedRect(lm + 42, y - 4, tw, 7, 1.5, 1.5, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7);
        doc.text(consentText, lm + 45, y);
        
        if (demande.consentement_rgpd.preuve?.ip) {
          doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
          doc.setFontSize(9);
          doc.text(`IP: ${demande.consentement_rgpd.preuve.ip}`, lm + 45 + tw + 5, y);
        }
        y += lh;
        
        if (demande.consentement_rgpd.preuve?.date) {
          drawField('Date consentement', demande.consentement_rgpd.preuve.date);
        }
      }
      y += 5;
    }
    
    // ==================== DÉTAILS SPÉCIFIQUES ====================
    const type = demande.type_assurance;
    let specificData = { ...ds };
    switch (type) {
      case 'auto': specificData = { ...(demande.assurance_auto?.[0] || {}), ...ds }; break;
      case 'habitation': specificData = { ...(demande.assurance_habitation?.[0] || {}), ...ds }; break;
      case 'sante': specificData = { ...(demande.assurance_sante?.[0] || {}), ...ds }; break;
      case 'moto': specificData = { ...(demande.assurance_moto?.[0] || {}), ...ds }; break;
      case 'emprunteur': specificData = { ...(demande.assurance_emprunteur?.[0] || {}), ...ds }; break;
      case 'voyage': specificData = { ...(demande.assurance_voyage?.[0] || {}), ...ds }; break;
    }
    
    const excludeKeys = ['id', 'demande_id', 'created_at', 'historique_conversation', 'lien_agent', 'ip_client', 'nombre_messages', 'debut_conversation', 'fin_conversation'];
    const fields = Object.entries(specificData).filter(([k, v]) => v && !excludeKeys.includes(k));
    
    if (fields.length > 0) {
      drawSectionTitle('DÉTAILS SPÉCIFIQUES');
      fields.forEach(([key, value]) => {
        const displayKey = key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').toLowerCase().replace(/^./, s => s.toUpperCase());
        const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
        drawField(displayKey, displayValue);
      });
      y += 5;
    }
    
    // ==================== NOTES CONSEILLER ====================
    if (demande.notes_conseiller) {
      checkPage(30);
      drawSectionTitle('NOTES DU CONSEILLER');
      
      const notesLines = doc.splitTextToSize(demande.notes_conseiller, pw - 15);
      const notesH = Math.min(notesLines.length * lh + 8, 50);
      
      doc.setFillColor(255, 252, 240);
      doc.setDrawColor(240, 220, 100);
      doc.roundedRect(lm, y - 2, pw, notesH, 2, 2, 'FD');
      doc.setFillColor(241, 196, 15);
      doc.rect(lm, y - 2, 3, notesH, 'F');
      
      doc.setFontSize(9);
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.setFont('helvetica', 'italic');
      
      const startY = y + 3;
      for (let i = 0; i < Math.min(notesLines.length, 7); i++) {
        doc.text(notesLines[i], lm + 8, startY + i * lh);
      }
      y += notesH + 5;
    }
    
    // ==================== HISTORIQUE CONVERSATION ====================
    if (ds.historique_conversation && Array.isArray(ds.historique_conversation) && ds.historique_conversation.length > 0) {
      doc.addPage();
      y = 25;
      
      drawSectionTitle(`HISTORIQUE CONVERSATION (${ds.historique_conversation.length} messages)`);
      
      ds.historique_conversation.forEach((msg: any, idx: number) => {
        checkPage(25);
        
        // Badge role
        const isUser = msg.role === 'user';
        const roleLabel = isUser ? 'CLIENT' : 'AGENT IA';
        const roleColor = isUser ? clientColor : agentColor;
        
        doc.setFillColor(roleColor[0], roleColor[1], roleColor[2]);
        doc.roundedRect(lm, y - 3, 20, 6, 1.5, 1.5, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        doc.text(roleLabel, lm + 2, y + 0.5);
        
        // Timestamp
        if (msg.timestamp) {
          doc.setTextColor(150, 150, 150);
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.text(new Date(msg.timestamp).toLocaleTimeString('fr-FR'), rm - 15, y);
        }
        
        y += 6;
        
        // Contenu nettoyé
        const cleanContent = cleanTextForPDF(msg.contenu || '');
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        
        const msgLines = doc.splitTextToSize(cleanContent, pw - 10);
        for (let i = 0; i < msgLines.length; i++) {
          checkPage(10);
          doc.text(msgLines[i], lm + 5, y);
          y += 4;
        }
        
        y += 3;
        doc.setDrawColor(230, 230, 230);
        doc.setLineWidth(0.2);
        doc.line(lm + 5, y, rm - 5, y);
        y += 4;
      });
    }
    
    // ==================== PIED DE PAGE ====================
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      const fy = 275;
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setLineWidth(0.5);
      doc.line(lm, fy, rm, fy);
      doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.rect(lm, fy + 1, 25, 1, 'F');
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.setFont('helvetica', 'normal');
      doc.text('ASSURE IA - Solutions d\'assurance nouvelle génération', lm, fy + 8);
      doc.text(`Page ${i}/${totalPages}`, rm - 20, fy + 8);
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, lm, fy + 14);
      doc.text('Document confidentiel - Usage interne', rm - 45, fy + 14);
    }
    
    return doc;
  };

  const handleSendEmail = async () => {
    if (!emailTo) {
      toast.error("Veuillez saisir une adresse email");
      return;
    }

    setIsGenerating(true);
    try {
      console.log('Génération du PDF...');
      const doc = generateClientDetailsPDF();
      const pdfBlob = doc.output('blob');
      
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

      console.log('Envoi de l\'email...');
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: emailTo,
          subject: emailSubject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #2980b9, #1abc9c); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">Assure IA</h1>
                <p style="color: #ecf0f1; margin: 10px 0 0 0; font-size: 16px;">Solutions d'assurance personnalisées</p>
              </div>
              <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h2 style="color: #2c3e50; margin-top: 0;">Détails de la demande d'assurance</h2>
                <p style="color: #34495e; line-height: 1.6;">Bonjour,</p>
                <p style="color: #34495e; line-height: 1.6;">
                  Veuillez trouver ci-joint les détails complets de la demande d'assurance suivante :
                </p>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 5px 0;"><strong style="color: #2c3e50;">Client :</strong> ${demande.nom} ${demande.prenom}</p>
                  <p style="margin: 5px 0;"><strong style="color: #2c3e50;">Type d'assurance :</strong> ${getTypeLabel(demande.type_assurance)}</p>
                  <p style="margin: 5px 0;"><strong style="color: #2c3e50;">Référence :</strong> ${demande.id.slice(0, 8).toUpperCase()}</p>
                  <p style="margin: 5px 0;"><strong style="color: #2c3e50;">Statut :</strong> ${demande.statut}</p>
                  <p style="margin: 5px 0;"><strong style="color: #2c3e50;">Date de création :</strong> ${new Date(demande.date_creation).toLocaleDateString('fr-FR')}</p>
                </div>
                <p style="color: #34495e; line-height: 1.6;">
                  Le document PDF joint contient tous les détails et informations spécifiques de cette demande.
                </p>
                <p style="color: #34495e; line-height: 1.6;">
                  Cordialement,<br/>
                  <strong>L'équipe Assure IA</strong>
                </p>
              </div>
              <div style="text-align: center; padding: 20px; color: #7f8c8d; font-size: 12px;">
                <p>© ${new Date().getFullYear()} Assure IA - Tous droits réservés</p>
              </div>
            </div>
          `,
          attachments: [
            {
              filename: `demande_${getTypeLabel(demande.type_assurance).replace(/\s+/g, '_')}_${demande.nom}_${demande.prenom}_${demande.id.slice(0, 8)}.pdf`,
              content: pdfBase64,
              contentType: 'application/pdf'
            }
          ]
        }
      });

      if (error) {
        console.error('Erreur de l\'edge function:', error);
        throw new Error(`Erreur edge function: ${error.message}`);
      }

      console.log('Email envoyé avec succès:', data);
      toast.success(`Email envoyé avec succès à ${emailTo}`);
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
      toast.error("Erreur lors de l'envoi de l'email");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {getTypeIcon(demande.type_assurance)}
            <span>Détails de la demande #{demande.id.slice(0, 8)}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations client */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                Informations client
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-700">Identité</h4>
                    <p className="text-lg font-medium">{demande.nom} {demande.prenom}</p>
                    {demande.date_naissance && (
                      <p className="text-sm text-gray-500">
                        Né(e) le {new Date(demande.date_naissance).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-700">Contact</h4>
                    {demande.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span>{demande.email}</span>
                      </div>
                    )}
                    {demande.telephone && (
                      <div className="flex items-center gap-2 text-sm mt-1">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span>{demande.telephone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-700">Adresse</h4>
                    {demande.adresse_complete ? (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                        <div>
                          <p>{demande.adresse_complete}</p>
                          {demande.code_postal && <p className="text-gray-500">{demande.code_postal}</p>}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Non renseignée</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statut de la demande */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Statut de la demande
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Type d'assurance</h4>
                  <Badge variant="outline" className="flex items-center gap-2 w-fit">
                    {getTypeIcon(demande.type_assurance)}
                    {getTypeLabel(demande.type_assurance)}
                  </Badge>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">Statut</h4>
                  <div className="flex items-center gap-2">
                    {getStatutIcon(demande.statut)}
                    {getStatutBadge(demande.statut)}
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Date de création :</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>{new Date(demande.date_creation).toLocaleDateString('fr-FR')} à {new Date(demande.date_creation).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
                
                {demande.date_contact && (
                  <div>
                    <span className="font-medium text-gray-700">Dernier contact :</span>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>{new Date(demande.date_contact).toLocaleDateString('fr-FR')} à {new Date(demande.date_contact).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                )}

                <div>
                  <span className="font-medium text-gray-700">Dernière modification :</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>{new Date(demande.date_modification).toLocaleDateString('fr-FR')} à {new Date(demande.date_modification).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Détails spécifiques */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Détails spécifiques de l'assurance</CardTitle>
            </CardHeader>
            <CardContent>
              {renderSpecificDetails()}
            </CardContent>
          </Card>

          {/* Notes conseiller */}
          {demande.notes_conseiller && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Notes du conseiller
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                  <p className="text-sm italic">"{demande.notes_conseiller}"</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Informations Lead */}
          {demande.donnees_specifiques && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Informations Lead
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {demande.donnees_specifiques.lien_agent && (
                    <div>
                      <span className="font-medium text-gray-700">Lien agent :</span>
                      <a 
                        href={demande.donnees_specifiques.lien_agent} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-600 hover:underline text-sm break-all"
                      >
                        {demande.donnees_specifiques.lien_agent}
                      </a>
                    </div>
                  )}
                  
                  {demande.donnees_specifiques.ip_client && (
                    <div>
                      <span className="font-medium text-gray-700">IP client :</span>
                      <span className="ml-2 text-sm">{demande.donnees_specifiques.ip_client}</span>
                    </div>
                  )}
                  
                  {demande.donnees_specifiques.nombre_messages && (
                    <div>
                      <span className="font-medium text-gray-700">Nombre de messages :</span>
                      <span className="ml-2 text-sm">{demande.donnees_specifiques.nombre_messages}</span>
                    </div>
                  )}
                  
                  {demande.donnees_specifiques.debut_conversation && (
                    <div>
                      <span className="font-medium text-gray-700">Début conversation :</span>
                      <span className="ml-2 text-sm">
                        {new Date(demande.donnees_specifiques.debut_conversation).toLocaleDateString('fr-FR')} à {new Date(demande.donnees_specifiques.debut_conversation).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                  
                  {demande.donnees_specifiques.fin_conversation && (
                    <div>
                      <span className="font-medium text-gray-700">Fin conversation :</span>
                      <span className="ml-2 text-sm">
                        {new Date(demande.donnees_specifiques.fin_conversation).toLocaleDateString('fr-FR')} à {new Date(demande.donnees_specifiques.fin_conversation).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}

                  {demande.consentement_rgpd && (
                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-700">Consentement RGPD :</span>
                      <Badge variant={demande.consentement_rgpd.consentement ? "default" : "destructive"} className="ml-2">
                        {demande.consentement_rgpd.consentement ? "Accepté" : "Refusé"}
                      </Badge>
                      {demande.consentement_rgpd.preuve?.ip && (
                        <span className="ml-2 text-sm text-gray-500">(IP: {demande.consentement_rgpd.preuve.ip})</span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Historique conversation */}
          {demande.donnees_specifiques?.historique_conversation && demande.donnees_specifiques.historique_conversation.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Historique conversation ({demande.donnees_specifiques.historique_conversation.length} messages)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto space-y-3">
                  {demande.donnees_specifiques.historique_conversation.map((msg: any, index: number) => (
                    <div 
                      key={index} 
                      className={`p-3 rounded-lg ${
                        msg.role === 'user' 
                          ? 'bg-blue-50 border-l-4 border-blue-400 ml-4' 
                          : 'bg-gray-50 border-l-4 border-gray-400 mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant={msg.role === 'user' ? 'default' : 'secondary'} className="text-xs">
                          {msg.role === 'user' ? 'Client' : 'Agent IA'}
                        </Badge>
                        {msg.timestamp && (
                          <span className="text-xs text-gray-400">
                            {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{msg.contenu}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section Email */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Send className="w-5 h-5" />
                Envoyer par email
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email_to">Destinataire</Label>
                <Input
                  id="email_to"
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="email@exemple.com"
                />
              </div>
              <div>
                <Label htmlFor="email_subject">Objet</Label>
                <Input
                  id="email_subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleSendEmail}
                disabled={isGenerating}
                className="w-full"
              >
                <Send className="w-4 h-4 mr-2" />
                {isGenerating ? "Envoi en cours..." : "Envoyer le PDF par email"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button 
            onClick={() => {
              const doc = generateClientDetailsPDF();
              doc.save(`demande_${demande.nom}_${demande.prenom}_${demande.id.slice(0, 8)}.pdf`);
              toast.success("PDF téléchargé avec succès");
            }}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Imprimer PDF
          </Button>
          <Button onClick={onClose} variant="outline">
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientDetailsCard;
