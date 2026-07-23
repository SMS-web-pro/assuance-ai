
import { FileText, AlertCircle, Scale, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import FixedHeader from "@/components/FixedHeader";
import Footer from "@/components/Footer";

const Terms = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar />
        <main className="flex-1">
          <FixedHeader />
          <div className="p-6 pt-20">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <div className="text-center mb-16">
                  <h1 className="text-4xl font-bold text-gray-900 mb-6">
                    Conditions d'Utilisation
                  </h1>
                  <p className="text-xl text-gray-600">
                    Les règles d'utilisation de notre plateforme AssuranceIA.
                  </p>
                  <p className="text-sm text-gray-500 mt-4">
                    Dernière mise à jour : 1er janvier 2024
                  </p>
                </div>

                <div className="space-y-8 text-gray-700">
                  {/* Acceptation */}
                  <Card className="mb-8">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-6 h-6 text-blue-600" />
                        Acceptation des conditions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 leading-relaxed">
                        En accédant et en utilisant la plateforme AssuranceIA, vous acceptez d'être lié 
                        par ces conditions d'utilisation. Si vous n'acceptez pas ces conditions, 
                        veuillez ne pas utiliser notre service.
                      </p>
                    </CardContent>
                  </Card>

                  {/* Description du service */}
                  <Card className="mb-8">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-6 h-6 text-green-600" />
                        Description du service
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-600">
                        AssuranceIA est une plateforme de conseil en assurance utilisant l'intelligence 
                        artificielle pour vous aider à :
                      </p>
                      <ul className="list-disc pl-6 space-y-1 text-gray-600">
                        <li>Évaluer vos besoins en assurance</li>
                        <li>Comparer différentes options d'assurance</li>
                        <li>Obtenir des devis personnalisés</li>
                        <li>Recevoir des conseils adaptés à votre situation</li>
                      </ul>
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <p className="text-yellow-800 text-sm">
                          <strong>Important :</strong> AssuranceIA est un service de conseil et de comparaison. 
                          Nous ne sommes pas un assureur et ne vendons pas directement d'assurances.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Utilisation acceptable */}
                  <Card className="mb-8">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Scale className="w-6 h-6 text-purple-600" />
                        Utilisation acceptable
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">Vous vous engagez à :</p>
                      <ul className="list-disc pl-6 space-y-1 text-gray-600 mb-4">
                        <li>Fournir des informations exactes et complètes</li>
                        <li>Maintenir la confidentialité de vos identifiants de connexion</li>
                        <li>Utiliser le service uniquement à des fins légales</li>
                        <li>Respecter les droits de propriété intellectuelle</li>
                        <li>Ne pas tenter de contourner les mesures de sécurité</li>
                      </ul>
                      
                      <p className="text-gray-600 mb-4">Il est interdit :</p>
                      <ul className="list-disc pl-6 space-y-1 text-gray-600">
                        <li>D'utiliser le service à des fins frauduleuses</li>
                        <li>De transmettre des virus ou codes malveillants</li>
                        <li>D'interférer avec le fonctionnement du service</li>
                        <li>De collecter des données d'autres utilisateurs</li>
                        <li>D'utiliser des robots ou scripts automatisés</li>
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Propriété intellectuelle */}
                  <Card className="mb-8">
                    <CardHeader>
                      <CardTitle>Propriété intellectuelle</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">
                        Tous les contenus de la plateforme (textes, images, logos, algorithmes d'IA, 
                        interface utilisateur) sont protégés par les droits de propriété intellectuelle 
                        et appartiennent à AssuranceIA ou à ses partenaires.
                      </p>
                      <p className="text-gray-600">
                        Vous pouvez utiliser ces contenus uniquement dans le cadre de l'utilisation 
                        normale du service. Toute reproduction, distribution ou modification non 
                        autorisée est interdite.
                      </p>
                    </CardContent>
                  </Card>

                  {/* Limitation de responsabilité */}
                  <Card className="mb-8">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="w-6 h-6 text-red-600" />
                        Limitation de responsabilité
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-600">
                        AssuranceIA fournit un service de conseil et de comparaison. Nous nous efforçons 
                        de fournir des informations exactes, mais :
                      </p>
                      <ul className="list-disc pl-6 space-y-1 text-gray-600">
                        <li>Les conseils fournis par l'IA sont basés sur les informations que vous nous donnez</li>
                        <li>Nous ne garantissons pas l'exactitude de tous les tarifs et conditions</li>
                        <li>La décision finale d'assurance vous appartient</li>
                        <li>Nous ne sommes pas responsables des décisions prises sur la base de nos conseils</li>
                      </ul>
                      
                      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <p className="text-red-800 text-sm">
                          <strong>Clause importante :</strong> Notre responsabilité est limitée au montant 
                          des frais que vous avez payés pour utiliser notre service au cours des 12 derniers mois.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Données personnelles */}
                  <Card className="mb-8">
                    <CardHeader>
                      <CardTitle>Protection des données</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">
                        Le traitement de vos données personnelles est régi par notre 
                        <a href="/privacy" className="text-blue-600 hover:underline ml-1">
                          Politique de Confidentialité
                        </a>, 
                        qui fait partie intégrante de ces conditions d'utilisation.
                      </p>
                      <p className="text-gray-600">
                        En utilisant notre service, vous consentez au traitement de vos données 
                        conformément à cette politique.
                      </p>
                    </CardContent>
                  </Card>

                  {/* Modification et résiliation */}
                  <Card className="mb-8">
                    <CardHeader>
                      <CardTitle>Modification et résiliation</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Modification des conditions</h3>
                        <p className="text-gray-600">
                          Nous nous réservons le droit de modifier ces conditions à tout moment. 
                          Les modifications prendront effet dès leur publication sur la plateforme. 
                          Il vous appartient de consulter régulièrement cette page.
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Résiliation</h3>
                        <p className="text-gray-600">
                          Vous pouvez cesser d'utiliser le service à tout moment. Nous pouvons 
                          suspendre ou résilier votre accès en cas de violation de ces conditions.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Droit applicable */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Droit applicable et juridiction</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">
                        Ces conditions d'utilisation sont régies par le droit français. 
                        En cas de litige, les tribunaux français seront seuls compétents.
                      </p>
                      <p className="text-gray-600">
                        Pour toute question concernant ces conditions, contactez-nous à : 
                        <a href="mailto:legal@assuranceia.fr" className="text-blue-600 hover:underline ml-1">
                          legal@assuranceia.fr
                        </a>
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
          <Footer />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Terms;
