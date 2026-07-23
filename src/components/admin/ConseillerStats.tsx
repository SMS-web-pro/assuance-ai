
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Target, TrendingUp, Clock } from "lucide-react";

interface Conseiller {
  id: number;
  nom: string;
  email: string;
  telephone?: string;
  specialite?: string;
  statut: string;
  date_embauche?: string;
  competences?: string[];
  objectif_mensuel?: number;
  demandsactuelles?: number;
  created_at: string;
  updated_at: string;
}

interface ConseillerStatsProps {
  conseillers: Conseiller[];
}

const ConseillerStats = ({ conseillers }: ConseillerStatsProps) => {
  const totalConseillers = conseillers.length;
  const conseillersEnLigne = conseillers.filter(c => c.statut === "En ligne").length;
  const totalDemandes = conseillers.reduce((sum, c) => sum + (c.demandsactuelles || 0), 0);
  const moyenneDemandes = totalConseillers > 0 ? Math.round(totalDemandes / totalConseillers) : 0;

  const stats = [
    {
      title: "Total Conseillers",
      value: totalConseillers.toString(),
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Conseillers en ligne",
      value: conseillersEnLigne.toString(),
      icon: Clock,
      color: "text-green-600",
    },
    {
      title: "Demandes actives",
      value: totalDemandes.toString(),
      icon: Target,
      color: "text-orange-600",
    },
    {
      title: "Moyenne par conseiller",
      value: moyenneDemandes.toString(),
      icon: TrendingUp,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ConseillerStats;
