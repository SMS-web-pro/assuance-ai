import { Shield, Users, Award, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Footer from "@/components/Footer";

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            À propos d'AssuranceIA
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Nous révolutionnons le secteur de l'assurance en combinant l'expertise humaine 
            avec l'intelligence artificielle pour offrir des conseils personnalisés et accessibles.
          </p>
        </div>

        {/* Mission Section */}
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Notre Mission</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Démocratiser l'accès aux conseils en assurance en rendant l'expertise accessible 
              à tous, 24h/24 et 7j/7. Nous croyons que chacun mérite une protection adaptée 
              à ses besoins sans avoir à naviguer dans la complexité du secteur.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Notre technologie d'IA analyse vos besoins spécifiques et vous propose des 
              solutions personnalisées, tout en vous expliquant clairement les enjeux 
              et les garanties.
            </p>
          </div>
          <div className="flex items-center justify-center">
            <Shield className="w-48 h-48 text-blue-600 opacity-20" />
          </div>
        </div>

        {/* Valeurs */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Nos Valeurs
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <Target className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle>Transparence</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Nous expliquons clairement chaque garantie et condition, 
                  sans jargon technique ni clauses cachées.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle>Accessibilité</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Des conseils d'expert accessibles à tous, sans rendez-vous 
                  ni contraintes horaires.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <Award className="w-8 h-8 text-purple-600" />
                </div>
                <CardTitle>Excellence</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Nous combinons l'expertise humaine et l'IA pour offrir 
                  le meilleur conseil possible.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Histoire */}
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Notre Histoire
          </h2>
          <div className="max-w-4xl mx-auto">
            <p className="text-gray-600 leading-relaxed mb-6">
              Fondée en 2024 par une équipe d'experts en assurance et en intelligence artificielle, 
              AssuranceIA est née d'un constat simple : l'assurance est trop complexe et 
              les conseils d'experts trop difficiles d'accès.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              Nous avons développé une plateforme révolutionnaire qui combine l'expertise 
              de conseillers certifiés avec la puissance de l'IA pour offrir des conseils 
              personnalisés en temps réel.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Aujourd'hui, nous accompagnons des milliers de clients dans leurs choix 
              d'assurance, en leur faisant gagner du temps et en leur offrant la 
              tranquillité d'esprit qu'ils méritent.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default About;