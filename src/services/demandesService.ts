
import { supabase } from '@/integrations/supabase/client';

export type TypeAssurance = 'auto' | 'habitation' | 'sante' | 'moto' | 'emprunteur' | 'voyage';

export interface ConsentementRGPD {
  consentement: boolean;
  preuve: {
    date: string;
    message_consentement: string;
    mention_rgpd_affichee: boolean;
    ip?: string | null;
  };
}

export interface DemandeAssuranceData {
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  date_naissance?: string;
  adresse_complete?: string;
  code_postal?: string;
  consentement_rgpd?: ConsentementRGPD;
  [key: string]: any;
}

export const saveDemandeAssurance = async (
  typeAssurance: TypeAssurance,
  data: DemandeAssuranceData
) => {
  try {
    console.log('Saving demande assurance:', { typeAssurance, data });

    // 1. Insérer dans la table principale demandes_assurance
    const { data: demandeData, error: demandeError } = await supabase
      .from('demandes_assurance')
      .insert({
        type_assurance: typeAssurance,
        nom: data.nom,
        prenom: data.prenom,
        email: data.email,
        telephone: data.telephone,
        date_naissance: data.date_naissance,
        adresse_complete: data.adresse_complete,
        code_postal: data.code_postal,
        statut: 'nouveau',
        priorite: 'normale',
        consentement_rgpd: data.consentement_rgpd || null
      })
      .select()
      .single();

    if (demandeError) {
      console.error('Error saving main demande:', demandeError);
      throw demandeError;
    }

    console.log('Main demande saved:', demandeData);

    // 2. Insérer les données spécifiques selon le type d'assurance
    const demandeId = demandeData.id;
    let specificData = null;

    switch (typeAssurance) {
      case 'auto':
        const { data: autoData, error: autoError } = await supabase
          .from('assurance_auto')
          .insert({
            demande_id: demandeId,
            marque_vehicule: data.marque_vehicule,
            modele_vehicule: data.modele_vehicule,
            annee_circulation: data.annee_circulation ? parseInt(data.annee_circulation.toString()) : null,
            type_carburant: data.type_carburant,
            usage_vehicule: data.usage_vehicule,
            bonus_malus: data.bonus_malus,
            antecedents_assurance: data.antecedents_assurance,
            options_souhaitees: data.options_souhaitees ? [data.options_souhaitees] : null
          })
          .select()
          .single();

        if (autoError) {
          console.error('Error saving auto data:', autoError);
          throw autoError;
        }
        specificData = autoData;
        break;

      case 'habitation':
        const { data: habitationData, error: habitationError } = await supabase
          .from('assurance_habitation')
          .insert({
            demande_id: demandeId,
            type_logement: data.type_logement,
            usage_logement: data.usage_logement,
            superficie_m2: data.superficie_m2 ? parseInt(data.superficie_m2) : null,
            nombre_pieces: data.nombre_pieces ? parseInt(data.nombre_pieces) : null,
            annee_construction: data.annee_construction ? parseInt(data.annee_construction) : null,
            systeme_securite: data.systeme_securite === 'oui' || data.systeme_securite === true,
            valeur_biens_euros: data.valeur_biens_euros ? parseFloat(data.valeur_biens_euros) : null,
            antecedents_sinistres: data.antecedents_sinistres
          })
          .select()
          .single();

        if (habitationError) {
          console.error('Error saving habitation data:', habitationError);
          throw habitationError;
        }
        specificData = habitationData;
        break;

      case 'sante':
        const { data: santeData, error: santeError } = await supabase
          .from('assurance_sante')
          .insert({
            demande_id: demandeId,
            situation_familiale: data.situation_familiale,
            profession: data.profession,
            regime_securite_sociale: data.regime_securite_sociale,
            couverture_actuelle: data.couverture_actuelle,
            besoins_specifiques: data.besoins_specifiques ? [data.besoins_specifiques] : null,
            nombre_personnes_assurer: data.nombre_personnes_assurer ? parseInt(data.nombre_personnes_assurer) : null
          })
          .select()
          .single();

        if (santeError) {
          console.error('Error saving sante data:', santeError);
          throw santeError;
        }
        specificData = santeData;
        break;

      case 'moto':
        const { data: motoData, error: motoError } = await supabase
          .from('assurance_moto')
          .insert({
            demande_id: demandeId,
            type_deux_roues: data.type_deux_roues,
            cylindree: data.cylindree ? parseInt(data.cylindree) : null,
            marque_modele: data.marque_modele,
            annee_circulation: data.annee_circulation ? parseInt(data.annee_circulation) : null,
            usage_moto: data.usage_moto,
            bonus_malus: data.bonus_malus,
            antecedents_assurance: data.antecedents_assurance
          })
          .select()
          .single();

        if (motoError) {
          console.error('Error saving moto data:', motoError);
          throw motoError;
        }
        specificData = motoData;
        break;

      case 'emprunteur':
        const { data: emprunteurData, error: emprunteurError } = await supabase
          .from('assurance_emprunteur')
          .insert({
            demande_id: demandeId,
            situation_professionnelle: data.situation_professionnelle,
            montant_pret: data.montant_pret ? parseFloat(data.montant_pret) : null,
            duree_pret_mois: data.duree_pret_mois ? parseInt(data.duree_pret_mois) : null,
            type_bien_finance: data.type_bien_finance,
            etat_sante: data.etat_sante,
            couvertures_souhaitees: data.couvertures_souhaitees ? [data.couvertures_souhaitees] : null
          })
          .select()
          .single();

        if (emprunteurError) {
          console.error('Error saving emprunteur data:', emprunteurError);
          throw emprunteurError;
        }
        specificData = emprunteurData;
        break;

      case 'voyage':
        const { data: voyageData, error: voyageError } = await supabase
          .from('assurance_voyage')
          .insert({
            demande_id: demandeId,
            destination: data.destination,
            date_depart: data.date_depart,
            date_retour: data.date_retour,
            motif_voyage: data.motif_voyage,
            nombre_voyageurs: data.nombre_voyageurs ? parseInt(data.nombre_voyageurs) : null,
            ages_voyageurs: data.ages_voyageurs ? [parseInt(data.ages_voyageurs)] : null,
            couvertures_souhaitees: data.couvertures_souhaitees ? [data.couvertures_souhaitees] : null
          })
          .select()
          .single();

        if (voyageError) {
          console.error('Error saving voyage data:', voyageError);
          throw voyageError;
        }
        specificData = voyageData;
        break;
    }

    console.log('Specific data saved:', specificData);

    return {
      success: true,
      demandeId: demandeId,
      data: demandeData,
      specificData: specificData
    };

  } catch (error) {
    console.error('Error in saveDemandeAssurance:', error);
    return {
      success: false,
      error: error
    };
  }
};
