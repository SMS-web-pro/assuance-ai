import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Shield, Users, Award, Clock, Heart } from "lucide-react";

const AboutContent = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          À propos d'AssuranceIA
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Découvrez qui nous sommes et comment nous révolutionnons le monde de l'assurance 
          grâce à l'intelligence artificielle.
        </p>
      </div>

      {/* Mission Section */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Heart className="h-6 w-6 text-primary" />
            Notre Mission
          </CardTitle>
        </CardHeader>
        <CardContent className="text-lg">
          <p className="mb-4">
            Chez <strong>AssuranceIA</strong>, nous croyons que l'assurance doit être accessible, 
            transparente et personnalisée pour chacun. Notre mission est de démocratiser l'accès 
            aux conseils d'experts en assurance grâce à l'intelligence artificielle.
          </p>
          <p>
            Nous combinons l'expertise humaine de décennies dans l'assurance avec les dernières 
            innovations en IA pour vous offrir un service de conseil disponible 24h/24, 
            parfaitement adapté à vos besoins spécifiques.
          </p>
        </CardContent>
      </Card>

      {/* Values Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="text-center">
          <CardContent className="pt-6">
            <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Transparence</h3>
            <p className="text-sm text-muted-foreground">
              Aucune commission cachée, des conseils objectifs et neutres
            </p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <Users className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Expertise</h3>
            <p className="text-sm text-muted-foreground">
              15 ans d'expérience dans l'assurance intégrés dans notre IA
            </p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <Clock className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Disponibilité</h3>
            <p className="text-sm text-muted-foreground">
              Un conseiller IA disponible 24h/24 et 7j/7
            </p>
          </CardContent>
        </Card>
        
        <Card className="text-center">
          <CardContent className="pt-6">
            <Award className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Excellence</h3>
            <p className="text-sm text-muted-foreground">
              98% de satisfaction client et reconnaissance du secteur
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Technology Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Notre Technologie</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-xl font-semibold mb-4">Intelligence Artificielle Avancée</h3>
              <p className="mb-4">
                Notre plateforme utilise des algorithmes de machine learning de pointe, 
                entraînés sur des milliers de contrats d'assurance et de situations clients réelles.
              </p>
              <ul className="space-y-2">
                {[
                  "Analyse prédictive des risques",
                  "Personnalisation en temps réel",
                  "Apprentissage continu des préférences",
                  "Optimisation automatique des devis"
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Précision des recommandations</span>
                  <Badge variant="secondary">94%</Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{width: '94%'}}></div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Temps de réponse moyen</span>
                  <Badge variant="secondary">&lt; 2s</Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{width: '98%'}}></div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Satisfaction client</span>
                  <Badge variant="secondary">98%</Badge>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{width: '98%'}}></div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Notre Équipe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Marie Dubois",
                role: "CEO & Fondatrice",
                experience: "15 ans d'expérience en assurance",
                specialty: "Stratégie produit et innovation"
              },
              {
                name: "Thomas Laurent", 
                role: "CTO",
                experience: "Expert en Intelligence Artificielle",
                specialty: "Machine Learning et NLP"
              },
              {
                name: "Sophie Martin",
                role: "Directrice Commerciale",
                experience: "12 ans en conseil client assurance",
                specialty: "Expérience utilisateur et formation IA"
              }
            ].map((member, index) => (
              <Card key={index} className="border border-border">
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <h3 className="font-semibold text-lg">{member.name}</h3>
                    <p className="text-primary font-medium mb-2">{member.role}</p>
                    <p className="text-sm text-muted-foreground mb-1">{member.experience}</p>
                    <p className="text-xs text-muted-foreground italic">{member.specialty}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Awards Section */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Award className="h-6 w-6 text-amber-600" />
            Reconnaissances & Certifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Prix & Distinctions</h3>
              <ul className="space-y-2">
                {[
                  "Meilleur Service Client IA - Assurances 2024",
                  "Certification ISO 27001 - Sécurité des données"
                ].map((award, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-amber-600" />
                    <span>{award}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3">Partenariats</h3>
              <ul className="space-y-2">
                {[
                  "Partenaire de 15+ compagnies d'assurance",
                  "Certifié GDPR - Protection des données"
                ].map((partnership, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>{partnership}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA Section */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardContent className="text-center py-8">
          <h2 className="text-2xl font-bold mb-4">
            Prêt à découvrir l'assurance nouvelle génération ?
          </h2>
          <p className="text-lg mb-6 opacity-90">
            Rejoignez les milliers de clients qui nous font déjà confiance
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>Gratuit et sans engagement</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>Conseils d'experts 24h/24</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span>Devis personnalisés en 5 minutes</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AboutContent;