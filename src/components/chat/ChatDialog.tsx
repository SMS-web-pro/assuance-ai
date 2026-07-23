
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, RefreshCw } from "lucide-react";
import { useChatStorage, ChatMessage } from "@/hooks/useChatStorage";

interface ChatDialogProps {
  chatKey: string;
  senderType: 'admin' | 'conseiller';
  senderName: string;
  title: string;
  subtitle?: string;
}

export const ChatDialog = ({
  chatKey,
  senderType,
  senderName,
  title,
  subtitle
}: ChatDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    unreadCount,
    sendMessage,
    forceReload
  } = useChatStorage({
    chatKey,
    senderType,
    senderName,
    isOpen
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Forcer le rechargement des messages quand le dialog s'ouvre
  useEffect(() => {
    if (isOpen) {
      console.log('Dialog opened, force reloading messages');
      forceReload();
      // Petite pause pour s'assurer que le marquage comme lu se fait après le chargement
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [isOpen, forceReload]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    sendMessage(newMessage);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRefresh = () => {
    console.log('Manual refresh triggered');
    forceReload();
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
            {title}
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}
              </Badge>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh}
              className="ml-auto h-6 w-6 p-0"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </DialogTitle>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 p-2">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Aucun message</p>
                <p className="text-sm">Commencez la conversation !</p>
              </div>
            ) : (
              messages.map((message) => (
                <div key={message.id} className="flex flex-col">
                  <div className={`flex ${message.sender_type === senderType ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-lg p-3 ${
                      message.sender_type === senderType
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
            placeholder="Tapez votre message..."
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button 
            onClick={handleSend} 
            disabled={!newMessage.trim()} 
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
