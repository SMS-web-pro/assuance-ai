
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MessageCircle, ArrowUp, Car, Home, Heart, Bike, CreditCard, Plane, Bot, User, Sparkles, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  showButtons?: boolean;
}

interface SelectionChatInterfaceProps {
  onInsuranceSelected: (type: string) => void;
}

const SelectionChatInterface = ({ onInsuranceSelected }: SelectionChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Message d'accueil du conseiller IA
    const welcomeMessage: Message = {
      id: '1',
      content: `Bonjour et bienvenue ! 👋

Je suis votre conseiller IA spécialisé en assurance. Je suis là pour vous accompagner dans le choix de la meilleure couverture selon vos besoins spécifiques.

Choisissez le type d'assurance qui vous intéresse :`,
      sender: 'ai',
      timestamp: new Date(),
      showButtons: true
    };
    setMessages([welcomeMessage]);
  }, []);

  const insuranceTypes = [
    { 
      key: "Assurance Auto", 
      label: "Assurance Auto", 
      icon: Car,
      gradient: "from-blue-500 to-blue-700",
      bgPattern: "bg-gradient-to-br from-blue-50 to-blue-100"
    },
    { 
      key: "Assurance Habitation", 
      label: "Assurance Habitation", 
      icon: Home,
      gradient: "from-green-500 to-green-700",
      bgPattern: "bg-gradient-to-br from-green-50 to-green-100"
    },
    { 
      key: "Assurance Santé", 
      label: "Assurance Santé", 
      icon: Heart,
      gradient: "from-red-500 to-red-700",
      bgPattern: "bg-gradient-to-br from-red-50 to-red-100"
    },
    { 
      key: "Assurance Moto", 
      label: "Assurance Moto", 
      icon: Bike,
      gradient: "from-orange-500 to-orange-700",
      bgPattern: "bg-gradient-to-br from-orange-50 to-orange-100"
    },
    { 
      key: "Assurance Emprunteur", 
      label: "Assurance Emprunteur", 
      icon: CreditCard,
      gradient: "from-purple-500 to-purple-700",
      bgPattern: "bg-gradient-to-br from-purple-50 to-purple-100"
    },
    { 
      key: "Assurance Voyage", 
      label: "Assurance Voyage", 
      icon: Plane,
      gradient: "from-indigo-500 to-indigo-700",
      bgPattern: "bg-gradient-to-br from-indigo-50 to-indigo-100"
    }
  ];

  const handleInsuranceButtonClick = (insuranceType: string) => {
    // Ajouter le message utilisateur
    const userMessage: Message = {
      id: Date.now().toString(),
      content: `Je souhaite une ${insuranceType}`,
      sender: 'user',
      timestamp: new Date()
    };

    // Ajouter le message de redirection IA
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: `Parfait ! Je vous dirige maintenant vers notre expert en ${insuranceType} pour votre devis personnalisé. 😊`,
      sender: 'ai',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage, aiMessage]);

    // Rediriger vers l'expert après 2 secondes
    setTimeout(() => {
      onInsuranceSelected(insuranceType);
    }, 2000);
  };

  const getSystemPrompt = () => {
    return `Tu es un conseiller en assurance IA professionnel et bienveillant. Ta mission est d'identifier rapidement le type d'assurance dont le client a besoin parmi :
- Assurance Auto
- Assurance Habitation 
- Assurance Santé
- Assurance Moto
- Assurance Emprunteur
- Assurance Voyage

🎯 Ton objectif : Identifier le besoin du client et le diriger IMMÉDIATEMENT vers le bon expert.

✅ Comportement à adopter :
- Dès que tu identifies un besoin d'assurance, redirige DIRECTEMENT vers l'expert
- Sois professionnel mais chaleureux
- Pas de questions supplémentaires une fois le type identifié
- Utilise cette phrase exacte pour rediriger : "Parfait ! Je vous dirige maintenant vers notre expert en [TYPE D'ASSURANCE] pour votre devis personnalisé. 😊"

🚫 Ne pas :
- Poser des questions de détail (âge du véhicule, type exact, etc.)
- Demander des précisions une fois le type d'assurance identifié
- Donner de tarifs ou devis

Réponds toujours en français de manière naturelle et professionnelle.`;
  };

  const detectInsuranceChoice = (aiResponse: string) => {
    const choices = [
      { key: "Assurance Auto", triggers: ["auto", "voiture", "véhicule", "automobile"] },
      { key: "Assurance Habitation", triggers: ["habitation", "logement", "maison", "appartement"] },
      { key: "Assurance Santé", triggers: ["santé", "mutuelle", "complémentaire santé"] },
      { key: "Assurance Moto", triggers: ["moto", "deux-roues", "scooter"] },
      { key: "Assurance Emprunteur", triggers: ["emprunteur", "prêt", "crédit", "emprunt"] },
      { key: "Assurance Voyage", triggers: ["voyage", "vacances", "déplacement"] }
    ];

    if (aiResponse.includes("Je vous dirige maintenant vers notre expert")) {
      for (const choice of choices) {
        if (choice.triggers.some(trigger => 
          aiResponse.toLowerCase().includes(trigger.toLowerCase())
        )) {
          return choice.key;
        }
      }
    }
    return null;
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue("");
    setIsLoading(true);

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));

      conversationHistory.push({
        role: 'user',
        content: currentInput
      });

      const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer sk-76ca2f8d5b2f455fb6a69f62d459e620',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: getSystemPrompt()
            },
            ...conversationHistory
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const aiResponse = data.choices[0].message.content;
        
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: aiResponse,
          sender: 'ai',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);

        // Vérifier si l'IA a fait un choix d'assurance
        const selectedInsurance = detectInsuranceChoice(aiResponse);
        if (selectedInsurance) {
          setTimeout(() => {
            onInsuranceSelected(selectedInsurance);
          }, 2000);
        }
      } else {
        throw new Error('Réponse inattendue de l\'API');
      }

    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      toast({
        title: "Erreur",
        description: "Impossible de communiquer avec le conseiller IA. Veuillez réessayer.",
        variant: "destructive",
      });

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Je rencontre actuellement des difficultés techniques. Pouvez-vous reformuler votre message ?",
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="relative">
      {/* Background avec pattern sophistiqué */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_25%_25%,_theme(colors.blue.100)_0%,_transparent_50%)] bg-[length:400px_400px]"></div>
      </div>
      
      <Card className="shadow-2xl max-w-4xl mx-auto relative backdrop-blur-sm bg-white/95 border-0 overflow-hidden">
        {/* Header professionnel avec gradient et motifs */}
        <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 text-white p-6 overflow-hidden">
          {/* Motifs d'arrière-plan */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-4 right-4">
              <Shield className="w-12 h-12 opacity-30" />
            </div>
            <div className="absolute bottom-4 left-4">
              <Sparkles className="w-8 h-8 opacity-40" />
            </div>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-white/20 rounded-full backdrop-blur-sm">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Conseiller IA Expert</h2>
                <div className="flex items-center gap-2 text-blue-100 text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>En ligne • Prêt à vous aider</span>
                </div>
              </div>
            </div>
            <p className="text-blue-100 text-sm font-medium ml-12">Votre guide personnalisé vers la meilleure assurance</p>
          </div>
        </div>
        
        <div className="flex flex-col h-[500px] relative">
          {/* Messages avec scroll personnalisé */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-blue-200 scrollbar-track-transparent">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div className={`flex items-start gap-4 max-w-[85%] ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar amélioré */}
                  <div className={`flex-shrink-0 relative`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${
                      message.sender === 'user' 
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
                        : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white'
                    }`}>
                      {message.sender === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                    </div>
                    {/* Indicateur en ligne pour l'IA */}
                    {message.sender === 'ai' && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm">
                        <div className="w-full h-full bg-green-400 rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </div>

                  {/* Message bubble amélioré */}
                  <div className="relative max-w-full">
                    {/* Nom de l'expéditeur */}
                    <div className={`text-xs font-medium mb-2 ${
                      message.sender === 'user' ? 'text-right text-blue-600' : 'text-left text-indigo-600'
                    }`}>
                      {message.sender === 'user' ? 'Vous' : 'Conseiller IA'}
                    </div>
                    
                    <Card className={`relative overflow-hidden ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0 shadow-xl'
                        : 'bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300'
                    }`}>
                      {/* Arrière-plan décoratif pour les messages IA */}
                      {message.sender === 'ai' && (
                        <div className="absolute inset-0 opacity-5">
                          <div className="absolute top-2 right-2">
                            <Shield className="w-8 h-8" />
                          </div>
                          <div className="absolute bottom-2 left-2">
                            <Sparkles className="w-6 h-6" />
                          </div>
                        </div>
                      )}
                      
                      {/* Arrière-plan décoratif pour les messages utilisateur */}
                      {message.sender === 'user' && (
                        <div className="absolute inset-0 opacity-20">
                          <div className="absolute top-2 right-2">
                            <MessageCircle className="w-6 h-6" />
                          </div>
                        </div>
                      )}
                      
                      <div className="relative z-10 p-4">
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
                        
                        {/* Boutons d'assurance avec design amélioré */}
                        {message.showButtons && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                            {insuranceTypes.map((insurance) => {
                              const IconComponent = insurance.icon;
                              return (
                                <Button
                                  key={insurance.key}
                                  onClick={() => handleInsuranceButtonClick(insurance.key)}
                                  variant="outline"
                                  className={`group relative overflow-hidden border-2 border-gray-200 hover:border-transparent transition-all duration-300 p-4 h-auto ${insurance.bgPattern} hover:shadow-xl hover:scale-105`}
                                >
                                  {/* Gradient overlay au hover */}
                                  <div className={`absolute inset-0 bg-gradient-to-r ${insurance.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                                  
                                  <div className="relative z-10 flex items-center gap-3 text-left w-full">
                                    <div className={`p-3 rounded-lg bg-gradient-to-r ${insurance.gradient} text-white group-hover:bg-white/20 transition-colors duration-300 shadow-md`}>
                                      <IconComponent className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                      <span className="font-semibold text-gray-700 group-hover:text-white transition-colors duration-300 block">
                                        {insurance.label}
                                      </span>
                                      <div className="text-xs text-gray-500 group-hover:text-white/80 transition-colors duration-300 mt-1">
                                        Devis personnalisé instantané
                                      </div>
                                    </div>
                                    <ArrowUp className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors duration-300 rotate-45" />
                                  </div>
                                </Button>
                              );
                            })}
                          </div>
                        )}

                        <div className={`text-xs mt-3 flex items-center gap-2 ${
                          message.sender === 'user' ? 'text-blue-100 justify-end' : 'text-gray-400 justify-start'
                        }`}>
                          <MessageCircle className="w-3 h-3" />
                          <span>
                            {message.timestamp.toLocaleTimeString('fr-FR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Indicateur de frappe amélioré */}
            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center shadow-lg relative">
                    <Bot className="w-5 h-5" />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm">
                      <div className="w-full h-full bg-green-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <div className="relative max-w-full">
                    <div className="text-xs font-medium mb-2 text-left text-indigo-600">
                      Conseiller IA
                    </div>
                    <Card className="bg-white border border-gray-200 shadow-lg relative overflow-hidden">
                      <div className="absolute inset-0 opacity-5">
                        <div className="absolute top-2 right-2">
                          <Shield className="w-8 h-8" />
                        </div>
                      </div>
                      <div className="relative z-10 p-4">
                        <div className="flex items-center gap-3">
                          <MessageCircle className="w-5 h-5 text-indigo-500" />
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-sm text-gray-500 ml-2">Analyse en cours...</span>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input section améliorée */}
          <div className="border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50 relative">
            {/* Motif décoratif */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-2 right-4">
                <Sparkles className="w-4 h-4 text-blue-300" />
              </div>
            </div>
            
            <div className="relative z-10 p-4">
              <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Décrivez-moi vos besoins en assurance ou posez votre question..."
                    disabled={isLoading}
                    className="pr-12 py-3 text-sm bg-white border-2 border-gray-200 focus:border-blue-400 focus:ring-blue-400 rounded-xl shadow-sm"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                </div>
                <Button
                  onClick={sendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/20 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                  <ArrowUp className="w-4 h-4 relative z-10" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SelectionChatInterface;
