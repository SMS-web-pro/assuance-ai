
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import FixedHeader from "@/components/FixedHeader";
import Footer from "@/components/Footer";
import { Phone, Mail, MessageCircle, FileText, Shield, Clock } from "lucide-react";

const Help = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/50">
      <FixedHeader />
      
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Centre d'Aide AssuranceIA
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Trouvez rapidement les réponses à vos questions sur notre plateforme d'assurance intelligente.
          </p>
        </div>

        {/* FAQ Section - Pleine largeur */}
        <div className="mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Questions Fréquentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem value="item-1">
                  <AccordionTrigger>Comment fonctionne AssuranceIA ?</AccordionTrigger>
                  <AccordionContent>
                    AssuranceIA utilise l'intelligence artificielle pour analyser vos besoins d'assurance et vous proposer les meilleures offres du marché. Notre IA conversationnelle vous guide étape par étape pour obtenir un devis personnalisé en quelques minutes.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-2">
                  <AccordionTrigger>Mes données sont-elles sécurisées ?</AccordionTrigger>
                  <AccordionContent>
                    Absolument. Nous utilisons un chiffrement de niveau bancaire pour protéger toutes vos données personnelles. Vos informations ne sont jamais vendues à des tiers et sont uniquement utilisées pour vous fournir les meilleurs conseils en assurance.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-3">
                  <AccordionTrigger>Combien de temps faut-il pour obtenir un devis ?</AccordionTrigger>
                  <AccordionContent>
                    La plupart de nos devis sont générés en moins de 5 minutes. Le temps peut varier selon la complexité de votre profil et le type d'assurance demandé. Notre IA optimise le processus pour vous faire gagner un maximum de temps.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-4">
                  <AccordionTrigger>Puis-je modifier mon devis après l'avoir reçu ?</AccordionTrigger>
                  <AccordionContent>
                    Oui, vous pouvez modifier vos informations et recalculer votre devis à tout moment. Notre plateforme vous permet d'ajuster vos garanties et de comparer différentes options en temps réel.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-5">
                  <AccordionTrigger>L'utilisation d'AssuranceIA est-elle gratuite ?</AccordionTrigger>
                  <AccordionContent>
                    Oui, notre service de devis et de conseil est entièrement gratuit. Nous sommes rémunérés par nos partenaires assureurs uniquement si vous souscrivez une police d'assurance, sans aucun surcoût pour vous.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-6">
                  <AccordionTrigger>Comment puis-je contacter un conseiller humain ?</AccordionTrigger>
                  <AccordionContent>
                    Nos conseillers experts sont disponibles du lundi au vendredi de 9h à 18h. Vous pouvez nous contacter par téléphone, email ou chat en direct. Un conseiller peut reprendre votre dossier à tout moment pour vous accompagner personnellement.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* Sections Contact et Ressources côte à côte */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Contact Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contactez-nous
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium">Téléphone</p>
                  <p className="text-sm text-muted-foreground">01 23 45 67 89</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">contact@assuranceia.fr</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium">Horaires</p>
                  <p className="text-sm text-muted-foreground">Lun-Ven: 9h-18h</p>
                </div>
              </div>
              
              <Button className="w-full">
                <MessageCircle className="mr-2 h-4 w-4" />
                Chat en Direct
              </Button>
            </CardContent>
          </Card>

          {/* Ressources Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Ressources Utiles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Shield className="mr-2 h-4 w-4" />
                Guide des Assurances
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <FileText className="mr-2 h-4 w-4" />
                Conditions Générales
              </Button>
              
              <Button variant="outline" className="w-full justify-start">
                <Shield className="mr-2 h-4 w-4" />
                Politique de Confidentialité
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Support Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center">
            <CardContent className="pt-6">
              <MessageCircle className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Chat IA Intelligent</h3>
              <p className="text-sm text-muted-foreground">
                Notre IA répond instantanément à vos questions 24h/24
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <Phone className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Support Téléphonique</h3>
              <p className="text-sm text-muted-foreground">
                Parlez directement avec nos experts en assurance
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Documentation</h3>
              <p className="text-sm text-muted-foreground">
                Accédez à notre base de connaissances complète
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default Help;
