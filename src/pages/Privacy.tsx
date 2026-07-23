import { Shield, Eye, Lock, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import FixedHeader from "@/components/FixedHeader";
import Footer from "@/components/Footer";
const Privacy = () => {
  return <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar />
        <main className="flex-1">
          <FixedHeader />
          <div className="p-6 pt-20">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <div className="text-center mb-16">
                  <h1 className="text-4xl font-bold text-gray-900 mb-6">
                    Politique de Confidentialité
                  </h1>
                  <p className="text-xl text-gray-600">
                    Votre vie privée est notre priorité. Découvrez comment nous protégeons vos données.
                  </p>
                  <p className="text-sm text-gray-500 mt-4">
                    Dernière mise à jour : 1er janvier 2024
                  </p>
                </div>

                <div className="space-y-8">
                  {/* Introduction */}
                  <Card className="mb-8">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="w-6 h-6 text-blue-600" />
                        Introduction
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="prose max-w-none">
                      <p className="text-gray-600 leading-relaxed">
                        AssuranceIA s'engage à protéger la confidentialité de vos informations personnelles. 
                        Cette politique de confidentialité explique comment nous collectons, utilisons, 
                        stockons et protégeons vos données lorsque vous utilisez notre plateforme.
                      </p>
                    </CardContent>
                  </Card>

                  {/* Collecte des données */}
                  <Card className="mb-8">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Database className="w-6 h-6 text-green-600" />
                        Données collectées
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Informations personnelles</h3>
                        <ul className="list-disc pl-6 space-y-1 text-gray-600">
                          <li>Nom, prénom, date de naissance</li>
                          <li>Adresse email et numéro de téléphone</li>
                          <li>Adresse postale</li>
                          <li>Informations relatives à vos besoins d'assurance</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Données techniques</h3>
                        <ul className="list-disc pl-6 space-y-1 text-gray-600">
                          <li>Adresse IP et données de connexion</li>
                          <li>Type de navigateur et système d'exploitation</li>
                          <li>Pages visitées et durée de navigation</li>
                          <li>Cookies et technologies similaires</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Utilisation des données */}
                  <Card className="mb-8">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="w-6 h-6 text-purple-600" />
                        Utilisation des données
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">Nous utilisons vos données pour :</p>
                      <ul className="list-disc pl-6 space-y-2 text-gray-600">
                        <li>Fournir nos services de conseil en assurance personnalisés</li>
                        <li>Établir et présenter des devis d'assurance adaptés</li>
                        <li>Améliorer nos algorithmes d'IA pour de meilleurs conseils</li>
                        <li>Communiquer avec vous concernant nos services</li>
                        <li>Respecter nos obligations légales et réglementaires</li>
                        <li>Prévenir la fraude et garantir la sécurité de la plateforme</li>
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Protection des données */}
                  <Card className="mb-8">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lock className="w-6 h-6 text-red-600" />
                        Protection et sécurité
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-600">
                        Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles 
                        appropriées pour protéger vos données contre :
                      </p>
                      <ul className="list-disc pl-6 space-y-1 text-gray-600">
                        <li>L'accès non autorisé</li>
                        <li>La divulgation accidentelle</li>
                        <li>La modification non autorisée</li>
                        <li>La destruction malveillante</li>
                      </ul>
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-blue-800 text-sm">
                          <strong>Chiffrement :</strong> Toutes les données sensibles sont chiffrées 
                          en transit et au repos selon les standards de l'industrie.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Vos droits */}
                  <Card className="mb-8">
                    <CardHeader>
                      <CardTitle>Vos droits (RGPD)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">
                        Conformément au RGPD, vous disposez des droits suivants :
                      </p>
                      <div className="grid md:grid-cols-2 gap-4">
                        <ul className="list-disc pl-6 space-y-1 text-gray-600">
                          <li>Droit d'accès à vos données</li>
                          <li>Droit de rectification</li>
                          <li>Droit à l'effacement</li>
                          <li>Droit à la limitation du traitement</li>
                        </ul>
                        <ul className="list-disc pl-6 space-y-1 text-gray-600">
                          <li>Droit à la portabilité</li>
                          <li>Droit d'opposition</li>
                          <li>Droit de retirer votre consentement</li>
                          <li>Droit de déposer une réclamation</li>
                        </ul>
                      </div>
                      <p className="text-gray-600 mt-4">
                        Pour exercer vos droits, contactez-nous à : 
                        <a href="mailto:privacy@assuranceia.fr" className="text-blue-600 hover:underline">
                          privacy@assuranceia.fr
                        </a>
                      </p>
                    </CardContent>
                  </Card>

                  {/* Conservation des données */}
                  <Card className="mb-8">
                    <CardHeader>
                      <CardTitle>Conservation des données</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">
                        Nous conservons vos données personnelles uniquement pendant la durée nécessaire 
                        aux finalités pour lesquelles elles ont été collectées :
                      </p>
                      <ul className="list-disc pl-6 space-y-1 text-gray-600">
                        <li><strong>Données de prospect :</strong> 3 ans maximum après le dernier contact</li>
                        <li><strong>Données de client :</strong> Durée du contrat + 5 ans</li>
                        <li><strong>Données techniques :</strong> 13 mois maximum</li>
                        <li><strong>Cookies :</strong> 13 mois maximum</li>
                      </ul>
                    </CardContent>
                  </Card>

                  {/* Contact */}
                  
                </div>
              </div>
            </div>
          </div>
          <Footer />
        </main>
      </div>
    </SidebarProvider>;
};
export default Privacy;