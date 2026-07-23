
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Users, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNotificationSound } from "@/hooks/useNotificationSound";

interface Conseiller {
  id: number;
  nom: string;
  email: string;
  statut: string;
}

interface Message {
  id: string;
  sender_type: 'admin' | 'conseiller';
  sender_name: string;
  message: string;
  timestamp: string;
  recipient_type: 'all' | 'single';
  recipient_id?: number;
}

const AdminChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [conseillers, setConseillers] = useState<Conseiller[]>([]);
  const [selectedConseiller, setSelectedConseiller] = useState<string>('all');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastReadTime, setLastReadTime] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showChatToast } = useNotificationSound();

  console.log('AdminChat - Messages:', messages);
  console.log('AdminChat - Selected conseiller:', selectedConseiller);
  console.log('AdminChat - Unread count:', unreadCount);

  useEffect(() => {
    if (isOpen) {
      loadConseillers();
      loadMessages();
      markMessagesAsRead();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedConseiller && isOpen) {
      loadMessages();
    }
  }, [selectedConseiller]);

  useEffect(() => {
    const interval = setInterval(checkForNewMessages, 3000);
    return () => clearInterval(interval);
  }, [selectedConseiller]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConseillers = async () => {
    try {
      const { data, error } = await supabase
        .from('conseillers')
        .select('id, nom, email, statut')
        .order('nom');

      if (error) throw error;
      setConseillers(data || []);
      console.log('AdminChat - Conseillers loaded:', data);
    } catch (error) {
      console.error('AdminChat - Error loading conseillers:', error);
      toast.error('Erreur lors du chargement des conseillers');
    }
  };

  const getStorageKey = () => {
    if (selectedConseiller === 'all') {
      return 'admin_chat_all';
    }
    const conseiller = conseillers.find(c => c.id.toString() === selectedConseiller);
    return conseiller ? `admin_chat_${conseiller.nom}` : 'admin_chat_unknown';
  };

  const loadMessages = () => {
    try {
      const storageKey = getStorageKey();
      console.log('AdminChat - Loading from storage key:', storageKey);
      
      const savedMessages = localStorage.getItem(storageKey);
      const lastRead = localStorage.getItem(`${storageKey}_last_read`) || '';
      
      console.log('AdminChat - Saved messages:', savedMessages);
      console.log('AdminChat - Last read:', lastRead);
      
      setLastReadTime(lastRead);
      
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        setMessages(parsedMessages);
        console.log('AdminChat - Parsed messages:', parsedMessages);
        
        const unreadMessages = parsedMessages.filter((msg: Message) => 
          msg.sender_type === 'conseiller' && 
          msg.timestamp > lastRead
        );
        setUnreadCount(unreadMessages.length);
        console.log('AdminChat - Unread messages:', unreadMessages);
      } else {
        setMessages([]);
        setUnreadCount(0);
        console.log('AdminChat - No saved messages found');
      }
    } catch (error) {
      console.error('AdminChat - Error loading messages:', error);
    }
  };

  const checkForNewMessages = () => {
    if (!isOpen) return;
    
    try {
      const storageKey = getStorageKey();
      console.log('AdminChat - Checking for new messages:', storageKey);
      
      const savedMessages = localStorage.getItem(storageKey);
      
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        
        if (parsedMessages.length !== messages.length) {
          console.log('AdminChat - New messages detected, updating...');
          setMessages(parsedMessages);
          
          if (!isOpen) {
            const totalUnread = parsedMessages.filter((msg: Message) => 
              msg.sender_type === 'conseiller' && 
              msg.timestamp > lastReadTime
            ).length;
            
            setUnreadCount(totalUnread);
            
            const newMessages = parsedMessages.slice(messages.length);
            if (newMessages.length > 0) {
              const lastNewMessage = newMessages[newMessages.length - 1];
              if (lastNewMessage.sender_type === 'conseiller') {
                showChatToast(`Nouveau message de ${lastNewMessage.sender_name}`, lastNewMessage.message);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('AdminChat - Error checking for new messages:', error);
    }
  };

  const markMessagesAsRead = () => {
    const currentTime = new Date().toISOString();
    const storageKey = getStorageKey();
    
    localStorage.setItem(`${storageKey}_last_read`, currentTime);
    setLastReadTime(currentTime);
    setUnreadCount(0);
    console.log('AdminChat - Messages marked as read at:', currentTime);
  };

  const saveMessages = (updatedMessages: Message[]) => {
    try {
      const storageKey = getStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(updatedMessages));
      console.log('AdminChat - Messages saved to:', storageKey, updatedMessages);
      
      // Si on envoie à un conseiller spécifique, synchroniser avec son chat
      if (selectedConseiller !== 'all') {
        const conseiller = conseillers.find(c => c.id.toString() === selectedConseiller);
        if (conseiller) {
          const conseillerStorageKey = `conseiller_chat_${conseiller.nom}`;
          
          // Récupérer les messages existants du conseiller
          const existingConseillerMessages = localStorage.getItem(conseillerStorageKey);
          let conseillerMessages = existingConseillerMessages ? JSON.parse(existingConseillerMessages) : [];
          
          // Ajouter seulement les nouveaux messages de l'admin
          const lastMessage = updatedMessages[updatedMessages.length - 1];
          if (lastMessage && lastMessage.sender_type === 'admin') {
            // Vérifier si le message n'existe pas déjà
            const messageExists = conseillerMessages.some((msg: Message) => msg.id === lastMessage.id);
            if (!messageExists) {
              conseillerMessages.push(lastMessage);
              localStorage.setItem(conseillerStorageKey, JSON.stringify(conseillerMessages));
              console.log('AdminChat - Message added to conseiller storage:', conseillerStorageKey, lastMessage);
              
              // Déclencher un événement de stockage pour notifier le conseiller
              window.dispatchEvent(new StorageEvent('storage', {
                key: conseillerStorageKey,
                newValue: JSON.stringify(conseillerMessages),
                oldValue: existingConseillerMessages
              }));
            }
          }
        }
      }
      
      // Déclencher l'événement de stockage pour l'admin
      window.dispatchEvent(new StorageEvent('storage', {
        key: storageKey,
        newValue: JSON.stringify(updatedMessages)
      }));
    } catch (error) {
      console.error('AdminChat - Error saving messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) {
      console.log('AdminChat - Cannot send message: empty message');
      return;
    }

    setIsLoading(true);
    try {
      const message: Message = {
        id: Date.now().toString(),
        sender_type: 'admin',
        sender_name: 'Administrateur',
        message: newMessage.trim(),
        timestamp: new Date().toISOString(),
        recipient_type: selectedConseiller === 'all' ? 'all' : 'single',
        recipient_id: selectedConseiller !== 'all' ? parseInt(selectedConseiller) : undefined
      };

      console.log('AdminChat - Sending message:', message);

      const updatedMessages = [...messages, message];
      setMessages(updatedMessages);
      saveMessages(updatedMessages);
      setNewMessage('');

      toast.success(
        selectedConseiller === 'all' 
          ? 'Message envoyé à tous les conseillers' 
          : 'Message envoyé au conseiller'
      );
    } catch (error) {
      console.error('AdminChat - Error sending message:', error);
      toast.error('Erreur lors de l\'envoi du message');
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedConseillerName = () => {
    if (selectedConseiller === 'all') return 'Tous les conseillers';
    const conseiller = conseillers.find(c => c.id.toString() === selectedConseiller);
    return conseiller ? conseiller.nom : 'Conseiller';
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 relative">
          <MessageCircle className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Ouvrir le chat</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Chat Administrateur
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 pb-4 border-b">
          <span className="text-sm font-medium">Discuter avec:</span>
          <Select value={selectedConseiller} onValueChange={setSelectedConseiller}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Tous les conseillers
                </div>
              </SelectItem>
              {conseillers.map((conseiller) => (
                <SelectItem key={conseiller.id} value={conseiller.id.toString()}>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {conseiller.nom}
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
        </div>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 p-2">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Aucun message avec {getSelectedConseillerName()}</p>
                <p className="text-sm">Commencez la conversation !</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="flex flex-col">
                  <div className={`flex ${message.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-lg p-3 ${
                      message.sender_type === 'admin'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium opacity-75">
                          {message.sender_name}
                        </span>
                        <span className="text-xs opacity-50">
                          {new Date(message.timestamp).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-sm">{message.message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Tapez votre message pour ${getSelectedConseillerName()}...`}
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            disabled={isLoading}
            className="flex-1"
          />
          <Button 
            onClick={sendMessage} 
            disabled={isLoading || !newMessage.trim()}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-xs text-gray-500 text-center pt-2">
          💡 Les conseillers recevront une notification de vos messages
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminChat;
