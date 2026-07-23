import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import ChatInterface from "@/components/ChatInterface";
import FixedHeader from "@/components/FixedHeader";
import Footer from "@/components/Footer";
import InsuranceCarousel from "@/components/InsuranceCarousel";
import MobileHeader from "@/components/mobile/MobileHeader";
import MobileHomePage from "@/components/mobile/MobileHomePage";
import MobileChatPage from "@/components/mobile/MobileChatPage";
import { MessageCircle, Shield, Clock, CheckCircle, Users, Award, ArrowLeft } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const Index = () => {
  const [selectedInsurance, setSelectedInsurance] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [searchParams] = useSearchParams();
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
    if (type && typeMapping[type as keyof typeof typeMapping]) {
      const insuranceType = typeMapping[type as keyof typeof typeMapping];
      setSelectedInsurance(insuranceType);
      setShowChat(true);
    } else {
      setSelectedInsurance(null);
      setShowChat(false);
    }
  }, [searchParams]);

  const handleBack = () => {
    setShowChat(false);
    setSelectedInsurance(null);
  };

  // Version mobile
  if (isMobile) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-white">
          <AppSidebar />
          
          <SidebarInset className="flex flex-col w-full">
            <MobileHeader 
              showBackButton={showChat}
              onBack={handleBack}
              title={showChat ? "Chat IA" : "Menu"}
            />
            
            <div className="flex-1 overflow-y-auto">
              {!showChat ? (
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

  // Version desktop (code existant)
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <AppSidebar />
        
        <SidebarInset className="flex flex-col">
          <FixedHeader />

          <div className="flex-1 p-2 sm:p-3 lg:p-6">
            {!showChat ? (
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

                {/* Insurance Carousel - Masqué sur mobile très petit */}
                <div className="mb-6 sm:mb-8 lg:mb-16 hidden xs:block">
                  <InsuranceCarousel />
                </div>

                {/* Features Grid - Layout mobile optimisé */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-8 mb-6 sm:mb-8 lg:mb-16">
                  <Card className="text-center hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3 sm:pb-4">
                      <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-blue-100 rounded-full flex items-center justify-center mb-2 sm:mb-3 lg:mb-4">
                        <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-blue-600" />
                      </div>
                      <CardTitle className="text-base sm:text-lg lg:text-xl">Chat Intelligent</CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 sm:px-4 lg:px-6">
                      <p className="text-gray-600 text-xs sm:text-sm lg:text-base leading-relaxed">
                        Discutez avec nos conseillers IA spécialisés pour obtenir des conseils personnalisés 
                        et des devis adaptés à votre situation.
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
                <div className="mb-6 sm:mb-8 lg:mb-16 hidden sm:block">
                  <h2 className="text-lg sm:text-2xl lg:text-3xl font-bold text-center text-gray-900 mb-4 sm:mb-6 lg:mb-12 px-2">
                    Ce que disent nos clients
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                    {[
                      {
                        name: "Marie Dubois",
                        role: "Particulier",
                        content: "Service exceptionnel ! J'ai obtenu mon devis d'assurance auto en 3 minutes. Le conseiller IA comprend parfaitement mes besoins.",
                        rating: 5
                      },
                      {
                        name: "Pierre Martin",
                        role: "Propriétaire",
                        content: "Très impressé par la qualité des conseils pour mon assurance habitation. Plus rapide qu'un rendez-vous classique !",
                        rating: 5
                      },
                      {
                        name: "Sophie Bernard",
                        role: "Mère de famille",
                        content: "Parfait pour comparer les assurances santé. L'IA m'a aidée à trouver la meilleure couverture pour ma famille.",
                        rating: 5
                      }
                    ].slice(0, isMobile ? 2 : 6).map((testimonial, index) => (
                      <Card key={index} className="p-3 sm:p-4 lg:p-6">
                        <CardContent className="space-y-2 sm:space-y-3 lg:space-y-4">
                          <div className="flex text-yellow-400 text-xs sm:text-sm lg:text-base">
                            {[...Array(testimonial.rating)].map((_, i) => (
                              <span key={i}>⭐</span>
                            ))}
                          </div>
                          <p className="text-gray-600 italic text-xs sm:text-sm lg:text-base leading-relaxed">"{testimonial.content}"</p>
                          <div>
                            <p className="font-semibold text-gray-900 text-xs sm:text-sm lg:text-base">{testimonial.name}</p>
                            <p className="text-xs text-gray-500">{testimonial.role}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
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
                
                <Card className="shadow-xl">
                  <CardContent className="p-0">
                    <ChatInterface insuranceType={selectedInsurance!} />
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
          <Footer />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Index;
