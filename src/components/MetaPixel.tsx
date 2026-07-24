import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

const META_PIXEL_ID = '726238137002168';

// Cache pour les événements en attente d'initialisation du Pixel
const pendingEvents: Array<[string, Record<string, any>]> = [];
let isPixelReady = false;

/**
 * Fonction pour suivre un événement avec Facebook Pixel
 * Gère automatiquement les événements si le Pixel n'est pas encore chargé
 */
export const trackEvent = (eventName: string, eventData: Record<string, any> = {}) => {
  // Ajouter un timestamp à chaque événement
  const eventWithTimestamp = {
    ...eventData,
    timestamp: new Date().toISOString()
  };

  if (typeof window === 'undefined') {
    console.log(`[Pixel] Navigation côté serveur - événement ignoré: ${eventName}`);
    return false;
  }

  if (!isPixelReady || !window.fbq) {
    console.log(`[Pixel] En attente d'initialisation - événement mis en file d'attente: ${eventName}`, eventWithTimestamp);
    pendingEvents.push([eventName, eventWithTimestamp]);
    return false;
  }

  // Standard Facebook Pixel events
  const standardEvents = ['PageView', 'ViewContent', 'Lead', 'CompleteRegistration', 'AddToCart', 'InitiateCheckout', 'AddPaymentInfo', 'Purchase', 'Search'];

  try {
    console.log(`[Pixel] Envoi de l'événement: ${eventName}`, eventWithTimestamp);
    if (standardEvents.includes(eventName)) {
      window.fbq('track', eventName, eventWithTimestamp);
    } else {
      window.fbq('trackCustom', eventName, eventWithTimestamp);
    }
    return true;
  } catch (error) {
    console.error(`[Pixel] Erreur lors de l'envoi de l'événement ${eventName}:`, error);
    return false;
  }
};

// Traiter les événements en attente une fois le Pixel initialisé
const processPendingEvents = () => {
  if (typeof window === 'undefined' || !window.fbq) return;
  
  console.log(`[Pixel] Traitement de ${pendingEvents.length} événements en attente`);
  
  while (pendingEvents.length > 0) {
    const [eventName, eventData] = pendingEvents.shift()!;
    try {
      const standardEvents = ['PageView', 'ViewContent', 'Lead', 'CompleteRegistration', 'AddToCart', 'InitiateCheckout', 'AddPaymentInfo', 'Purchase', 'Search'];
      if (standardEvents.includes(eventName)) {
        window.fbq('track', eventName, eventData);
      } else {
        window.fbq('trackCustom', eventName, eventData);
      }
      console.log(`[Pixel] Événement en attente traité: ${eventName}`);
    } catch (error) {
      console.error(`[Pixel] Erreur lors du traitement de l'événement en attente ${eventName}:`, error);
    }
  }
};

// Déclaration du type pour fbq
declare global {
  interface Window {
    fbq: {
      (command: 'init', id: string): void;
      (command: 'track', event: string, params?: Record<string, any>): void;
      (command: 'trackCustom', event: string, params?: Record<string, any>): void;
      loaded: boolean;
      version: string;
      queue: any[];
      push: (...args: any[]) => void;
      callMethod?: (...args: any[]) => void;
    };
    _fbq?: any;
  }
}

// Variable pour suivre si le Pixel a déjà été initialisé
let pixelInitialized = false;

export const MetaPixel = () => {
  useEffect(() => {
    // Vérifier si on est en production
    if (process.env.NODE_ENV !== 'production') {
      console.log('Mode développement: Le Pixel Facebook ne sera pas initialisé');
      return;
    }

    // Vérifier si le script existe déjà ou a déjà été initialisé
    if (window.fbq || pixelInitialized) {
      console.log('Facebook Pixel déjà initialisé');
      return;
    }

    try {
      // Initialisation simplifiée du Pixel Facebook
      const script = document.createElement('script');
      script.id = 'facebook-pixel';
      script.async = true;
      script.src = 'https://connect.facebook.net/en_US/fbevents.js';
      
      // Initialisation de la queue fbq
      window.fbq = function() {
        window.fbq.callMethod ? 
          window.fbq.callMethod.apply(window.fbq, arguments) : 
          window.fbq.queue.push(arguments);
      } as any;
      
      if (!window._fbq) window._fbq = window.fbq;
      window.fbq.push = window.fbq;
      window.fbq.loaded = false;
      window.fbq.version = '2.0';
      window.fbq.queue = [];
      
      // Gestion du chargement du script
      script.onload = () => {
        if (window.fbq && !pixelInitialized) {
          window.fbq.loaded = true;
          window.fbq('init', META_PIXEL_ID);
          window.fbq('track', 'PageView');
          pixelInitialized = true;
          isPixelReady = true;
          console.log('Facebook Pixel initialisé avec succès');
          
          // Traiter les événements en attente
          processPendingEvents();
        }
      };
      
      script.onerror = (error) => {
        console.error('Erreur lors du chargement du script Facebook Pixel:', error);
      };
      
      // Ajout du script au document
      document.head.appendChild(script);
      
      // Nettoyage
      return () => {
        const script = document.getElementById('facebook-pixel');
        if (script) {
          document.head.removeChild(script);
        }
      };
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du Pixel Facebook:', error);
    }
  }, []);

  return (
    <Helmet>
      <meta name="facebook-domain-verification" content="your-verification-hash" />
      <noscript>
        {`
          <img
            height="1"
            width="1"
            style="display:none"
            src="https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1"
            alt="Facebook Pixel"
          />
        `}
      </noscript>
    </Helmet>
  );
};
