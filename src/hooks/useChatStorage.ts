
import { useState, useEffect, useCallback } from 'react';
import { useNotificationSound } from './useNotificationSound';

export interface ChatMessage {
  id: string;
  sender_type: 'admin' | 'conseiller';
  sender_name: string;
  message: string;
  timestamp: string;
}

interface UseChatStorageProps {
  chatKey: string;
  senderType: 'admin' | 'conseiller';
  senderName: string;
  isOpen: boolean;
}

export const useChatStorage = ({ chatKey, senderType, senderName, isOpen }: UseChatStorageProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { showChatToast } = useNotificationSound();

  // Normaliser les noms pour éviter les problèmes de casse
  const normalizedChatKey = chatKey.toLowerCase().replace(/\s+/g, '_');
  
  console.log('useChatStorage - Chat key:', normalizedChatKey);
  console.log('useChatStorage - Sender type:', senderType);
  console.log('useChatStorage - Sender name:', senderName);

  // Charger les messages au démarrage
  const loadMessages = useCallback(() => {
    try {
      const savedMessages = localStorage.getItem(normalizedChatKey);
      console.log('Loading messages for key:', normalizedChatKey, savedMessages);
      
      if (savedMessages) {
        const parsedMessages: ChatMessage[] = JSON.parse(savedMessages);
        setMessages(parsedMessages);
        console.log('Loaded messages:', parsedMessages);
        
        // Compter les messages non lus
        const lastReadTime = localStorage.getItem(`${normalizedChatKey}_last_read`) || '';
        const unreadMessages = parsedMessages.filter(msg => 
          msg.sender_type !== senderType && 
          msg.timestamp > lastReadTime
        );
        setUnreadCount(unreadMessages.length);
        console.log('Unread messages count:', unreadMessages.length);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
    }
  }, [normalizedChatKey, senderType]);

  // Sauvegarder les messages avec synchronisation temps réel améliorée
  const saveMessages = useCallback((newMessages: ChatMessage[]) => {
    try {
      console.log('Saving messages to key:', normalizedChatKey, newMessages);
      localStorage.setItem(normalizedChatKey, JSON.stringify(newMessages));
      
      // Synchronisation croisée pour l'autre côté du chat
      const otherChatKey = normalizedChatKey.includes('admin_chat_') 
        ? normalizedChatKey.replace('admin_chat_', 'conseiller_chat_')
        : normalizedChatKey.replace('conseiller_chat_', 'admin_chat_');
      
      console.log('Cross-sync to key:', otherChatKey);
      localStorage.setItem(otherChatKey, JSON.stringify(newMessages));
      
      // Déclencher l'événement personnalisé pour synchronisation avec plus de détails
      const eventDetail = { 
        chatKey: normalizedChatKey, 
        otherChatKey, 
        messages: newMessages,
        timestamp: Date.now()
      };
      console.log('Dispatching chatUpdate event:', eventDetail);
      
      // Dispatcher plusieurs événements pour s'assurer que tous les composants sont mis à jour
      window.dispatchEvent(new CustomEvent('chatUpdate', { detail: eventDetail }));
      window.dispatchEvent(new CustomEvent('messageUpdate', { detail: eventDetail }));
      
      // Forcer une mise à jour locale
      setMessages([...newMessages]);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des messages:', error);
    }
  }, [normalizedChatKey]);

  // Envoyer un message
  const sendMessage = useCallback((content: string) => {
    if (!content.trim()) return;

    const newMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random()}`,
      sender_type: senderType,
      sender_name: senderName,
      message: content.trim(),
      timestamp: new Date().toISOString()
    };

    console.log('Sending message:', newMessage);
    const updatedMessages = [...messages, newMessage];
    saveMessages(updatedMessages);
  }, [messages, senderType, senderName, saveMessages]);

  // Marquer comme lu quand le chat est ouvert
  const markAsRead = useCallback(() => {
    if (isOpen) {
      const currentTime = new Date().toISOString();
      localStorage.setItem(`${normalizedChatKey}_last_read`, currentTime);
      setUnreadCount(0);
      console.log('Messages marked as read for key:', normalizedChatKey);
    }
  }, [normalizedChatKey, isOpen]);

  // Fonction pour forcer le rechargement des messages
  const forceReload = useCallback(() => {
    console.log('Force reloading messages for key:', normalizedChatKey);
    loadMessages();
  }, [loadMessages]);

  // Fonction pour vérifier les nouveaux messages de tous les conseillers (pour l'admin)
  const checkAllConseillersMessages = useCallback(() => {
    if (senderType !== 'admin') return;
    
    try {
      // Vérifier tous les chats admin_chat_* pour les nouveaux messages
      const allKeys = Object.keys(localStorage);
      const adminChatKeys = allKeys.filter(key => key.startsWith('admin_chat_') && key.endsWith('_last_read') === false);
      
      let hasNewMessages = false;
      
      adminChatKeys.forEach(key => {
        const lastReadKey = `${key}_last_read`;
        const lastReadTime = localStorage.getItem(lastReadKey) || '';
        const savedMessages = localStorage.getItem(key);
        
        if (savedMessages) {
          try {
            const messages = JSON.parse(savedMessages);
            const newMessages = messages.filter((msg: ChatMessage) => 
              msg.sender_type === 'conseiller' && 
              msg.timestamp > lastReadTime
            );
            
            if (newMessages.length > 0 && key !== normalizedChatKey) {
              hasNewMessages = true;
              // Afficher une notification pour les nouveaux messages
              const lastMessage = newMessages[newMessages.length - 1];
              const conseillerName = key.replace('admin_chat_', '').replace(/_/g, ' ');
              showChatToast(
                `Nouveau message de ${conseillerName}`, 
                lastMessage.message
              );
            }
          } catch (error) {
            console.error('Error parsing messages for key:', key, error);
          }
        }
      });
      
    } catch (error) {
      console.error('Error checking all conseillers messages:', error);
    }
  }, [senderType, normalizedChatKey, showChatToast]);

  // Écouter les mises à jour de chat avec gestion améliorée
  useEffect(() => {
    const handleChatUpdate = (event: CustomEvent) => {
      console.log('Chat update event received:', event.detail);
      
      // Vérifier si cet événement concerne notre chat
      const isRelevant = 
        event.detail.chatKey === normalizedChatKey || 
        event.detail.otherChatKey === normalizedChatKey;
      
      console.log('Event relevant for key', normalizedChatKey, ':', isRelevant);
      
      if (isRelevant && event.detail.messages) {
        console.log('Updating messages from event for key:', normalizedChatKey);
        
        // Forcer la mise à jour des messages
        setMessages([...event.detail.messages]);
        
        // Mettre à jour le compteur non lu seulement si le chat n'est pas ouvert
        if (!isOpen) {
          const lastReadTime = localStorage.getItem(`${normalizedChatKey}_last_read`) || '';
          const unreadMessages = event.detail.messages.filter((msg: ChatMessage) => 
            msg.sender_type !== senderType && 
            msg.timestamp > lastReadTime
          );
          setUnreadCount(unreadMessages.length);
          console.log('Updated unread count for key', normalizedChatKey, ':', unreadMessages.length);
          
          // Afficher une notification si on reçoit un nouveau message
          if (unreadMessages.length > 0) {
            const lastMessage = unreadMessages[unreadMessages.length - 1];
            showChatToast(`Nouveau message de ${lastMessage.sender_name}`, lastMessage.message);
          }
        }
      }
    };

    const handleMessageUpdate = (event: CustomEvent) => {
      console.log('Message update event received:', event.detail);
      handleChatUpdate(event);
    };

    // Écouter les événements de stockage pour les changements dans d'autres onglets
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === normalizedChatKey && event.newValue) {
        console.log('Storage change detected for key:', normalizedChatKey);
        try {
          const newMessages = JSON.parse(event.newValue);
          setMessages([...newMessages]);
          
          // Vérifier s'il y a de nouveaux messages non lus
          if (!isOpen) {
            const lastReadTime = localStorage.getItem(`${normalizedChatKey}_last_read`) || '';
            const unreadMessages = newMessages.filter((msg: ChatMessage) => 
              msg.sender_type !== senderType && 
              msg.timestamp > lastReadTime
            );
            setUnreadCount(unreadMessages.length);
            
            if (unreadMessages.length > 0) {
              const lastMessage = unreadMessages[unreadMessages.length - 1];
              showChatToast(`Nouveau message de ${lastMessage.sender_name}`, lastMessage.message);
            }
          }
        } catch (error) {
          console.error('Error parsing storage change:', error);
        }
      }
    };

    console.log('Setting up event listeners for key:', normalizedChatKey);
    
    window.addEventListener('chatUpdate', handleChatUpdate as EventListener);
    window.addEventListener('messageUpdate', handleMessageUpdate as EventListener);
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      console.log('Removing event listeners for key:', normalizedChatKey);
      window.removeEventListener('chatUpdate', handleChatUpdate as EventListener);
      window.removeEventListener('messageUpdate', handleMessageUpdate as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [normalizedChatKey, senderType, isOpen, showChatToast]);

  // Charger les messages au montage et à chaque changement de clé
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Marquer comme lu quand le chat s'ouvre
  useEffect(() => {
    if (isOpen) {
      markAsRead();
    }
  }, [isOpen, markAsRead]);

  // Recharger les messages périodiquement pour s'assurer de la synchronisation
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Periodic reload for key:', normalizedChatKey);
      loadMessages();
      
      // Pour l'admin, vérifier les messages de tous les conseillers
      if (senderType === 'admin') {
        checkAllConseillersMessages();
      }
    }, 2000); // Vérifier toutes les 2 secondes

    return () => clearInterval(interval);
  }, [loadMessages, checkAllConseillersMessages, senderType]);

  return {
    messages,
    unreadCount,
    sendMessage,
    markAsRead,
    forceReload
  };
};
