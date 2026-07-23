
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Shield } from "lucide-react";
import { toast } from "sonner";
import { useNotificationSound } from "@/hooks/useNotificationSound";

interface Message {
  id: string;
  sender_type: 'admin' | 'conseiller';
  sender_name: string;
  message: string;
  timestamp: string;
}

const ConseillerChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conseillerNom, setConseillerNom] = useState<string>('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastReadTime, setLastReadTime] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showChatToast } = useNotificationSound();

  console.log('ConseillerChat - Messages:', messages);
  console.log('ConseillerChat - Conseiller nom:', conseillerNom);
  console.log('ConseillerChat - Unread count:', unreadCount);

  useEffect(() => {
    const sessionData = localStorage.getItem('conseiller_session');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      setConseillerNom(session.nom);
      console.log('ConseillerChat - Session loaded:', session.nom);
    }
  }, []);

  useEffect(() => {
    if (conseillerNom) {
      loadMessages();
      const interval = setInterval(checkForNewMessages, 2000); // Plus fréquent
      return () => clearInterval(interval);
    }
  }, [conseillerNom]);

  useEffect(() => {
    if (isOpen) {
      markMessagesAsRead();
      scrollToBottom();
    }
  }, [isOpen, messages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Écouter les événements de stockage pour les mises à jour en temps réel
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `conseiller_chat_${conseillerNom}` && e.newValue) {
        console.log('ConseillerChat - Storage event detected:', e.key);
        const newMessages = JSON.parse(e.newValue);
        setMessages(newMessages);
        
        if (!isOpen) {
          // Compter les nouveaux messages non lus
          const unreadMessages = newMessages.filter((msg: Message) => 
            msg.sender_type === 'admin' && 
            msg.timestamp > lastReadTime
          );
          setUnreadCount(unreadMessages.length);
          
          // Afficher une notification pour les nouveaux messages
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.sender_type === 'admin') {
            showChatToast(`Nouveau message de ${lastMessage.sender_name}`, lastMessage.message);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [conseillerNom, isOpen, lastReadTime, showChatToast]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = () => {
    try {
      const storageKey = `conseiller_chat_${conseillerNom}`;
      console.log('ConseillerChat - Loading from storage key:', storageKey);
      
      const savedMessages = localStorage.getItem(storageKey);
      const lastRead = localStorage.getItem(`${storageKey}_last_read`) || '';
      
      console.log('ConseillerChat - Saved messages:', savedMessages);
      console.log('ConseillerChat - Last read:', lastRead);
      
      setLastReadTime(lastRead);
      
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        setMessages(parsedMessages);
        console.log('ConseillerChat - Parsed messages:', parsedMessages);
        
        const unreadMessages = parsedMessages.filter((msg: Message) => 
          msg.sender_type === 'admin' && 
          msg.timestamp > lastRead
        );
        setUnreadCount(unreadMessages.length);
        console.log('ConseillerChat - Unread messages:', unreadMessages);
      } else {
        setMessages([]);
        setUnreadCount(0);
        console.log('ConseillerChat - No saved messages found');
      }
    } catch (error) {
      console.error('ConseillerChat - Error loading messages:', error);
    }
  };

  const checkForNewMessages = () => {
    if (!conseillerNom) return;
    
    try {
      const storageKey = `conseiller_chat_${conseillerNom}`;
      const savedMessages = localStorage.getItem(storageKey);
      
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages);
        
        if (parsedMessages.length !== messages.length) {
          console.log('ConseillerChat - New messages detected, updating...');
          setMessages(parsedMessages);
          
          if (!isOpen) {
            const totalUnread = parsedMessages.filter((msg: Message) => 
              msg.sender_type === 'admin' && 
              msg.timestamp > lastReadTime
            ).length;
            
            setUnreadCount(totalUnread);
            
            const lastMessage = parsedMessages[parsedMessages.length - 1];
            if (lastMessage && lastMessage.sender_type === 'admin') {
              showChatToast(`Nouveau message de ${lastMessage.sender_name}`, lastMessage.message);
            }
          }
        }
      }
    } catch (error) {
      console.error('ConseillerChat - Error checking for new messages:', error);
    }
  };

  const markMessagesAsRead = () => {
    if (!conseillerNom) return;
    
    const currentTime = new Date().toISOString();
    const storageKey = `conseiller_chat_${conseillerNom}`;
    
    localStorage.setItem(`${storageKey}_last_read`, currentTime);
    setLastReadTime(currentTime);
    setUnreadCount(0);
    console.log('ConseillerChat - Messages marked as read at:', currentTime);
  };

  const saveMessages = (updatedMessages: Message[]) => {
    try {
      const storageKey = `conseiller_chat_${conseillerNom}`;
      localStorage.setItem(storageKey, JSON.stringify(updatedMessages));
      console.log('ConseillerChat - Messages saved to:', storageKey, updatedMessages);
      
      // Synchroniser avec le chat admin
      const adminStorageKey = `admin_chat_${conseillerNom}`;
      localStorage.setItem(adminStorageKey, JSON.stringify(updatedMessages));
      console.log('ConseillerChat - Also saved to admin storage:', adminStorageKey);
      
      // Déclencher l'événement de stockage
      window.dispatchEvent(new StorageEvent('storage', {
        key: storageKey,
        newValue: JSON.stringify(updatedMessages)
      }));
      
      window.dispatchEvent(new StorageEvent('storage', {
        key: adminStorageKey,
        newValue: JSON.stringify(updatedMessages)
      }));
    } catch (error) {
      console.error('ConseillerChat - Error saving messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conseillerNom) {
      console.log('ConseillerChat - Cannot send message: empty message or no conseiller name');
      return;
    }

    setIsLoading(true);
    try {
      const message: Message = {
        id: Date.now().toString(),
        sender_type: 'conseiller',
        sender_name: conseillerNom,
        message: newMessage.trim(),
        timestamp: new Date().toISOString()
      };

      console.log('ConseillerChat - Sending message:', message);

      const updatedMessages = [...messages, message];
      setMessages(updatedMessages);
      saveMessages(updatedMessages);
      
      setNewMessage('');
      toast.success('Message envoyé à l\'administration');
    } catch (error) {
      console.error('ConseillerChat - Error sending message:', error);
      toast.error('Erreur lors de l\'envoi du message');
    } finally {
      setIsLoading(false);
    }
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
            Chat avec l'Administration
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 pb-4 border-b">
          <Shield className="h-4 w-4 text-gray-600" />
          <span className="text-sm text-gray-600">
            Discussion avec l'équipe administrative - {conseillerNom}
          </span>
        </div>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 p-2">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Aucun message avec l'administration</p>
                <p className="text-sm">Commencez la conversation !</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="flex flex-col">
                  <div className={`flex ${message.sender_type === 'conseiller' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-lg p-3 ${
                      message.sender_type === 'conseiller'
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
            placeholder="Tapez votre message à l'administration..."
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
          💬 Communiquez directement avec l'équipe administrative
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConseillerChat;
