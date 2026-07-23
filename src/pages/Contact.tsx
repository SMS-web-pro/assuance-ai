import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Footer from "@/components/Footer";

const Contact = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Contactez-nous
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Notre équipe est à votre disposition pour répondre à toutes vos questions 
            et vous accompagner dans vos projets d'assurance.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Informations de contact */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Nos coordonnées
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Phone className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Téléphone</h3>
                    <p className="text-gray-600">01 23 45 67 89</p>
                    <p className="text-sm text-gray-500">Lundi - Vendredi : 9h - 18h</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Mail className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Email</h3>
                    <p className="text-gray-600">contact@assuranceia.fr</p>
                    <p className="text-sm text-gray-500">Réponse sous 24h</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Adresse</h3>
                    <p className="text-gray-600">123 Avenue de la République</p>
                    <p className="text-gray-600">75011 Paris, France</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Horaires</h3>
                    <p className="text-gray-600">Lundi - Vendredi : 9h - 18h</p>
                    <p className="text-gray-600">Samedi : 10h - 16h</p>
                    <p className="text-sm text-gray-500">Conseillers IA disponibles 24h/24</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Support d'urgence */}
            <Card className="bg-red-50 border-red-200">
              <CardHeader>
                <CardTitle className="text-red-800">Support d'urgence</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-700 mb-4">
                  En cas de sinistre ou d'urgence, contactez directement votre assureur 
                  ou composez le numéro d'urgence indiqué sur votre contrat.
                </p>
                <p className="text-sm text-red-600">
                  Notre service client ne gère pas les déclarations de sinistres.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Formulaire de contact */}
          <Card className="shadow-xl">
            <CardHeader>
              <CardTitle>Envoyez-nous un message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prénom
                    </label>
                    <Input placeholder="Votre prénom" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom
                    </label>
                    <Input placeholder="Votre nom" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <Input type="email" placeholder="votre.email@exemple.fr" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone
                  </label>
                  <Input type="tel" placeholder="06 12 34 56 78" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sujet
                  </label>
                  <Input placeholder="Objet de votre message" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <Textarea 
                    placeholder="Décrivez votre demande en détail..."
                    className="min-h-32"
                  />
                </div>

                <Button className="w-full">
                  Envoyer le message
                </Button>
              </form>

              <p className="text-sm text-gray-500 text-center">
                En envoyant ce formulaire, vous acceptez notre{" "}
                <a href="/privacy" className="text-blue-600 hover:underline">
                  politique de confidentialité
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;