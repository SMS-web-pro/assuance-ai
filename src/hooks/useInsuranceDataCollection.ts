
import { useState, useCallback } from 'react';
import { saveDemandeAssurance, TypeAssurance } from '@/services/demandesService';
import { toast } from 'sonner';

export const useInsuranceDataCollection = (insuranceType: TypeAssurance) => {
  const [isCollecting, setIsCollecting] = useState(false);
  const [collectedData, setCollectedData] = useState<any>({});

  const updateCollectedData = useCallback((newData: any) => {
    console.log('🔄 Mise à jour des données collectées:', newData);
    setCollectedData(prev => {
      const updated = { ...prev, ...newData };
      console.log('📊 État des données mis à jour:', updated);
      return updated;
    });
  }, []);

  const saveCollectedData = useCallback(async (dataToSave: any) => {
    console.log('💾 Tentative de sauvegarde avec les données:', dataToSave);
    
    if (!dataToSave || Object.keys(dataToSave).length === 0) {
      console.error('❌ Aucune donnée à sauvegarder');
      toast.error("Aucune donnée collectée");
      return false;
    }

    // Vérifier les données minimales requises
    if (!dataToSave.nom && !dataToSave.prenom) {
      console.error('❌ Nom manquant');
      toast.error("Nom manquant pour la sauvegarde");
      return false;
    }

    if (!dataToSave.telephone) {
      console.error('❌ Téléphone manquant');
      toast.error("Numéro de téléphone manquant. Le rappel est nécessaire pour finaliser votre demande.");
      return false;
    }

    setIsCollecting(true);

    try {
      console.log('🚀 Sauvegarde en cours...', { type: insuranceType, data: dataToSave });
      
      const result = await saveDemandeAssurance(insuranceType, dataToSave);
      
      console.log('📝 Résultat de la sauvegarde:', result);
      
      if (result.success) {
        toast.success("✅ Demande sauvegardée avec succès!");
        console.log('✅ Données sauvegardées avec l\'ID:', result.demandeId);
        
        // Reset après succès
        setCollectedData({});
        return true;
      } else {
        console.error('❌ Échec de la sauvegarde:', result.error);
        toast.error("❌ Erreur lors de la sauvegarde: " + (result.error?.message || 'Erreur inconnue'));
        return false;
      }
    } catch (error) {
      console.error('💥 Erreur critique lors de la sauvegarde:', error);
      toast.error("❌ Erreur critique lors de la sauvegarde");
      return false;
    } finally {
      setIsCollecting(false);
    }
  }, [insuranceType]);

  const resetCollection = useCallback(() => {
    console.log('🔄 Reset de la collection de données');
    setCollectedData({});
    setIsCollecting(false);
  }, []);

  return {
    collectedData,
    isCollecting,
    updateCollectedData,
    saveCollectedData,
    resetCollection
  };
};
