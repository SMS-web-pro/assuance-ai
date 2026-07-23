
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import ChatInterface from "@/components/ChatInterface";
import AboutContent from "@/components/AboutContent";
import HelpContent from "@/components/HelpContent";
import FixedHeader from "@/components/FixedHeader";
import Footer from "@/components/Footer";
import MobileHeader from "@/components/mobile/MobileHeader";
import MobileHomePage from "@/components/mobile/MobileHomePage";
import MobileChatPage from "@/components/mobile/MobileChatPage";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Shield, Clock, CheckCircle, Users, Award, ArrowLeft } from "lucide-react";

const Prospect = () => {
  const [selectedInsurance, setSelectedInsurance] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'about' | 'help'>('home');
  const [chatKey, setChatKey] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Mapping des paramètres URL vers les noms d'assurance
  const typeMapping = {
    'auto': 'Assurance Auto',
    'habitation': 'Assurance Habitation', 
    'sante': 'Assurance Santé',
    'moto': 'Assurance Moto',
    'emprunteur': 'Assurance Emprunteur',
    'voyage': 'Assurance Voyage'
  };

  useEffect(() => {
    const type = searchParams.get('type');
    const page = searchParams.get('page');
    
    if (page === 'about') {
      setCurrentView('about');
      setShowChat(false);
      setSelectedInsurance(null);
      return;
    }
    
    if (page === 'help') {
      setCurrentView('help');
      setShowChat(false);
      setSelectedInsurance(null);
      return;
    }
    
    if (type && typeMapping[type as keyof typeof typeMapping]) {
      const insuranceType = typeMapping[type as keyof typeof typeMapping];
      
      if (selectedInsurance && selectedInsurance !== insuranceType) {
        setChatKey(prev => prev + 1);
        console.log(`🔄 Réinitialisation du chat: ${selectedInsurance} -> ${insuranceType}`);
      }
      
      setSelectedInsurance(insuranceType);
      setShowChat(true);
      setCurrentView('home');
    } else {
      setSelectedInsurance(null);
      setShowChat(false);
      setCurrentView('home');
    }
  }, [searchParams, selectedInsurance]);

  const handleBack = () => {
    setShowChat(false);
    setSelectedInsurance(null);
    setCurrentView('home');
    setChatKey(prev => prev + 1);
  };

  const handleHomeNavigation = () => {
    // Rediriger vers la page d'accueil sans paramètres
    navigate('/prospect');
  };

  // Version mobile
  if (isMobile) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-white">
          <AppSidebar />
          
          <SidebarInset className="flex flex-col w-full">
            <MobileHeader 
              showBackButton={showChat || currentView !== 'home'}
              onBack={showChat ? handleHomeNavigation : handleBack}
              title={showChat ? "Chat IA" : currentView === 'about' ? "À propos" : currentView === 'help' ? "Aide" : "Menu"}
            />
            
            <div className="flex-1 overflow-y-auto">
              {currentView === 'about' ? (
                <div className="p-4">
                  <AboutContent />
                </div>
              ) : currentView === 'help' ? (
                <div className="p-4">
                  <HelpContent />
                </div>
              ) : !showChat ? (
                <MobileHomePage />
              ) : (
                <MobileChatPage insuranceType={selectedInsurance!} />
              )}
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  // Version desktop (code existant conservé)
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <AppSidebar />
        
        <SidebarInset className="flex flex-col">
          <FixedHeader />

          <div className="flex-1 p-2 sm:p-3 lg:p-6 overflow-x-hidden">
            {currentView === 'about' ? (
              <AboutContent />
            ) : currentView === 'help' ? (
              <HelpContent />
            ) : !showChat ? (
              <div className="max-w-6xl mx-auto px-2 sm:px-4">
                {/* Hero Section - Optimisé pour mobile */}
                <div className="text-center mb-6 sm:mb-8 lg:mb-16">
                  <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 lg:mb-6 px-2">
                    Votre Conseiller Assurance IA
                  </h1>
                  <p className="text-sm sm:text-base lg:text-xl text-gray-600 max-w-3xl mx-auto px-2 leading-relaxed">
                    Découvrez une nouvelle façon d'obtenir vos devis d'assurance grâce à l'intelligence artificielle. 
                    Rapide, personnalisé et disponible 24h/24.
                  </p>
                </div>

                {/* Features Grid - Layout mobile optimisé */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-8 mb-6 sm:mb-8 lg:mb-16">
                  <Card className="text-center hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3 sm:pb-4">
                      <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2 sm:mb-3 lg:mb-4">
                        <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-blue-600" />
                      </div>
                      <CardTitle className="text-base sm:text-lg lg:text-xl">Conversation Naturelle</CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 sm:px-4 lg:px-6">
                      <p className="text-gray-600 text-xs sm:text-sm lg:text-base leading-relaxed">
                        Discutez avec nos conseillers IA spécialisés comme avec un vrai expert. 
                        Ils comprennent vos besoins et s'adaptent à votre situation.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="text-center hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3 sm:pb-4">
                      <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-green-100 rounded-full flex items-center justify-center mb-2 sm:mb-3 lg:mb-4">
                        <Clock className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-green-600" />
                      </div>
                      <CardTitle className="text-base sm:text-lg lg:text-xl">Disponible 24h/24</CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 sm:px-4 lg:px-6">
                      <p className="text-gray-600 text-xs sm:text-sm lg:text-base leading-relaxed">
                        Obtenez votre devis à tout moment, même en dehors des heures de bureau. 
                        Nos conseillers IA sont toujours à votre service.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="text-center hover:shadow-lg transition-shadow sm:col-span-2 lg:col-span-1">
                    <CardHeader className="pb-3 sm:pb-4">
                      <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-purple-100 rounded-full flex items-center justify-center mb-2 sm:mb-3 lg:mb-4">
                        <Shield className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-purple-600" />
                      </div>
                      <CardTitle className="text-base sm:text-lg lg:text-xl">Sécurisé & Confidentiel</CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 sm:px-4 lg:px-6">
                      <p className="text-gray-600 text-xs sm:text-sm lg:text-base leading-relaxed">
                        Vos données sont protégées avec le plus haut niveau de sécurité. 
                        Toutes les informations restent strictement confidentielles.
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Services Section - Layout mobile amélioré */}
                <div className="bg-white rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-8 shadow-lg mb-6 sm:mb-8 lg:mb-16">
                  <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-center text-gray-900 mb-4 sm:mb-6 lg:mb-12 px-2">
                    Nos Services d'Assurance
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                    {[
                      { title: "Assurance Auto", desc: "Protégez votre véhicule avec une couverture adaptée à vos besoins", color: "bg-blue-50 border-blue-200" },
                      { title: "Assurance Habitation", desc: "Sécurisez votre logement et vos biens personnels", color: "bg-green-50 border-green-200" },
                      { title: "Assurance Santé", desc: "Complémentaire santé sur-mesure pour vous et votre famille", color: "bg-red-50 border-red-200" },
                      { title: "Assurance Moto", desc: "Protection complète pour votre deux-roues", color: "bg-orange-50 border-orange-200" },
                      { title: "Assurance Emprunteur", desc: "Sécurisez votre crédit immobilier", color: "bg-purple-50 border-purple-200" },
                      { title: "Assurance Voyage", desc: "Voyagez en toute sérénité", color: "bg-teal-50 border-teal-200" }
                    ].map((service, index) => (
                      <div key={index} className={`p-3 sm:p-4 lg:p-6 rounded-lg border-2 ${service.color}`}>
                        <h3 className="font-semibold text-sm sm:text-base lg:text-lg mb-1 sm:mb-2">{service.title}</h3>
                        <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">{service.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* How it Works - Layout mobile optimisé */}
                <div className="text-center mb-6 sm:mb-8 lg:mb-16">
                  <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 lg:mb-12 px-2">
                    Comment ça fonctionne ?
                  </h2>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-8">
                    {[
                      { step: "1", title: "Choisissez", desc: "Sélectionnez le type d'assurance dans le menu latéral" },
                      { step: "2", title: "Discutez", desc: "Échangez avec votre conseiller IA spécialisé" },
                      { step: "3", title: "Personnalisez", desc: "Adaptez votre couverture à vos besoins" },
                      { step: "4", title: "Obtenez", desc: "Recevez votre devis personnalisé instantanément" }
                    ].map((item, index) => (
                      <div key={index} className="flex flex-col items-center px-2">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mb-2 sm:mb-3 lg:mb-4 text-xs sm:text-sm lg:text-base">
                          {item.step}
                        </div>
                        <h3 className="font-semibold text-xs sm:text-sm lg:text-lg mb-1 sm:mb-2">{item.title}</h3>
                        <p className="text-gray-600 text-xs leading-relaxed text-center">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Testimonials Section - Masqué sur très petit mobile */}
                <div className="bg-white rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-8 shadow-lg mb-6 sm:mb-8 lg:mb-16 hidden sm:block">
                  <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-center text-gray-900 mb-4 sm:mb-6 lg:mb-12 px-2">
                    Ils nous font confiance
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                    {[
                      {
                        name: "Sophie Martin",
                        role: "Particulier - Assurance Auto",
                        quote: "J'ai été impressionnée par la rapidité et la précision du service. Mon devis d'assurance auto a été établi en 3 minutes avec des conseils parfaitement adaptés à ma situation.",
                        rating: 5
                      },
                      {
                        name: "Pierre Dubois",
                        role: "Propriétaire - Assurance Habitation", 
                        quote: "Le conseiller IA a su identifier mes besoins spécifiques et m'a proposé une couverture optimale pour ma résidence principale. Un service professionnel et accessible.",
                        rating: 5
                      },
                      {
                        name: "Marie Lefevre",
                        role: "Famille - Assurance Santé",
                        quote: "Excellente expérience ! La personnalisation de notre mutuelle famille s'est faite naturellement grâce aux questions pertinentes du conseiller IA. Je recommande vivement.",
                        rating: 5
                      }
                    ].slice(0, isMobile ? 2 : 6).map((testimonial, index) => (
                      <Card key={index} className="relative">
                        <CardContent className="p-3 sm:p-4 lg:p-6">
                          <div className="flex mb-3 sm:mb-4">
                            {[...Array(testimonial.rating)].map((_, i) => (
                              <div key={i} className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400">⭐</div>
                            ))}
                          </div>
                          <blockquote className="text-gray-600 italic mb-3 sm:mb-4 text-xs sm:text-sm lg:text-base leading-relaxed">
                            "{testimonial.quote}"
                          </blockquote>
                          <div className="border-t pt-3 sm:pt-4">
                            <div className="font-semibold text-gray-900 text-xs sm:text-sm lg:text-base">{testimonial.name}</div>
                            <div className="text-xs text-gray-500">{testimonial.role}</div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  <div className="text-center mt-4 sm:mt-6 lg:mt-8">
                    <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm">
                      <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="font-medium">98% de satisfaction client</span>
                    </div>
                  </div>
                </div>

                {/* CTA Section - Mobile optimisé */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg sm:rounded-xl lg:rounded-2xl p-4 sm:p-6 lg:p-8 text-center">
                  <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3 lg:mb-4 px-2">
                    Prêt à commencer ?
                  </h2>
                  <p className="text-sm sm:text-base lg:text-xl mb-3 sm:mb-4 lg:mb-6 opacity-90 px-2 leading-relaxed">
                    Utilisez le menu latéral pour accéder directement à votre conseiller spécialisé
                  </p>
                  <div className="flex flex-col sm:flex-row sm:flex-wrap justify-center gap-2 sm:gap-3 lg:gap-4">
                    <div className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm lg:text-base">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                      <span>Gratuit et sans engagement</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm lg:text-base">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                      <span>Devis en 5 minutes</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm lg:text-base">
                      <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                      <span>Conseils personnalisés</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto px-2 sm:px-4">
                {/* Bouton retour visible sur desktop aussi */}
                {/* Bouton de retour supprimé */}

                {/* Hero Section Dynamique - Mobile optimisé */}
                <div className="text-center mb-6 sm:mb-8 lg:mb-16">
                  <h1 className="text-lg sm:text-2xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 lg:mb-6 px-2">
                    {(() => {
                      const descriptions = {
                        'Assurance Auto': {
                          title: 'Votre Assurance Auto sur-mesure',
                          description: 'Protégez votre véhicule avec une couverture adaptée à vos besoins. Obtenez un devis personnalisé en quelques minutes avec notre conseiller IA spécialisé automobile.'
                        },
                        'Assurance Habitation': {
                          title: 'Votre Assurance Habitation idéale',
                          description: 'Sécurisez votre logement et vos biens personnels. Notre conseiller IA vous guide pour choisir la protection parfaite pour votre domicile.'
                        },
                        'Assurance Santé': {
                          title: 'Votre Complémentaire Santé optimale',
                          description: 'Trouvez la mutuelle santé qui vous convient. Notre conseiller IA analyse vos besoins pour vous proposer la meilleure couverture santé.'
                        },
                        'Assurance Moto': {
                          title: 'Votre Assurance Moto adaptée',
                          description: 'Protection complète pour votre deux-roues. Discutez avec notre conseiller IA spécialisé en assurance moto pour un devis sur-mesure.'
                        },
                        'Assurance Emprunteur': {
                          title: 'Votre Assurance Emprunteur sécurisée',
                          description: 'Protégez votre crédit immobilier avec la bonne assurance emprunteur. Notre IA vous aide à comparer et choisir la meilleure option.'
                        },
                        'Assurance Voyage': {
                          title: 'Votre Assurance Voyage complète',
                          description: 'Voyagez en toute sérénité avec une protection adaptée. Notre conseiller IA vous propose une couverture voyage personnalisée selon votre destination.'
                        }
                      };
                      return descriptions[selectedInsurance as keyof typeof descriptions]?.title || 'Votre Conseiller Assurance IA';
                    })()}
                  </h1>
                  <p className="text-sm sm:text-base lg:text-xl text-gray-600 max-w-3xl mx-auto px-2 leading-relaxed">
                    {(() => {
                      const descriptions = {
                        'Assurance Auto': {
                          title: 'Votre Assurance Auto sur-mesure',
                          description: 'Protégez votre véhicule avec une couverture adaptée à vos besoins. Obtenez un devis personnalisé en quelques minutes avec notre conseiller IA spécialisé automobile.'
                        },
                        'Assurance Habitation': {
                          title: 'Votre Assurance Habitation idéale',
                          description: 'Sécurisez votre logement et vos biens personnels. Notre conseiller IA vous guide pour choisir la protection parfaite pour votre domicile.'
                        },
                        'Assurance Santé': {
                          title: 'Votre Complémentaire Santé optimale',
                          description: 'Trouvez la mutuelle santé qui vous convient. Notre conseiller IA analyse vos besoins pour vous proposer la meilleure couverture santé.'
                        },
                        'Assurance Moto': {
                          title: 'Votre Assurance Moto adaptée',
                          description: 'Protection complète pour votre deux-roues. Discutez avec notre conseiller IA spécialisé en assurance moto pour un devis sur-mesure.'
                        },
                        'Assurance Emprunteur': {
                          title: 'Votre Assurance Emprunteur sécurisée',
                          description: 'Protégez votre crédit immobilier avec la bonne assurance emprunteur. Notre IA vous aide à comparer et choisir la meilleure option.'
                        },
                        'Assurance Voyage': {
                          title: 'Votre Assurance Voyage complète',
                          description: 'Voyagez en toute sérénité avec une protection adaptée. Notre conseiller IA vous propose une couverture voyage personnalisée selon votre destination.'
                        }
                      };
                      return descriptions[selectedInsurance as keyof typeof descriptions]?.description || 'Découvrez une nouvelle façon d\'obtenir vos devis d\'assurance grâce à l\'intelligence artificielle. Rapide, personnalisé et disponible 24h/24.';
                    })()}
                  </p>
                </div>

                <Card className="shadow-xl">
                  <CardContent className="p-0">
                    <ChatInterface key={chatKey} insuranceType={selectedInsurance!} />
                  </CardContent>
                </Card>

                {/* Testimonials Section Spécifique - Mobile optimisé */}
                <div className="bg-white rounded-lg sm:rounded-xl lg:rounded-2xl p-3 sm:p-4 lg:p-8 shadow-lg mt-4 sm:mt-6 lg:mt-8 hidden sm:block">
                  <h2 className="text-lg sm:text-2xl font-bold text-center text-gray-900 mb-4 sm:mb-6 lg:mb-8 px-2">
                    {(() => {
                      const testimonialsByType = {
                        'Assurance Auto': 'Témoignages - Assurance Auto',
                        'Assurance Habitation': 'Témoignages - Assurance Habitation',
                        'Assurance Santé': 'Témoignages - Assurance Santé',
                        'Assurance Moto': 'Témoignages - Assurance Moto',
                        'Assurance Emprunteur': 'Témoignages - Assurance Emprunteur',
                        'Assurance Voyage': 'Témoignages - Assurance Voyage'
                      };
                      return testimonialsByType[selectedInsurance as keyof typeof testimonialsByType] || 'Témoignages de nos clients';
                    })()}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                    {(() => {
                      const testimonialsByType = {
                        'Assurance Auto': [
                          {
                            name: "Thomas Dupont",
                            role: "Conducteur expérimenté",
                            quote: "Excellent service ! J'ai économisé 40% sur mon assurance auto tout en ayant une meilleure couverture. Le conseiller IA a parfaitement compris mes besoins.",
                            rating: 5
                          },
                          {
                            name: "Emma Rodriguez", 
                            role: "Jeune conductrice",
                            quote: "En tant que jeune conductrice, j'avais du mal à trouver une assurance abordable. Grâce à ce service, j'ai trouvé la solution parfaite en 5 minutes !",
                            rating: 5
                          }
                        ],
                        'Assurance Habitation': [
                          {
                            name: "Claire Moreau",
                            role: "Propriétaire",
                            quote: "La personnalisation de mon assurance habitation a été parfaite. Le conseiller a pris en compte tous les détails de ma maison et mes objets de valeur.",
                            rating: 5
                          },
                          {
                            name: "Jean-Paul Martin",
                            role: "Locataire",
                            quote: "Service rapide et efficace ! Mon assurance locataire a été configurée en quelques minutes avec exactement ce dont j'avais besoin.",
                            rating: 5
                          }
                        ],
                        'Assurance Santé': [
                          {
                            name: "Sylvie Petit",
                            role: "Famille de 4 personnes",
                            quote: "Nous avons trouvé une mutuelle famille parfaitement adaptée à nos besoins et notre budget. Les remboursements sont excellents !",
                            rating: 5
                          },
                          {
                            name: "Marc Leroy",
                            role: "Senior",
                            quote: "À mon âge, trouver une bonne complémentaire santé n'était pas facile. Ce service m'a proposé exactement ce qu'il me fallait.",
                            rating: 5
                          }
                        ],
                        'Assurance Moto': [
                          {
                            name: "Kevin Rousseau",
                            role: "Motard passionné",
                            quote: "Enfin une assurance moto qui comprend les vrais besoins des motards ! Couverture équipement incluse et tarifs compétitifs.",
                            rating: 5
                          },
                          {
                            name: "Sarah Blanc",
                            role: "Débutante moto",
                            quote: "Service parfait pour ma première assurance moto. Conseils clairs et tarif adapté aux débutants. Je recommande !",
                            rating: 5
                          }
                        ],
                        'Assurance Emprunteur': [
                          {
                            name: "Antoine Durand",
                            role: "Primo-accédant",
                            quote: "Grâce à ce service, j'ai économisé plus de 15 000€ sur mon assurance emprunteur ! Le processus a été simple et rapide.",
                            rating: 5
                          },
                          {
                            name: "Isabelle Roux",
                            role: "Propriétaire",
                            quote: "Changement d'assurance emprunteur effectué sans stress. Économies substantielles et meilleure couverture garantie.",
                            rating: 5
                          }
                        ],
                        'Assurance Voyage': [
                          {
                            name: "Julien Costa",
                            role: "Voyageur fréquent",
                            quote: "Assurance voyage complète pour mes déplacements professionnels. Couverture mondiale et assistance 24h/24 impeccable !",
                            rating: 5
                          },
                          {
                            name: "Amélie Simon",
                            role: "Famille en vacances",
                            quote: "Protection parfaite pour nos vacances en famille. Nous sommes partis sereins grâce à cette excellente couverture voyage.",
                            rating: 5
                          }
                        ]
                      };
                      const testimonials = testimonialsByType[selectedInsurance as keyof typeof testimonialsByType] || [];
                      return testimonials.map((testimonial, index) => (
                        <Card key={index} className="relative">
                          <CardContent className="p-3 sm:p-4 lg:p-6">
                            <div className="flex mb-3 sm:mb-4">
                              {[...Array(testimonial.rating)].map((_, i) => (
                                <div key={i} className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400">⭐</div>
                              ))}
                            </div>
                            <blockquote className="text-gray-600 italic mb-3 sm:mb-4 text-xs sm:text-sm leading-relaxed">
                              "{testimonial.quote}"
                            </blockquote>
                            <div className="border-t pt-3 sm:pt-4">
                              <div className="font-semibold text-gray-900 text-xs sm:text-sm">{testimonial.name}</div>
                              <div className="text-xs text-gray-500">{testimonial.role}</div>
                            </div>
                          </CardContent>
                        </Card>
                      ));
                    })()}
                  </div>
                  <div className="text-center mt-4 sm:mt-6 lg:mt-8">
                    <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm">
                      <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="font-medium">98% de satisfaction client</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <Footer />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Prospect;
