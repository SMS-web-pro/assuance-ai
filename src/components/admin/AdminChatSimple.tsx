
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, User, Send, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChatDialog } from "@/components/chat/ChatDialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Conseiller {
  id: number;
  nom: string;
  email: string;
  statut: string;
}

export const AdminChatSimple = () => {
  const [conseillers, setConseillers] = useState<Conseiller[]>([]);
  const [selectedConseiller, setSelectedConseiller] = useState<string>('');
  const [selectedConseillers, setSelectedConseillers] = useState<number[]>([]);
  const [showGroupChat, setShowGroupChat] = useState(false);
  const [groupMessage, setGroupMessage] = useState('');
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadConseillers();
    checkUnreadMessages();
    const interval = setInterval(checkUnreadMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadConseillers = async () => {
    try {
      const { data, error } = await supabase
        .from('conseillers')
        .select('id, nom, email, statut')
        .order('nom');

      if (error) throw error;
      console.log('Conseillers loaded:', data);
      setConseillers(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des conseillers:', error);
      toast.error('Erreur lors du chargement des conseillers');
    }
  };

  const checkUnreadMessages = () => {
    const counts: Record<string, number> = {};
    
    conseillers.forEach(conseiller => {
      const chatKey = generateChatKey(conseiller.nom);
      const savedMessages = localStorage.getItem(chatKey);
      const lastRead = localStorage.getItem(`${chatKey}_last_read`) || '';
      
      if (savedMessages) {
        try {
          const messages = JSON.parse(savedMessages);
          const unreadMessages = messages.filter((msg: any) => 
            msg.sender_type === 'conseiller' && 
            msg.timestamp > lastRead
          );
          if (unreadMessages.length > 0) {
            counts[conseiller.id.toString()] = unreadMessages.length;
          }
        } catch (error) {
          console.error('Error parsing messages for conseiller:', conseiller.nom, error);
        }
      }
    });
    
    setUnreadCounts(counts);
  };

  const getSelectedConseillerName = () => {
    const conseiller = conseillers.find(c => c.id.toString() === selectedConseiller);
    const nom = conseiller ? conseiller.nom : '';
    console.log('Selected conseiller name:', nom);
    return nom;
  };

  const generateChatKey = (conseillerNom: string) => {
    const normalizedName = conseillerNom.toLowerCase().replace(/\s+/g, '_');
    const chatKey = `admin_chat_${normalizedName}`;
    console.log('Generated admin chat key:', chatKey);
    return chatKey;
  };

  const handleConseillerSelection = (conseillerId: number, checked: boolean) => {
    if (checked) {
      setSelectedConseillers(prev => [...prev, conseillerId]);
    } else {
      setSelectedConseillers(prev => prev.filter(id => id !== conseillerId));
    }
  };

  const sendGroupMessage = async () => {
    if (!groupMessage.trim()) {
      toast.error('Veuillez saisir un message');
      return;
    }

    const targetConseillers = selectedConseillers.length > 0 
      ? conseillers.filter(c => selectedConseillers.includes(c.id))
      : conseillers;

    if (targetConseillers.length === 0) {
      toast.error('Aucun conseiller sélectionné');
      return;
    }

    try {
      const message = {
        id: `${Date.now()}-${Math.random()}`,
        sender_type: 'admin' as const,
        sender_name: 'Administrateur',
        message: groupMessage.trim(),
        timestamp: new Date().toISOString()
      };

      // Envoyer le message à tous les conseillers sélectionnés
      targetConseillers.forEach(conseiller => {
        const chatKey = generateChatKey(conseiller.nom);
        const existingMessages = localStorage.getItem(chatKey);
        const messages = existingMessages ? JSON.parse(existingMessages) : [];
        
        const updatedMessages = [...messages, message];
        localStorage.setItem(chatKey, JSON.stringify(updatedMessages));
        
        // Synchroniser avec le chat du conseiller
        const conseillerChatKey = `conseiller_chat_${conseiller.nom.toLowerCase().replace(/\s+/g, '_')}`;
        localStorage.setItem(conseillerChatKey, JSON.stringify(updatedMessages));
        
        // Déclencher les événements de mise à jour
        window.dispatchEvent(new StorageEvent('storage', {
          key: chatKey,
          newValue: JSON.stringify(updatedMessages)
        }));
        
        window.dispatchEvent(new StorageEvent('storage', {
          key: conseillerChatKey,
          newValue: JSON.stringify(updatedMessages)
        }));
      });

      const recipientNames = targetConseillers.map(c => c.nom).join(', ');
      toast.success(`Message envoyé à: ${recipientNames}`);
      
      setGroupMessage('');
      setShowGroupChat(false);
      setSelectedConseillers([]);
      
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message groupé:', error);
      toast.error('Erreur lors de l\'envoi du message');
    }
  };

  const getTotalUnreadCount = () => {
    return Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
  };

  if (!selectedConseiller) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm">Chat avec:</span>
        <Select value={selectedConseiller} onValueChange={setSelectedConseiller}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Choisir un conseiller" />
          </SelectTrigger>
          <SelectContent>
            {conseillers.map((conseiller) => (
              <SelectItem key={conseiller.id} value={conseiller.id.toString()}>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {conseiller.nom}
                  {unreadCounts[conseiller.id.toString()] && (
                    <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                      {unreadCounts[conseiller.id.toString()]}
                    </Badge>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    conseiller.statut === 'En ligne' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {conseiller.statut}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Dialog open={showGroupChat} onOpenChange={setShowGroupChat}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="relative">
              <Users className="h-4 w-4 mr-2" />
              Message groupé
              {getTotalUnreadCount() > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {getTotalUnreadCount()}
                </Badge>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Envoyer un message groupé
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Sélectionner les conseillers destinataires:</p>
                <div className="flex items-center gap-2 mb-3">
                  <Checkbox
                    id="select-all"
                    checked={selectedConseillers.length === conseillers.length}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedConseillers(conseillers.map(c => c.id));
                      } else {
                        setSelectedConseillers([]);
                      }
                    }}
                  />
                  <label htmlFor="select-all" className="text-sm font-medium">
                    Sélectionner tous les conseillers
                  </label>
                </div>
                
                <ScrollArea className="h-32 border rounded-md p-2">
                  <div className="space-y-2">
                    {conseillers.map((conseiller) => (
                      <div key={conseiller.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`conseiller-${conseiller.id}`}
                          checked={selectedConseillers.includes(conseiller.id)}
                          onCheckedChange={(checked) => 
                            handleConseillerSelection(conseiller.id, checked as boolean)
                          }
                        />
                        <label 
                          htmlFor={`conseiller-${conseiller.id}`} 
                          className="text-sm flex items-center gap-2 flex-1"
                        >
                          <User className="h-4 w-4" />
                          {conseiller.nom}
                          {unreadCounts[conseiller.id.toString()] && (
                            <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                              {unreadCounts[conseiller.id.toString()]}
                            </Badge>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            conseiller.statut === 'En ligne' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {conseiller.statut}
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                <p className="text-xs text-gray-600 mt-2">
                  {selectedConseillers.length === 0 
                    ? "Tous les conseillers seront sélectionnés si aucun n'est choisi"
                    : `${selectedConseillers.length} conseiller(s) sélectionné(s)`
                  }
                </p>
              </div>
              
              <div>
                <label htmlFor="group-message" className="text-sm font-medium">Message:</label>
                <Textarea
                  id="group-message"
                  value={groupMessage}
                  onChange={(e) => setGroupMessage(e.target.value)}
                  placeholder="Tapez votre message pour les conseillers..."
                  className="mt-1"
                  rows={4}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowGroupChat(false)}>
                  Annuler
                </Button>
                <Button onClick={sendGroupMessage} disabled={!groupMessage.trim()}>
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  const conseillerName = getSelectedConseillerName();

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedConseiller} onValueChange={setSelectedConseiller}>
        <SelectTrigger className="w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {conseillers.map((conseiller) => (
            <SelectItem key={conseiller.id} value={conseiller.id.toString()}>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {conseiller.nom}
                {unreadCounts[conseiller.id.toString()] && (
                  <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {unreadCounts[conseiller.id.toString()]}
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <ChatDialog
        chatKey={generateChatKey(conseillerName)}
        senderType="admin"
        senderName="Administrateur"
        title={`Chat avec ${conseillerName}`}
        subtitle="Discussion avec le conseiller"
      />
      
      <Dialog open={showGroupChat} onOpenChange={setShowGroupChat}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            <Users className="h-4 w-4" />
            {getTotalUnreadCount() > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {getTotalUnreadCount()}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Envoyer un message groupé
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Sélectionner les conseillers destinataires:</p>
              <div className="flex items-center gap-2 mb-3">
                <Checkbox
                  id="select-all-chat"
                  checked={selectedConseillers.length === conseillers.length}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedConseillers(conseillers.map(c => c.id));
                    } else {
                      setSelectedConseillers([]);
                    }
                  }}
                />
                <label htmlFor="select-all-chat" className="text-sm font-medium">
                  Sélectionner tous les conseillers
                </label>
              </div>
              
              <ScrollArea className="h-32 border rounded-md p-2">
                <div className="space-y-2">
                  {conseillers.map((conseiller) => (
                    <div key={conseiller.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`conseiller-chat-${conseiller.id}`}
                        checked={selectedConseillers.includes(conseiller.id)}
                        onCheckedChange={(checked) => 
                          handleConseillerSelection(conseiller.id, checked as boolean)
                        }
                      />
                      <label 
                        htmlFor={`conseiller-chat-${conseiller.id}`} 
                        className="text-sm flex items-center gap-2 flex-1"
                      >
                        <User className="h-4 w-4" />
                        {conseiller.nom}
                        {unreadCounts[conseiller.id.toString()] && (
                          <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                            {unreadCounts[conseiller.id.toString()]}
                          </Badge>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          conseiller.statut === 'En ligne' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {conseiller.statut}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <p className="text-xs text-gray-600 mt-2">
                {selectedConseillers.length === 0 
                  ? "Tous les conseillers seront sélectionnés si aucun n'est choisi"
                  : `${selectedConseillers.length} conseiller(s) sélectionné(s)`
                }
              </p>
            </div>
            
            <div>
              <label htmlFor="group-message-chat" className="text-sm font-medium">Message:</label>
              <Textarea
                id="group-message-chat"
                value={groupMessage}
                onChange={(e) => setGroupMessage(e.target.value)}
                placeholder="Tapez votre message pour les conseillers..."
                className="mt-1"
                rows={4}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowGroupChat(false)}>
                Annuler
              </Button>
              <Button onClick={sendGroupMessage} disabled={!groupMessage.trim()}>
                <Send className="h-4 w-4 mr-2" />
                Envoyer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
