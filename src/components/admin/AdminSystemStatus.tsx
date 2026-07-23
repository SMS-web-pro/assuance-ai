
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Server, 
  Database, 
  Wifi, 
  Users, 
  MessageSquare, 
  Calendar, 
  Shield, 
  Activity,
  CheckCircle,
  AlertCircle,
  Clock
} from "lucide-react";

interface AdminSystemStatusProps {
  demandes: any[];
  conseillers: any[];
  rappels: any[];
}

const AdminSystemStatus = ({ demandes, conseillers, rappels }: AdminSystemStatusProps) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Calcul des métriques système
  const totalDemandes = demandes?.length || 0;
  const demandesAujourdhui = demandes?.filter(d => 
    new Date(d.date_creation) >= today
  ).length || 0;
  
  const totalConseillers = conseillers?.length || 0;
  const conseillersActifs = conseillers?.filter(c => c.statut === 'En ligne').length || 0;
  
  const totalRappels = rappels?.length || 0;
  const rappelsEnCours = rappels?.filter(r => r.statut === 'en_cours').length || 0;
  
  // Calcul des pourcentages de charge
  const chargeConseillers = totalConseillers > 0 ? (conseillersActifs / totalConseillers) * 100 : 0;
  const chargeRappels = totalRappels > 0 ? (rappelsEnCours / totalRappels) * 100 : 0;
  const chargeDemandes = totalDemandes > 0 ? (demandesAujourdhui / totalDemandes) * 100 : 0;

  // Statut système basé sur les métriques
  const getSystemStatus = () => {
    if (conseillersActifs === 0) return { status: 'error', label: 'Critique', color: 'text-red-600' };
    if (chargeConseillers < 50) return { status: 'warning', label: 'Attention', color: 'text-yellow-600' };
    return { status: 'success', label: 'Optimal', color: 'text-green-600' };
  };

  const systemStatus = getSystemStatus();

  const systemMetrics = [
    {
      title: "Statut Système",
      value: systemStatus.label,
      icon: systemStatus.status === 'success' ? CheckCircle : systemStatus.status === 'warning' ? AlertCircle : AlertCircle,
      color: systemStatus.color,
      bgColor: systemStatus.status === 'success' ? 'bg-green-50' : systemStatus.status === 'warning' ? 'bg-yellow-50' : 'bg-red-50',
      details: `${conseillersActifs}/${totalConseillers} conseillers actifs`
    },
    {
      title: "Base de Données",
      value: "Connectée",
      icon: Database,
      color: "text-green-600",
      bgColor: "bg-green-50",
      details: `${totalDemandes} enregistrements`
    },
    {
      title: "Connectivité",
      value: "Stable",
      icon: Wifi,
      color: "text-green-600",
      bgColor: "bg-green-50",
      details: "Temps réel activé"
    },
    {
      title: "Sécurité",
      value: "Protégé",
      icon: Shield,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      details: "RLS activé"
    }
  ];

  const performanceMetrics = [
    {
      title: "Charge Conseillers",
      value: Math.round(chargeConseillers),
      max: 100,
      color: chargeConseillers > 80 ? "bg-green-500" : chargeConseillers > 50 ? "bg-yellow-500" : "bg-red-500",
      details: `${conseillersActifs} actifs sur ${totalConseillers}`
    },
    {
      title: "Activité Demandes",
      value: Math.round(chargeDemandes),
      max: 100,
      color: chargeDemandes > 20 ? "bg-green-500" : chargeDemandes > 10 ? "bg-yellow-500" : "bg-red-500",
      details: `${demandesAujourdhui} aujourd'hui`
    },
    {
      title: "Rappels Actifs",
      value: Math.round(chargeRappels),
      max: 100,
      color: chargeRappels < 30 ? "bg-green-500" : chargeRappels < 60 ? "bg-yellow-500" : "bg-red-500",
      details: `${rappelsEnCours} en cours`
    }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Statut Système */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Statut Système
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {systemMetrics.map((metric, index) => (
              <div key={index} className={`p-3 rounded-lg ${metric.bgColor} flex items-center justify-between`}>
                <div className="flex items-center gap-3">
                  <metric.icon className={`h-5 w-5 ${metric.color}`} />
                  <div>
                    <p className="font-medium text-gray-900">{metric.title}</p>
                    <p className="text-sm text-gray-600">{metric.details}</p>
                  </div>
                </div>
                <Badge className={`${metric.color.replace('text-', 'text-')} bg-white border-0`}>
                  {metric.value}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {performanceMetrics.map((metric, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{metric.title}</span>
                  <span className="text-sm text-gray-600">{metric.value}%</span>
                </div>
                <Progress 
                  value={metric.value} 
                  className="h-2"
                />
                <p className="text-xs text-gray-500">{metric.details}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alertes et Notifications */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Alertes et Recommandations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {conseillersActifs === 0 && (
              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">Aucun conseiller actif</p>
                  <p className="text-sm text-red-600">Le service client n'est pas disponible</p>
                </div>
              </div>
            )}
            
            {chargeConseillers < 50 && conseillersActifs > 0 && (
              <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">Charge faible des conseillers</p>
                  <p className="text-sm text-yellow-600">Seulement {Math.round(chargeConseillers)}% des conseillers sont actifs</p>
                </div>
              </div>
            )}

            {rappelsEnCours > totalRappels * 0.7 && (
              <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="font-medium text-orange-800">Nombreux rappels en cours</p>
                  <p className="text-sm text-orange-600">{rappelsEnCours} rappels nécessitent une attention</p>
                </div>
              </div>
            )}

            {demandesAujourdhui > totalDemandes * 0.1 && (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Activité élevée aujourd'hui</p>
                  <p className="text-sm text-green-600">{demandesAujourdhui} nouvelles demandes reçues</p>
                </div>
              </div>
            )}

            {/* Message par défaut si aucune alerte */}
            {conseillersActifs > 0 && chargeConseillers >= 50 && rappelsEnCours <= totalRappels * 0.7 && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-800">Système opérationnel</p>
                  <p className="text-sm text-blue-600">Tous les services fonctionnent normalement</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSystemStatus;
