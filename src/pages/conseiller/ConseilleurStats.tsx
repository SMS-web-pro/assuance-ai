import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, TrendingUp, Target, Award, Users, FileText, CheckCircle, Clock, Calendar } from "lucide-react";
import { ConseillerLayout } from "@/components/ConseillerLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface StatsData {
  totalDemandes: number;
  demandesTerminees: number;
  demandesEnCours: number;
  demandesNouvelles: number;
  demandesTraitees: number;
  clientsUniques: number;
  tauxConversion: number;
  objectifMensuel: number;
  progressionObjectif: number;
  statsParType: { [key: string]: number };
  statsParMois: { [key: string]: number };
  tempsReponse: number;
}

const ConseilleurStats = () => {
  const [stats, setStats] = useState<StatsData>({
    totalDemandes: 0,
    demandesTerminees: 0,
    demandesEnCours: 0,
    demandesNouvelles: 0,
    demandesTraitees: 0,
    clientsUniques: 0,
    tauxConversion: 0,
    objectifMensuel: 0,
    progressionObjectif: 0,
    statsParType: {},
    statsParMois: {},
    tempsReponse: 0
  });
  const [loading, setLoading] = useState(true);
  const [conseillerNom, setConseillerNom] = useState<string>("");

  useEffect(() => {
    const sessionData = localStorage.getItem('conseiller_session');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      setConseillerNom(session.nom);
      fetchStats(session.nom);
      
      // Actualisation automatique toutes les 30 secondes
      const interval = setInterval(() => {
        fetchStats(session.nom);
      }, 30000);

      return () => clearInterval(interval);
    }
  }, []);

  const fetchStats = async (nomConseiller: string) => {
    try {
      setLoading(true);
      
      // Récupérer les données du conseiller pour les objectifs
      const { data: conseillerData, error: conseillerError } = await supabase
        .from('conseillers')
        .select('objectif_mensuel, demandsactuelles')
        .eq('nom', nomConseiller)
        .single();

      if (conseillerError) {
        console.error('Erreur conseiller:', conseillerError);
      }

      // Récupérer toutes les demandes assignées au conseiller
      const { data: demandes, error: demandesError } = await supabase
        .from('demandes_assurance')
        .select('*')
        .eq('conseiller_assigne', nomConseiller);

      if (demandesError) {
        console.error('Erreur demandes:', demandesError);
        toast.error('Erreur lors du chargement des statistiques');
        return;
      }

      const demandesArray = demandes || [];
      console.log('Demandes récupérées:', demandesArray);
      console.log('Statuts des demandes:', demandesArray.map(d => ({ id: d.id, statut: d.statut })));
      
      // Calculs des statistiques avec clarification des statuts
      const totalDemandes = demandesArray.length;
      
      // CLARIFICATION DES STATUTS :
      // - "nouveau" = Nouvelle demande non encore traitée
      // - "en_cours" ou "en cours" = Demande en cours de traitement (TRAITÉE mais pas finie)
      // - "termine" ou "traite" = Demande complètement terminée avec succès (CONVERSION)
      // - "archive" = Demande archivée (peut être échec ou succès)
      
      const demandesNouvelles = demandesArray.filter(d => 
        d.statut === 'nouveau'
      ).length;
      
      const demandesEnCours = demandesArray.filter(d => 
        d.statut === 'en_cours' || d.statut === 'en cours'
      ).length;
      
      // DEMANDES TRAITÉES = En cours + Terminées (toutes celles qui ont été prises en charge)
      const demandesTraitees = demandesArray.filter(d => 
        d.statut === 'en_cours' || d.statut === 'en cours' || 
        d.statut === 'termine' || d.statut === 'traite'
      ).length;
      
      // DEMANDES TERMINÉES = Seulement celles complètement finies avec succès
      const demandesTerminees = demandesArray.filter(d => 
        d.statut === 'termine' || d.statut === 'traite'
      ).length;
      
      // Calcul des clients uniques (basé sur email)
      const emailsUniques = new Set(demandesArray.map(d => d.email).filter(Boolean));
      const clientsUniques = emailsUniques.size;
      
      // TAUX DE CONVERSION = (Demandes terminées avec succès / Total des demandes) * 100
      const tauxConversion = totalDemandes > 0 ? Math.round((demandesTerminees / totalDemandes) * 100) : 0;
      
      // Objectifs
      const objectifMensuel = conseillerData?.objectif_mensuel || 0;
      const progressionObjectif = conseillerData?.demandsactuelles || demandesTraitees;
      
      // Statistiques par type d'assurance
      const statsParType: { [key: string]: number } = {};
      demandesArray.forEach(demande => {
        const type = demande.type_assurance;
        statsParType[type] = (statsParType[type] || 0) + 1;
      });

      // Statistiques par mois (derniers 6 mois)
      const statsParMois: { [key: string]: number } = {};
      const maintenant = new Date();
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(maintenant.getFullYear(), maintenant.getMonth() - i, 1);
        const mois = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
        const demandesDuMois = demandesArray.filter(d => {
          const dateCreation = new Date(d.date_creation);
          return dateCreation.getMonth() === date.getMonth() && 
                 dateCreation.getFullYear() === date.getFullYear();
        });
        statsParMois[mois] = demandesDuMois.length;
      }

      // Calcul du temps de réponse moyen (en heures)
      const demandesAvecContact = demandesArray.filter(d => d.date_contact && d.date_creation);
      let tempsReponse = 0;
      if (demandesAvecContact.length > 0) {
        const tempsTotal = demandesAvecContact.reduce((total, demande) => {
          const creation = new Date(demande.date_creation).getTime();
          const contact = new Date(demande.date_contact!).getTime();
          return total + (contact - creation);
        }, 0);
        tempsReponse = Math.round(tempsTotal / (demandesAvecContact.length * 1000 * 60 * 60)); // en heures
      }

      setStats({
        totalDemandes,
        demandesTerminees,
        demandesEnCours,
        demandesNouvelles,
        demandesTraitees,
        clientsUniques,
        tauxConversion,
        objectifMensuel,
        progressionObjectif,
        statsParType,
        statsParMois,
        tempsReponse
      });
      
      console.log('Statistiques calculées:', {
        totalDemandes,
        demandesNouvelles,
        demandesEnCours,
        demandesTraitees: `${demandesTraitees} (en cours + terminées)`,
        demandesTerminees: `${demandesTerminees} (succès uniquement)`,
        tauxConversion: `${tauxConversion}% (terminées/total)`,
        clientsUniques
      });

    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ConseillerLayout title="Statistiques & Performance">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Chargement des statistiques...</div>
        </div>
      </ConseillerLayout>
    );
  }

  return (
    <ConseillerLayout title="Statistiques & Performance">
      <div className="space-y-6">
        {/* Header avec actualisation */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Statistiques & Performance</h1>
            <p className="text-gray-600">Données en temps réel • Dernière mise à jour: {new Date().toLocaleTimeString('fr-FR')}</p>
          </div>
          <button 
            onClick={() => fetchStats(conseillerNom)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Actualiser
          </button>
        </div>

        {/* Explication des statuts */}
        <Card className="border-l-4 border-l-blue-500 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">📊 Explication des Statuts</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div><strong>Nouvelles :</strong> Demandes pas encore prises en charge</div>
            <div><strong>En cours :</strong> Demandes en cours de traitement (contact établi, négociation...)</div>
            <div><strong>Traitées :</strong> Total des demandes prises en charge (En cours + Terminées)</div>
            <div><strong>Terminées :</strong> Demandes finalisées avec succès (contrat signé, vente réalisée)</div>
            <div><strong>Taux de conversion :</strong> (Terminées ÷ Total) × 100 - Mesure votre efficacité commerciale</div>
          </CardContent>
        </Card>

        {/* Stats principales avec clarification */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-800">
                Total Demandes
              </CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-700">{stats.totalDemandes}</div>
              <p className="text-xs text-blue-600">Toutes demandes</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-800">
                Nouvelles
              </CardTitle>
              <Clock className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-700">{stats.demandesNouvelles}</div>
              <p className="text-xs text-gray-600">À traiter</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">
                En Cours
              </CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-700">{stats.demandesEnCours}</div>
              <p className="text-xs text-orange-600">En traitement</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-800">
                Traitées
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-700">{stats.demandesTraitees}</div>
              <p className="text-xs text-purple-600">Prises en charge</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">
                Terminées
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{stats.demandesTerminees}</div>
              <p className="text-xs text-green-600">Succès</p>
            </CardContent>
          </Card>
        </div>

        {/* Métriques de performance améliorées */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Analyse de Performance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.tauxConversion}%</div>
                  <p className="text-sm text-blue-700">Taux de Conversion</p>
                  <p className="text-xs text-blue-600">{stats.demandesTerminees}/{stats.totalDemandes}</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{stats.clientsUniques}</div>
                  <p className="text-sm text-purple-700">Clients Uniques</p>
                  <p className="text-xs text-purple-600">Portfolio</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Efficacité de traitement</span>
                  <span className="text-sm text-gray-600">
                    {stats.totalDemandes > 0 ? Math.round((stats.demandesTraitees / stats.totalDemandes) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${stats.totalDemandes > 0 ? (stats.demandesTraitees / stats.totalDemandes) * 100 : 0}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">
                  {stats.demandesTraitees} demandes traitées sur {stats.totalDemandes} reçues
                </p>
              </div>

              {stats.tempsReponse > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Temps de réponse moyen</span>
                    <span className="text-sm text-gray-600">{stats.tempsReponse}h</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: `${Math.min((24 - stats.tempsReponse) / 24 * 100, 100)}%` }}></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Objectifs du Mois
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Progression actuelle</span>
                  <span className="text-sm text-gray-600">{stats.progressionObjectif}/{stats.objectifMensuel}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300" 
                    style={{ width: `${stats.objectifMensuel > 0 ? Math.min((stats.progressionObjectif / stats.objectifMensuel) * 100, 100) : 0}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {stats.objectifMensuel > 0 ? ((stats.progressionObjectif / stats.objectifMensuel) * 100).toFixed(1) : 0}% atteint
                  </span>
                  <span className="text-gray-600">
                    {Math.max(0, stats.objectifMensuel - stats.progressionObjectif)} restantes
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Taux de conversion</span>
                  <span className="text-sm text-gray-600">{stats.tauxConversion}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: `${Math.min(stats.tauxConversion, 100)}%` }}></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance par type d'assurance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="w-5 h-5" />
              Répartition par Type d'Assurance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.statsParType).length > 0 ? (
                Object.entries(stats.statsParType)
                  .sort(([,a], [,b]) => b - a)
                  .map(([type, count], index) => {
                    const pourcentage = stats.totalDemandes > 0 ? (count / stats.totalDemandes) * 100 : 0;
                    const colors = ['bg-blue-500', 'bg-green-500', 'bg-orange-500', 'bg-purple-500', 'bg-red-500', 'bg-yellow-500'];
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{type}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">{count} demandes</span>
                            <span className="text-xs text-gray-500">({pourcentage.toFixed(1)}%)</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`${colors[index % colors.length]} h-2 rounded-full transition-all duration-500`}
                            style={{ width: `${pourcentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <p className="text-gray-500 text-center py-8">Aucune donnée disponible</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Évolution mensuelle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Évolution des 6 Derniers Mois
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.statsParMois).length > 0 ? (
                Object.entries(stats.statsParMois).map(([mois, count], index) => {
                  const maxCount = Math.max(...Object.values(stats.statsParMois));
                  const pourcentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{mois}</span>
                        <span className="text-sm text-gray-600">{count} demandes</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${pourcentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 text-center py-8">Aucune donnée mensuelle disponible</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ConseillerLayout>
  );
};

export default ConseilleurStats;
