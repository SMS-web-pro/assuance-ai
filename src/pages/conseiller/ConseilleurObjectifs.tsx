
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, Award, Plus, Calendar } from "lucide-react";
import { ConseillerLayout } from "@/components/ConseillerLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ObjectifData {
  totalDemandes: number;
  demandesTerminees: number;
  clientsActifs: number;
  tauxConversion: number;
}

const ConseilleurObjectifs = () => {
  const [objectifs, setObjectifs] = useState<ObjectifData>({
    totalDemandes: 0,
    demandesTerminees: 0,
    clientsActifs: 0,
    tauxConversion: 0
  });
  const [loading, setLoading] = useState(true);
  const [conseillerNom, setConseillerNom] = useState<string>("");

  useEffect(() => {
    const sessionData = localStorage.getItem('conseiller_session');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      setConseillerNom(session.nom);
      fetchObjectifs(session.nom);
    }
  }, []);

  const fetchObjectifs = async (nomConseiller: string) => {
    try {
      setLoading(true);
      
      // Récupérer les demandes du mois en cours
      const debutMois = new Date();
      debutMois.setDate(1);
      debutMois.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('demandes_assurance')
        .select('*')
        .eq('conseiller_assigne', nomConseiller)
        .gte('date_creation', debutMois.toISOString());

      if (error) {
        console.error('Erreur lors de la récupération des objectifs:', error);
        toast.error('Erreur lors du chargement des objectifs');
        return;
      }

      const demandes = data || [];
      const totalDemandes = demandes.length;
      const demandesTerminees = demandes.filter(d => d.statut === 'termine').length;
      const clientsActifs = demandesTerminees; // Clients ayant terminé leur demande
      const tauxConversion = totalDemandes > 0 ? Math.round((demandesTerminees / totalDemandes) * 100) : 0;

      setObjectifs({
        totalDemandes,
        demandesTerminees,
        clientsActifs,
        tauxConversion
      });
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des objectifs');
    } finally {
      setLoading(false);
    }
  };

  const objectifsMensuel = [
    {
      titre: "Demandes traitées",
      actuel: objectifs.totalDemandes,
      objectif: 50,
      unite: "demandes",
      pourcentage: Math.min((objectifs.totalDemandes / 50) * 100, 100),
      tendance: "+12%"
    },
    {
      titre: "Nouveaux clients",
      actuel: objectifs.clientsActifs,
      objectif: 20,
      unite: "clients",
      pourcentage: Math.min((objectifs.clientsActifs / 20) * 100, 100),
      tendance: "+8%"
    },
    {
      titre: "Demandes terminées",
      actuel: objectifs.demandesTerminees,
      objectif: 30,
      unite: "demandes",
      pourcentage: Math.min((objectifs.demandesTerminees / 30) * 100, 100),
      tendance: "+15%"
    },
    {
      titre: "Taux de conversion",
      actuel: objectifs.tauxConversion,
      objectif: 80,
      unite: "%",
      pourcentage: Math.min((objectifs.tauxConversion / 80) * 100, 100),
      tendance: "+5%"
    }
  ];

  const objectifsAnnuel = [
    {
      titre: "Portfolio clients",
      actuel: objectifs.clientsActifs * 12, // Estimation annuelle
      objectif: 200,
      unite: "clients",
      pourcentage: Math.min(((objectifs.clientsActifs * 12) / 200) * 100, 100)
    },
    {
      titre: "Demandes annuelles",
      actuel: objectifs.totalDemandes * 12, // Estimation annuelle
      objectif: 600,
      unite: "demandes",
      pourcentage: Math.min(((objectifs.totalDemandes * 12) / 600) * 100, 100)
    },
    {
      titre: "Taux de réussite moyen",
      actuel: objectifs.tauxConversion,
      objectif: 85,
      unite: "%",
      pourcentage: Math.min((objectifs.tauxConversion / 85) * 100, 100)
    }
  ];

  const recompenses = [
    {
      titre: "Performance du Mois",
      description: `${objectifs.totalDemandes} demandes traitées ce mois`,
      date: new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      icon: "🏆"
    },
    {
      titre: "Taux de Conversion",
      description: `${objectifs.tauxConversion}% de taux de réussite`,
      date: "Performance actuelle",
      icon: "⭐"
    },
    {
      titre: "Clients Satisfaits",
      description: `${objectifs.clientsActifs} nouveaux clients ce mois`,
      date: "Croissance continue",
      icon: "🎯"
    }
  ];

  if (loading) {
    return (
      <ConseillerLayout title="Objectifs & Performance">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Chargement des objectifs...</div>
        </div>
      </ConseillerLayout>
    );
  }

  return (
    <ConseillerLayout title="Objectifs & Performance">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Objectifs & Performance</h1>
            <p className="text-gray-600">Suivez vos performances et objectifs mensuels</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nouvel Objectif
          </Button>
        </div>

        {/* Objectifs du mois */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Objectifs du Mois - {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {objectifsMensuel.map((objectif, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{objectif.titre}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-green-600 font-medium">
                        {objectif.tendance}
                      </span>
                      <TrendingUp className="w-3 h-3 text-green-600" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span>{objectif.actuel.toLocaleString()} {objectif.unite}</span>
                    <span className="text-gray-600">
                      / {objectif.objectif.toLocaleString()} {objectif.unite}
                    </span>
                  </div>
                  
                  <Progress value={objectif.pourcentage} className="h-2" />
                  
                  <div className="text-xs text-gray-600">
                    {Math.round(objectif.pourcentage)}% de l'objectif atteint
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Objectifs annuels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Objectifs Annuels 2024
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {objectifsAnnuel.map((objectif, index) => (
                <div key={index} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{objectif.titre}</h3>
                    <span className="text-sm font-medium">
                      {Math.round(objectif.pourcentage)}%
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{objectif.actuel.toLocaleString()} {objectif.unite}</span>
                    <span>/ {objectif.objectif.toLocaleString()} {objectif.unite}</span>
                  </div>
                  
                  <Progress value={objectif.pourcentage} className="h-3" />
                  
                  <div className="text-xs text-gray-600">
                    Reste à atteindre: {Math.max(0, objectif.objectif - objectif.actuel).toLocaleString()} {objectif.unite}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Récompenses et achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Récompenses & Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recompenses.map((recompense, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200"
                >
                  <div className="text-center">
                    <div className="text-3xl mb-2">{recompense.icon}</div>
                    <h3 className="font-semibold text-orange-800">{recompense.titre}</h3>
                    <p className="text-sm text-orange-600 mt-1">{recompense.description}</p>
                    <p className="text-xs text-orange-500 mt-2">{recompense.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Conseils pour atteindre les objectifs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Conseils pour Améliorer vos Performances
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Prospection active</p>
                  <p className="text-xs text-gray-600">
                    Contactez 5 nouveaux prospects par jour pour augmenter votre conversion
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Suivi client régulier</p>
                  <p className="text-xs text-gray-600">
                    Programmez des rappels hebdomadaires pour vos clients en cours
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <div className="w-2 h-2 bg-purple-600 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Formation continue</p>
                  <p className="text-xs text-gray-600">
                    Participez aux formations produits pour mieux conseiller vos clients
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ConseillerLayout>
  );
};

export default ConseilleurObjectifs;
