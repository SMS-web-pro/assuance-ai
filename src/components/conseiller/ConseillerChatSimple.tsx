
import { useState, useEffect } from "react";
import { ChatDialog } from "@/components/chat/ChatDialog";

export const ConseillerChatSimple = () => {
  const [conseillerNom, setConseillerNom] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const sessionData = localStorage.getItem('conseiller_session');
    console.log('Conseiller session data:', sessionData);
    
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        console.log('Parsed session:', session);
        if (session.nom) {
          setConseillerNom(session.nom);
          console.log('Setting conseiller nom:', session.nom);
        } else {
          console.error('No nom found in session:', session);
        }
      } catch (error) {
        console.error('Error parsing session data:', error);
      }
    } else {
      console.log('No conseiller session found');
    }
    setIsLoading(false);
  }, []);

  const generateChatKey = (nom: string) => {
    // Normaliser le nom pour éviter les problèmes de casse et d'espaces
    const normalizedName = nom.toLowerCase().replace(/\s+/g, '_');
    const chatKey = `conseiller_chat_${normalizedName}`;
    console.log('Generated conseiller chat key:', chatKey);
    return chatKey;
  };

  // Afficher un loader pendant le chargement
  if (isLoading) {
    return null;
  }

  if (!conseillerNom) {
    console.log('No conseiller name found, not rendering chat');
    return null;
  }

  console.log('Rendering chat for conseiller:', conseillerNom);

  return (
    <ChatDialog
      chatKey={generateChatKey(conseillerNom)}
      senderType="conseiller"
      senderName={conseillerNom}
      title="Chat avec l'Administration"
      subtitle={`Discussion administrative - ${conseillerNom}`}
    />
  );
};
