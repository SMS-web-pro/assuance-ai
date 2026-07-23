
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, Target, TrendingUp, Calendar, Clock, CheckCircle, AlertCircle, Euro, Phone, BarChart3, Activity } from "lucide-react";

interface AdminMetricsCardsProps {
  demandes: any[];
  conseillers: any[];
  rappels: any[];
}

const AdminMetricsCards = ({ demandes, conseillers, rappels }: AdminMetricsCardsProps) => {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

  // Calculs des métriques
  const totalDemandes = demandes?.length || 0;
  const demandesAujourdhui = demandes?.filter(d => 
    new Date(d.date_creation) >= startOfToday
  ).length || 0;
  
  const demandesHier = demandes?.filter(d => {
    const dateCreation = new Date(d.date_creation);
    return dateCreation >= yesterday && dateCreation < startOfToday;
  }).length || 0;

  const demandesCeMois = demandes?.filter(d => 
    new Date(d.date_creation) >= thisMonth
  ).length || 0;

  const demandesMoisDernier = demandes?.filter(d => {
    const dateCreation = new Date(d.date_creation);
    return dateCreation >= lastMonth && dateCreation <= endOfLastMonth;
  }).length || 0;

  const demandesNouvelles = demandes?.filter(d => d.statut === 'nouveau').length || 0;
  const demandesEnCours = demandes?.filter(d => d.statut === 'en_cours').length || 0;
  const demandesTraitees = demandes?.filter(d => d.statut === 'traite').length || 0;
  const demandesTerminees = demandes?.filter(d => d.statut === 'termine').length || 0;
  const demandesValidees = demandes?.filter(d => d.statut === 'valide').length || 0;

  const tauxConversion = totalDemandes > 0 ? 
    ((demandesTerminees / totalDemandes) * 100).toFixed(1) : "0";

  const totalConseillers = conseillers?.length || 0;
  const conseillersActifs = conseillers?.filter(c => c.statut === 'En ligne').length || 0;
  const conseillersOccupes = conseillers?.filter(c => c.statut === 'Occupé').length || 0;

  const totalRappels = rappels?.length || 0;
  const rappelsAujourdhui = rappels?.filter(r => {
    const dateRappel = new Date(r.date_rappel);
    return dateRappel >= startOfToday && dateRappel < new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
  }).length || 0;

  const rappelsEnRetard = rappels?.filter(r => {
    const dateRappel = new Date(r.date_rappel);
    return dateRappel < startOfToday && r.statut !== 'termine';
  }).length || 0;

  // Revenus estimés (1200€ par demande terminée)
  const revenusEstimes = demandesTerminees * 1200;
  const revenusObjectif = 100000; // Objectif mensuel

  // Évolution
  const evolutionDemandes = demandesHier > 0 ? 
    ((demandesAujourdhui - demandesHier) / demandesHier * 100).toFixed(1) : "0";
  
  const evolutionMensuelle = demandesMoisDernier > 0 ? 
    ((demandesCeMois - demandesMoisDernier) / demandesMoisDernier * 100).toFixed(1) : "0";

  const metrics = [
    // Première ligne - Métriques principales
    {
      title: "Total Demandes",
      value: totalDemandes.toString(),
      subtitle: `${demandesAujourdhui} aujourd'hui`,
      icon: MessageSquare,
      color: "text-blue-600",
      bgColor: "bg-gradient-to-br from-blue-50 to-blue-100",
      borderColor: "border-blue-200",
      evolution: evolutionDemandes,
      evolutionLabel: "vs hier"
    },
    {
      title: "Taux de Conversion",
      value: `${tauxConversion}%`,
      subtitle: `${demandesTerminees} terminées`,
      icon: Target,
      color: "text-green-600",
      bgColor: "bg-gradient-to-br from-green-50 to-green-100",
      borderColor: "border-green-200",
      evolution: tauxConversion,
      evolutionLabel: "taux actuel"
    },
    {
      title: "Conseillers Actifs",
      value: `${conseillersActifs}/${totalConseillers}`,
      subtitle: `${conseillersOccupes} occupés`,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-gradient-to-br from-purple-50 to-purple-100",
      borderColor: "border-purple-200",
      evolution: Math.round((conseillersActifs / totalConseillers) * 100).toString(),
      evolutionLabel: "disponibilité"
    },
    {
      title: "Revenus Estimés",
      value: `€${revenusEstimes.toLocaleString()}`,
      subtitle: `Objectif: €${revenusObjectif.toLocaleString()}`,
      icon: Euro,
      color: "text-orange-600",
      bgColor: "bg-gradient-to-br from-orange-50 to-orange-100",
      borderColor: "border-orange-200",
      evolution: Math.round((revenusEstimes / revenusObjectif) * 100).toString(),
      evolutionLabel: "de l'objectif"
    },

    // Deuxième ligne - Statuts des demandes
    {
      title: "Nouvelles",
      value: demandesNouvelles.toString(),
      subtitle: "À traiter",
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-gradient-to-br from-red-50 to-red-100",
      borderColor: "border-red-200",
      evolution: Math.round((demandesNouvelles / totalDemandes) * 100).toString(),
      evolutionLabel: "du total"
    },
    {
      title: "En Cours",
      value: demandesEnCours.toString(),
      subtitle: "En traitement",
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-gradient-to-br from-yellow-50 to-yellow-100",
      borderColor: "border-yellow-200",
      evolution: Math.round((demandesEnCours / totalDemandes) * 100).toString(),
      evolutionLabel: "du total"
    },
    {
      title: "Traitées",
      value: demandesTraitees.toString(),
      subtitle: "Analysées",
      icon: CheckCircle,
      color: "text-indigo-600",
      bgColor: "bg-gradient-to-br from-indigo-50 to-indigo-100",
      borderColor: "border-indigo-200",
      evolution: Math.round((demandesTraitees / totalDemandes) * 100).toString(),
      evolutionLabel: "du total"
    },
    {
      title: "Terminées",
      value: demandesTerminees.toString(),
      subtitle: "Finalisées avec succès",
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-gradient-to-br from-emerald-50 to-emerald-100",
      borderColor: "border-emerald-200",
      evolution: Math.round((demandesTerminees / totalDemandes) * 100).toString(),
      evolutionLabel: "du total"
    },

    // Troisième ligne - Rappels et activité
    {
      title: "Rappels Aujourd'hui",
      value: rappelsAujourdhui.toString(),
      subtitle: `${rappelsEnRetard} en retard`,
      icon: Phone,
      color: "text-pink-600",
      bgColor: "bg-gradient-to-br from-pink-50 to-pink-100",
      borderColor: "border-pink-200",
      evolution: rappelsEnRetard.toString(),
      evolutionLabel: "urgents"
    },
    {
      title: "Évolution Mensuelle",
      value: `${Number(evolutionMensuelle) > 0 ? '+' : ''}${evolutionMensuelle}%`,
      subtitle: `${demandesCeMois} ce mois`,
      icon: BarChart3,
      color: "text-cyan-600",
      bgColor: "bg-gradient-to-br from-cyan-50 to-cyan-100",
      borderColor: "border-cyan-200",
      evolution: demandesCeMois.toString(),
      evolutionLabel: "demandes"
    },
    {
      title: "Activité Système",
      value: "En ligne",
      subtitle: "Temps réel activé",
      icon: Activity,
      color: "text-teal-600",
      bgColor: "bg-gradient-to-br from-teal-50 to-teal-100",
      borderColor: "border-teal-200",
      evolution: "100",
      evolutionLabel: "opérationnel"
    },
    {
      title: "Total Rappels",
      value: totalRappels.toString(),
      subtitle: "Programmés",
      icon: Calendar,
      color: "text-violet-600",
      bgColor: "bg-gradient-to-br from-violet-50 to-violet-100",
      borderColor: "border-violet-200",
      evolution: Math.round((rappelsAujourdhui / totalRappels) * 100).toString(),
      evolutionLabel: "aujourd'hui"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {metrics.map((metric, index) => (
        <Card key={index} className={`${metric.bgColor} ${metric.borderColor} border-2 hover:shadow-lg transition-all duration-300 hover:scale-105`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-700">
              {metric.title}
            </CardTitle>
            <metric.icon className={`h-5 w-5 ${metric.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metric.color} mb-1`}>
              {metric.value}
            </div>
            <p className="text-xs text-gray-600 mb-2">
              {metric.subtitle}
            </p>
            <div className="flex items-center text-xs">
              <div className={`px-2 py-1 rounded-full bg-white/70 ${metric.color} font-medium`}>
                {metric.evolution}
                {metric.evolution !== "En ligne" && metric.evolution !== "100" && 
                 !metric.evolutionLabel.includes("urgents") && 
                 !metric.evolutionLabel.includes("demandes") && "%"}
              </div>
              <span className="text-gray-500 ml-2">{metric.evolutionLabel}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdminMetricsCards;
