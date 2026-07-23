
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePushNotifications } from './usePushNotifications';
import { toast } from 'sonner';

interface Demande {
  id: string;
  nom: string;
  prenom: string;
  type_assurance: string;
  date_creation: string;
  conseiller_assigne?: string;
}

export const useDemandesNotifications = (userType: 'admin' | 'conseiller', conseillerNom?: string) => {
  const [lastCheckTime, setLastCheckTime] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const { sendNotification, requestPermission, permission } = usePushNotifications();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<string>('');

  useEffect(() => {
    // Initialiser le timestamp au démarrage
    const now = new Date().toISOString();
    setLastCheckTime(now);
    lastCheckRef.current = now;
  }, []);

  const checkForNewDemandes = async () => {
    try {
      const currentTime = new Date().toISOString();
      const checkTime = lastCheckRef.current || new Date(Date.now() - 30000).toISOString();

      if (userType === 'admin') {
        // Pour les admins : surveiller les nouvelles demandes créées
        const { data: newDemandes, error } = await supabase
          .from('demandes_assurance')
          .select('id, nom, prenom, type_assurance, date_creation, conseiller_assigne')
          .gte('date_creation', checkTime)
          .order('date_creation', { ascending: false });

        if (error) {
          console.error('Erreur lors de la vérification des nouvelles demandes:', error);
          return;
        }

        if (newDemandes && newDemandes.length > 0) {
          const reallyNewDemandes = newDemandes.filter(demande => 
            new Date(demande.date_creation) > new Date(lastCheckRef.current)
          );

          if (reallyNewDemandes.length > 0) {
            console.log(`${reallyNewDemandes.length} nouvelle(s) demande(s) détectée(s)`);
            
            reallyNewDemandes.forEach(demande => {
              const title = `Nouvelle demande d'assurance`;
              const body = `${demande.prenom} ${demande.nom} - ${demande.type_assurance}`;
              
              sendNotification({
                title,
                body,
                tag: `demande-${demande.id}`
              });

              toast.success(title, {
                description: body,
                duration: 5000
              });
            });
          }
        }
      } else if (userType === 'conseiller' && conseillerNom) {
        // Pour les conseillers : surveiller les demandes récemment assignées
        const { data: assignedDemandes, error } = await supabase
          .from('demandes_assurance')
          .select('id, nom, prenom, type_assurance, date_creation, date_modification, conseiller_assigne')
          .eq('conseiller_assigne', conseillerNom)
          .gte('date_modification', checkTime)
          .order('date_modification', { ascending: false });

        if (error) {
          console.error('Erreur lors de la vérification des demandes assignées:', error);
          return;
        }

        if (assignedDemandes && assignedDemandes.length > 0) {
          const recentlyAssigned = assignedDemandes.filter(demande => 
            new Date(demande.date_modification) > new Date(lastCheckRef.current)
          );

          if (recentlyAssigned.length > 0) {
            console.log(`${recentlyAssigned.length} demande(s) récemment assignée(s) détectée(s)`);
            
            recentlyAssigned.forEach(demande => {
              const title = `Nouvelle demande assignée`;
              const body = `${demande.prenom} ${demande.nom} - ${demande.type_assurance}`;
              
              sendNotification({
                title,
                body,
                tag: `assignation-${demande.id}`,
                icon: '/favicon.ico'
              });

              toast.success(title, {
                description: body,
                duration: 8000,
                action: {
                  label: "Voir",
                  onClick: () => window.location.href = '/conseiller-dashboard/demandes'
                }
              });
            });
          }
        }
      }

      // Mettre à jour le timestamp du dernier check
      lastCheckRef.current = currentTime;
      setLastCheckTime(currentTime);
    } catch (error) {
      console.error('Erreur lors de la vérification des demandes:', error);
    }
  };

  const startListening = async () => {
    if (isListening) return;

    // Demander la permission si nécessaire
    if (permission !== 'granted') {
      const granted = await requestPermission();
      if (!granted) {
        toast.error('Notifications refusées. Les notifications push ne fonctionneront pas.');
        return;
      }
    }

    setIsListening(true);
    
    // Vérifier immédiatement
    await checkForNewDemandes();
    
    // Puis vérifier toutes les 15 secondes
    intervalRef.current = setInterval(checkForNewDemandes, 15000);
    
    console.log(`Surveillance des nouvelles demandes activée pour ${userType}`);
    toast.success('Notifications push activées pour les nouvelles demandes');
  };

  const stopListening = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsListening(false);
    console.log('Surveillance des nouvelles demandes désactivée');
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isListening,
    startListening,
    stopListening,
    permission,
    requestPermission
  };
};
