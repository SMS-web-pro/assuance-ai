
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Search, Phone, Mail } from "lucide-react";
import { ConseillerLayout } from "@/components/ConseillerLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Conversation {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  type_assurance: string;
  statut: string;
  date_creation: string;
  date_modification: string;
}

const ConseilleurMessages = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [conseillerNom, setConseillerNom] = useState<string>("");
  const [messageText, setMessageText] = useState("");

  useEffect(() => {
    const sessionData = localStorage.getItem('conseiller_session');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      setConseillerNom(session.nom);
      fetchConversations(session.nom);
    }
  }, []);

  const fetchConversations = async (nomConseiller: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('demandes_assurance')
        .select('*')
        .eq('conseiller_assigne', nomConseiller)
        .order('date_modification', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des conversations:', error);
        toast.error('Erreur lors du chargement des messages');
        return;
      }

      setConversations(data || []);
      if (data && data.length > 0) {
        setSelectedConversation(data[0]);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des messages');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatutBadge = (statut: string) => {
    const isUnread = statut === 'nouveau';
    return isUnread ? (
      <Badge className="bg-blue-600 text-white">1</Badge>
    ) : null;
  };

  const handleSendMessage = () => {
    if (messageText.trim() && selectedConversation) {
      // Ici vous pourriez implémenter l'envoi de message
      toast.success("Message envoyé !");
      setMessageText("");
    }
  };

  if (loading) {
    return (
      <ConseillerLayout title="Messages">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Chargement des messages...</div>
        </div>
      </ConseillerLayout>
    );
  }

  return (
    <ConseillerLayout title="Messages">
      <div className="flex h-[calc(100vh-200px)] gap-6">
        {/* Liste des conversations */}
        <div className="w-1/3 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Messages</h1>
            <Button size="sm">
              <MessageSquare className="w-4 h-4 mr-2" />
              Nouveau
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input placeholder="Rechercher une conversation..." className="pl-10" />
          </div>

          <Card className="h-full">
            <CardContent className="p-0">
              <div className="space-y-0">
                {conversations.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Aucune conversation</p>
                ) : (
                  conversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedConversation?.id === conv.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">{conv.nom} {conv.prenom}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{formatDate(conv.date_modification)}</span>
                          {getStatutBadge(conv.statut)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        Demande {conv.type_assurance} - {conv.statut}
                      </p>
                      <div className="flex items-center gap-1 mt-2">
                        <MessageSquare className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400">Conversation client</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Zone de conversation */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <Card className="flex-1 flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    {selectedConversation.nom} {selectedConversation.prenom}
                  </CardTitle>
                  <div className="flex gap-2">
                    {selectedConversation.telephone && (
                      <Button size="sm" variant="outline">
                        <Phone className="w-4 h-4 mr-2" />
                        Appeler
                      </Button>
                    )}
                    {selectedConversation.email && (
                      <Button size="sm" variant="outline">
                        <Mail className="w-4 h-4 mr-2" />
                        Email
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages */}
                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                  <div className="flex justify-start">
                    <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-gray-100 text-gray-900">
                      <p className="text-sm">
                        Bonjour, j'aimerais avoir des informations sur l'assurance {selectedConversation.type_assurance}
                      </p>
                      <p className="text-xs mt-1 text-gray-500">
                        {formatDate(selectedConversation.date_creation)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-blue-600 text-white">
                      <p className="text-sm">
                        Bonjour ! Je serais ravi de vous renseigner sur nos offres d'assurance {selectedConversation.type_assurance}. 
                        Pouvons-nous programmer un rendez-vous ?
                      </p>
                      <p className="text-xs mt-1 text-blue-100">
                        {formatDate(selectedConversation.date_modification)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Zone de saisie */}
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Input 
                      placeholder="Tapez votre message..." 
                      className="flex-1" 
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <Button onClick={handleSendMessage}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="flex-1 flex items-center justify-center">
              <CardContent>
                <p className="text-gray-500">Sélectionnez une conversation pour commencer</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ConseillerLayout>
  );
};

export default ConseilleurMessages;
