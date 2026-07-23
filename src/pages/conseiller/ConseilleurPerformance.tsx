import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Users, Target, Award, Calendar } from "lucide-react";
import { ConseillerLayout } from "@/components/ConseillerLayout";

const ConseilleurPerformance = () => {
  const performanceData = {
    mensuelle: {
      ventes: { valeur: 24, objectif: 50, evolution: +12 },
      ca: { valeur: 35000, objectif: 50000, evolution: +15 },
      conversion: { valeur: 76, objectif: 80, evolution: +5 },
      satisfaction: { valeur: 4.8, objectif: 4.5, evolution: +3 }
    },
    trimestrielle: {
      ventes: { valeur: 68, objectif: 150, evolution: +8 },
      ca: { valeur: 98000, objectif: 150000, evolution: +12 },
      conversion: { valeur: 74, objectif: 80, evolution: +2 },
      satisfaction: { valeur: 4.7, objectif: 4.5, evolution: +1 }
    }
  };

  const comparaison = [
    {
      metrique: "Ventes mensuelles",
      moi: 24,
      moyenne: 18,
      meilleur: 32,
      rang: "3/12"
    },
    {
      metrique: "Taux de conversion",
      moi: 76,
      moyenne: 65,
      meilleur: 85,
      rang: "2/12"
    },
    {
      metrique: "Satisfaction client",
      moi: 4.8,
      moyenne: 4.2,
      meilleur: 4.9,
      rang: "2/12"
    },
    {
      metrique: "Temps de traitement",
      moi: 2.3,
      moyenne: 3.1,
      meilleur: 1.8,
      rang: "3/12"
    }
  ];

  const tendances = [
    {
      periode: "Janvier 2024",
      ventes: 24,
      ca: 35000,
      clients: 12
    },
    {
      periode: "Décembre 2023",
      ventes: 28,
      ca: 42000,
      clients: 15
    },
    {
      periode: "Novembre 2023",
      ventes: 22,
      ca: 31000,
      clients: 10
    },
    {
      periode: "Octobre 2023",
      ventes: 26,
      ca: 38000,
      clients: 13
    }
  ];

  const getEvolutionBadge = (evolution: number) => {
    if (evolution > 0) {
      return (
        <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          +{evolution}%
        </Badge>
      );
    } else if (evolution < 0) {
      return (
        <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
          <TrendingDown className="w-3 h-3" />
          {evolution}%
        </Badge>
      );
    } else {
      return <Badge variant="secondary">0%</Badge>;
    }
  };

  const getRangBadge = (rang: string) => {
    const position = parseInt(rang.split('/')[0]);
    if (position <= 3) {
      return <Badge className="bg-yellow-100 text-yellow-800">{rang}</Badge>;
    }
    return <Badge variant="outline">{rang}</Badge>;
  };

  return (
    <ConseillerLayout title="Performance & Analyse">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Performance & Analyse</h1>

        {/* Performance mensuelle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Performance Mensuelle
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">Ventes</h3>
                  {getEvolutionBadge(performanceData.mensuelle.ventes.evolution)}
                </div>
                <div className="text-2xl font-bold">
                  {performanceData.mensuelle.ventes.valeur}
                </div>
                <div className="text-xs text-gray-600">
                  Objectif: {performanceData.mensuelle.ventes.objectif}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${(performanceData.mensuelle.ventes.valeur / performanceData.mensuelle.ventes.objectif) * 100}%`
                    }}
                  ></div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">Chiffre d'affaires</h3>
                  {getEvolutionBadge(performanceData.mensuelle.ca.evolution)}
                </div>
                <div className="text-2xl font-bold">
                  {performanceData.mensuelle.ca.valeur.toLocaleString()}€
                </div>
                <div className="text-xs text-gray-600">
                  Objectif: {performanceData.mensuelle.ca.objectif.toLocaleString()}€
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${(performanceData.mensuelle.ca.valeur / performanceData.mensuelle.ca.objectif) * 100}%`
                    }}
                  ></div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">Conversion</h3>
                  {getEvolutionBadge(performanceData.mensuelle.conversion.evolution)}
                </div>
                <div className="text-2xl font-bold">
                  {performanceData.mensuelle.conversion.valeur}%
                </div>
                <div className="text-xs text-gray-600">
                  Objectif: {performanceData.mensuelle.conversion.objectif}%
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-orange-600 h-2 rounded-full"
                    style={{
                      width: `${(performanceData.mensuelle.conversion.valeur / performanceData.mensuelle.conversion.objectif) * 100}%`
                    }}
                  ></div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">Satisfaction</h3>
                  {getEvolutionBadge(performanceData.mensuelle.satisfaction.evolution)}
                </div>
                <div className="text-2xl font-bold">
                  {performanceData.mensuelle.satisfaction.valeur}/5
                </div>
                <div className="text-xs text-gray-600">
                  Objectif: {performanceData.mensuelle.satisfaction.objectif}/5
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{
                      width: `${(performanceData.mensuelle.satisfaction.valeur / 5) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comparaison avec l'équipe */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Comparaison avec l'Équipe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {comparaison.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium">{item.metrique}</h3>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span>Vous: <strong>{item.moi}</strong></span>
                      <span className="text-gray-600">Moyenne: {item.moyenne}</span>
                      <span className="text-green-600">Meilleur: {item.meilleur}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getRangBadge(item.rang)}
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {item.moi > item.moyenne ? '+' : ''}{((item.moi - item.moyenne) / item.moyenne * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-600">vs moyenne</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tendances sur 4 mois */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Évolution sur 4 Mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tendances.map((periode, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="font-medium">{periode.periode}</div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="font-medium">{periode.ventes}</div>
                      <div className="text-xs text-gray-600">Ventes</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{periode.ca.toLocaleString()}€</div>
                      <div className="text-xs text-gray-600">CA</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium">{periode.clients}</div>
                      <div className="text-xs text-gray-600">Nouveaux clients</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Points d'amélioration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Points d'Amélioration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="font-medium text-red-800">Priorité Haute</span>
                </div>
                <p className="text-sm text-red-700">
                  Augmenter le taux de conversion (76% vs objectif 80%)
                </p>
              </div>
              
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="font-medium text-orange-800">Priorité Moyenne</span>
                </div>
                <p className="text-sm text-orange-700">
                  Accélerer le temps de traitement (2.3h vs meilleur équipe 1.8h)
                </p>
              </div>
              
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="font-medium text-blue-800">Opportunité</span>
                </div>
                <p className="text-sm text-blue-700">
                  Maintenir l'excellent niveau de satisfaction client (4.8/5)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ConseillerLayout>
  );
};

export default ConseilleurPerformance;
