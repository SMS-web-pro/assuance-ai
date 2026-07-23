import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import FixedHeader from "@/components/FixedHeader";
import Footer from "@/components/Footer";
const Legal = () => {
  return <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar />
        <main className="flex-1">
          <FixedHeader />
          <div className="p-6 pt-20">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Mentions Légales</h1>
                
                <div className="space-y-8 text-gray-700">
                  

                  <section>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Directeur de la publication</h2>
                    <p>Monsieur Jean Dupont, Président de AssuranceIA SAS</p>
                  </section>

                  

                  

                  

                  <section>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Propriété intellectuelle</h2>
                    <p className="mb-4">
                      L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur 
                      et la propriété intellectuelle. Tous les droits de reproduction sont réservés, y compris pour 
                      les documents téléchargeables et les représentations iconographiques et photographiques.
                    </p>
                    <p>
                      La reproduction de tout ou partie de ce site sur un support électronique quel qu'il soit est 
                      formellement interdite sauf autorisation expresse du directeur de la publication.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Limitation de responsabilité</h2>
                    <p className="mb-4">
                      Les informations contenues sur ce site sont aussi précises que possible et le site remis à jour 
                      à différentes périodes de l'année, mais peut toutefois contenir des inexactitudes ou des omissions.
                    </p>
                    <p>
                      Si vous constatez une lacune, erreur ou ce qui parait être un dysfonctionnement, 
                      merci de bien vouloir le signaler par email à l'adresse contact@assuranceia.fr, 
                      en décrivant le problème de la manière la plus précise possible.
                    </p>
                  </section>

                  <section>
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Litiges</h2>
                    <p className="mb-4">
                      Les présentes conditions du site AssuranceIA et votre utilisation de ce site sont régies 
                      par la loi française. Tout litige portant sur l'utilisation du site AssuranceIA sera 
                      de la compétence exclusive des tribunaux de Paris.
                    </p>
                    <p>
                      Pour toute question relative à l'utilisation du site, vous pouvez nous écrire à l'adresse 
                      contact@assuranceia.fr.
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
export default Legal;