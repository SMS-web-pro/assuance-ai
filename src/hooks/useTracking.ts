import { useEffect, useRef } from 'react';
import { trackEvent } from '@/components/MetaPixel';

// Cache pour stocker les événements déjà envoyés
const eventCache = new Set<string>();

// Fonction pour générer une clé unique pour un événement
const getEventKey = (eventName: string, data: Record<string, any> = {}): string => {
  const { timestamp, ...rest } = data;
  return `${eventName}-${JSON.stringify(rest)}`;
};

export const useAITracking = () => {
  // Référence pour suivre les événements déjà envoyés pendant la session
  const sessionEvents = useRef<Set<string>>(new Set());

  // Fonction pour suivre un événement en évitant les doublons
  const trackWithDeduplication = (eventName: string, data: Record<string, any> = {}) => {
    const eventKey = getEventKey(eventName, data);
    
    // Vérifier si l'événement a déjà été envoyé (en mémoire ou en session)
    if (eventCache.has(eventKey) || sessionEvents.current.has(eventKey)) {
      console.log(`[Tracking] Événement déjà envoyé: ${eventKey}`);
      return false;
    }

    // Ajouter à la fois au cache global et à la session
    eventCache.add(eventKey);
    sessionEvents.current.add(eventKey);
    
    // Limiter la taille du cache pour éviter les fuites de mémoire
    if (eventCache.size > 100) {
      const firstKey = eventCache.values().next().value;
      eventCache.delete(firstKey);
    }

    console.log(`[Tracking] Envoi de l'événement: ${eventName}`, data);
    trackEvent(eventName, data);
    return true;
  };

  // Suivi lorsqu'une nouvelle demande est soumise via l'IA
  const trackNewAIDemand = (demandType: string, additionalData: Record<string, any> = {}) => {
    return trackWithDeduplication('SubmitDemand', {
      content_name: `Demande ${demandType}`,
      content_category: 'AI_Interaction',
      content_type: 'demand',
      ...additionalData
    });
  };

  // Suivi lorsqu'un utilisateur interagit avec l'agent IA
  const trackAIAgentInteraction = (interactionType: string, details: Record<string, any> = {}) => {
    return trackWithDeduplication('AIAgentInteraction', {
      interaction_type: interactionType,
      ...details
    });
  };

  // Suivi de la complétion d'une conversation avec l'IA
  const trackConversationComplete = (conversationData: {
    duration: number;
    messagesCount: number;
    demandType?: string;
    email?: string;
    name?: string;
    demand_id?: string;
  }) => {
    return trackWithDeduplication('CompleteConversation', {
      ...conversationData,
      content_category: 'AI_Conversation'
    });
  };

  return {
    trackNewAIDemand,
    trackAIAgentInteraction,
    trackConversationComplete
  };
};

// Fonction utilitaire pour le suivi des pages
const usePageView = (pageName: string, additionalData: Record<string, any> = {}) => {
  useEffect(() => {
    trackEvent('PageView', {
      page_name: pageName,
      ...additionalData
    });
  }, [pageName, additionalData]);
};

export default usePageView;
