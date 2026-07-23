import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import FixedHeader from "@/components/FixedHeader";
import Footer from "@/components/Footer";
const Cookies = () => {
  return <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar />
        <main className="flex-1">
          <FixedHeader />
          <div className="p-6 pt-20">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Politique des Cookies</h1>
                
                <div className="space-y-8 text-gray-700">
                  <section>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Qu'est-ce qu'un cookie ?</h2>
                    <p className="mb-4">
                      Un cookie est un petit fichier texte déposé sur votre ordinateur lors de la visite d'un site 
                      ou de la consultation d'une publicité. Il a pour but de collecter des informations relatives 
                      à votre navigation et de vous adresser des services adaptés à votre terminal (ordinateur, 
                      mobile ou tablette).
                    </p>
                    <p>
                      Les cookies sont gérés par votre navigateur internet et seul l'émetteur d'un cookie peut 
                      décider de la lecture ou de la modification des informations qui y sont contenues.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Les cookies que nous utilisons</h2>
                    
                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Cookies techniques (obligatoires)</h3>
                      <p className="mb-2">
                        Ces cookies sont nécessaires au bon fonctionnement du site et ne peuvent pas être désactivés :
                      </p>
                      <ul className="list-disc ml-6 space-y-1">
                        <li>Cookies de session pour maintenir votre connexion</li>
                        <li>Cookies de sécurité pour protéger contre les attaques</li>
                        <li>Cookies de préférences pour sauvegarder vos choix de langue</li>
                      </ul>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Cookies analytiques</h3>
                      <p className="mb-2">
                        Ces cookies nous aident à comprendre comment vous utilisez notre site :
                      </p>
                      <ul className="list-disc ml-6 space-y-1">
                        <li>Google Analytics pour mesurer l'audience et le comportement des visiteurs</li>
                        <li>Cookies de performance pour optimiser la vitesse de chargement</li>
                        <li>Cookies d'analyse du parcours utilisateur</li>
                      </ul>
                      <p className="mt-2 text-sm text-gray-600">
                        Durée de conservation : 24 mois maximum
                      </p>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Cookies fonctionnels</h3>
                      <p className="mb-2">
                        Ces cookies améliorent votre expérience sur notre plateforme :
                      </p>
                      <ul className="list-disc ml-6 space-y-1">
                        <li>Mémorisation de vos préférences de devis</li>
                        <li>Sauvegarde de votre progression dans un formulaire</li>
                        <li>Personnalisation de l'interface utilisateur</li>
                      </ul>
                      <p className="mt-2 text-sm text-gray-600">
                        Durée de conservation : 12 mois maximum
                      </p>
                    </div>

                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Cookies publicitaires</h3>
                      <p className="mb-2">
                        Ces cookies permettent de vous proposer des publicités adaptées :
                      </p>
                      <ul className="list-disc ml-6 space-y-1">
                        <li>Cookies de ciblage publicitaire</li>
                        <li>Cookies de mesure d'efficacité des campagnes</li>
                        <li>Cookies de réseaux sociaux (Facebook, LinkedIn)</li>
                      </ul>
                      <p className="mt-2 text-sm text-gray-600">
                        Durée de conservation : 13 mois maximum
                      </p>
                    </div>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Gestion de vos préférences</h2>
                    <p className="mb-4">
                      Vous pouvez à tout moment modifier vos préférences concernant les cookies depuis 
                      les paramètres de votre navigateur ou en utilisant notre centre de préférences 
                      accessible en bas de chaque page.
                    </p>
                    
                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Configuration par navigateur</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Google Chrome</h4>
                          <p className="text-sm">
                            Menu → Paramètres → Avancés → Confidentialité et sécurité → Paramètres du site → Cookies
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Mozilla Firefox</h4>
                          <p className="text-sm">
                            Menu → Options → Vie privée et sécurité → Cookies et données de sites
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Safari</h4>
                          <p className="text-sm">
                            Safari → Préférences → Confidentialité → Cookies et données de sites web
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Microsoft Edge</h4>
                          <p className="text-sm">
                            Menu → Paramètres → Cookies et autorisations de site → Cookies et données stockées
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Conséquences du refus des cookies</h2>
                    <p className="mb-4">
                      Vous pouvez refuser l'enregistrement de cookies en configurant votre navigateur. 
                      Cependant, votre refus pourra entraîner une impossibilité d'accès à certains services 
                      et une dégradation de votre expérience de navigation.
                    </p>
                    <p>
                      Le refus des cookies techniques peut empêcher l'utilisation normale de notre plateforme 
                      de comparaison d'assurances.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Cookies tiers</h2>
                    <p className="mb-4">
                      Nous utilisons des services tiers qui peuvent déposer leurs propres cookies :
                    </p>
                    <ul className="list-disc ml-6 space-y-2">
                      <li>
                        <strong>Google Analytics :</strong> Pour l'analyse d'audience
                        <br />
                        <span className="text-sm text-gray-600">
                          Politique de confidentialité : 
                          <a href="https://policies.google.com/privacy" className="text-blue-600 hover:underline ml-1" target="_blank" rel="noopener noreferrer">
                            policies.google.com/privacy
                          </a>
                        </span>
                      </li>
                      <li>
                        <strong>Facebook Pixel :</strong> Pour le suivi des conversions publicitaires
                        <br />
                        <span className="text-sm text-gray-600">
                          Politique de confidentialité : 
                          <a href="https://www.facebook.com/privacy/policy" className="text-blue-600 hover:underline ml-1" target="_blank" rel="noopener noreferrer">
                            facebook.com/privacy/policy
                          </a>
                        </span>
                      </li>
                    </ul>
                  </section>

                  

                  <section>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Mise à jour</h2>
                    <p>
                      Cette politique des cookies peut être mise à jour. Nous vous encourageons à la consulter 
                      régulièrement. La date de dernière mise à jour est indiquée en haut de cette page.
                    </p>
                    <p className="mt-4 text-sm text-gray-600">
                      <strong>Dernière mise à jour :</strong> 4 juillet 2025
                    </p>
                  </section>
                </div>
              </div>
            </div>
          </div>
          <Footer />
        </main>
      </div>
    </SidebarProvider>;
};
export default Cookies;