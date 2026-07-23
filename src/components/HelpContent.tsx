
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MessageCircle, FileText, Shield, Clock, HelpCircle, Book, Video, Download } from "lucide-react";

const HelpContent = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Centre d'Aide AssuranceIA
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Trouvez rapidement les réponses à vos questions sur notre plateforme d'assurance intelligente.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mx-0">
        {/* FAQ Section - Pleine largeur */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5" />
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

                <AccordionItem value="item-7">
                  <AccordionTrigger>Comment naviguer dans l'interface ?</AccordionTrigger>
                  <AccordionContent>
                    Utilisez le menu latéral pour accéder aux différents types d'assurance. Chaque section vous connecte avec un conseiller IA spécialisé. Vous pouvez revenir à l'accueil à tout moment en cliquant sur "Accueil" dans le menu.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-8">
                  <AccordionTrigger>Que faire si l'IA ne comprend pas ma question ?</AccordionTrigger>
                  <AccordionContent>
                    Si notre IA a des difficultés à comprendre votre demande, essayez de reformuler votre question de manière plus simple. Vous pouvez aussi demander à être mis en relation avec un conseiller humain qui pourra vous aider personnellement.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* Contact & Resources Section */}
        
      </div>

      {/* Section des fonctionnalités de support supprimée car déplacée */}
    </div>
  );
};

export default HelpContent;
