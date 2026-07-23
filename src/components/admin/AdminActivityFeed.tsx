
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, MessageSquare, Phone, CheckCircle, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface AdminActivityFeedProps {
  demandes: any[];
  rappels: any[];
}

const AdminActivityFeed = ({ demandes, rappels }: AdminActivityFeedProps) => {
  // Créer un flux d'activité combiné
  const activities = [];

  // Ajouter les demandes récentes
  demandes?.slice(0, 10).forEach(demande => {
    activities.push({
      id: `demande-${demande.id}`,
      type: 'demande',
      title: `Nouvelle demande ${demande.type_assurance}`,
      description: `${demande.nom} ${demande.prenom} - ${demande.email}`,
      status: demande.statut,
      date: new Date(demande.date_creation),
      conseiller: demande.conseiller_assigne,
      priority: demande.priorite
    });
  });

  // Ajouter les rappels récents
  rappels?.slice(0, 10).forEach(rappel => {
    activities.push({
      id: `rappel-${rappel.id}`,
      type: 'rappel',
      title: rappel.titre,
      description: rappel.description,
      status: rappel.statut,
      date: new Date(rappel.date_rappel),
      conseiller: rappel.created_by,
      priority: new Date(rappel.date_rappel) < new Date() ? 'haute' : 'normale'
    });
  });

  // Trier par date décroissante
  activities.sort((a, b) => b.date.getTime() - a.date.getTime());

  const getStatusColor = (status: string, type: string) => {
    if (type === 'demande') {
      switch (status) {
        case 'nouveau': return 'bg-red-100 text-red-800';
        case 'en_cours': return 'bg-yellow-100 text-yellow-800';
        case 'traite': return 'bg-blue-100 text-blue-800';
        case 'termine': return 'bg-green-100 text-green-800';
        case 'valide': return 'bg-emerald-100 text-emerald-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    } else {
      switch (status) {
        case 'planifie': return 'bg-blue-100 text-blue-800';
        case 'en_cours': return 'bg-yellow-100 text-yellow-800';
        case 'termine': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    }
  };

  const getStatusLabel = (status: string, type: string) => {
    if (type === 'demande') {
      switch (status) {
        case 'nouveau': return 'Nouveau';
        case 'en_cours': return 'En cours';
        case 'traite': return 'Traité';
        case 'termine': return 'Terminé';
        case 'valide': return 'Validé';
        default: return status;
      }
    } else {
      switch (status) {
        case 'planifie': return 'Planifié';
        case 'en_cours': return 'En cours';
        case 'termine': return 'Terminé';
        default: return status;
      }
    }
  };

  const getIcon = (type: string, priority: string) => {
    if (type === 'demande') {
      return priority === 'haute' ? AlertTriangle : MessageSquare;
    } else {
      return priority === 'haute' ? AlertTriangle : Phone;
    }
  };

  const getIconColor = (type: string, priority: string) => {
    if (priority === 'haute') return 'text-red-500';
    return type === 'demande' ? 'text-blue-500' : 'text-green-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Activité Récente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {activities.slice(0, 15).map((activity) => {
            const Icon = getIcon(activity.type, activity.priority);
            return (
              <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className={`p-2 rounded-full bg-white shadow-sm`}>
                  <Icon className={`h-4 w-4 ${getIconColor(activity.type, activity.priority)}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-600 mb-2">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {format(activity.date, 'dd/MM/yyyy à HH:mm', { locale: fr })}
                        {activity.conseiller && (
                          <>
                            <span>•</span>
                            <User className="h-3 w-3" />
                            {activity.conseiller}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge className={`text-xs ${getStatusColor(activity.status, activity.type)}`}>
                        {getStatusLabel(activity.status, activity.type)}
                      </Badge>
                      {activity.priority === 'haute' && (
                        <Badge variant="destructive" className="text-xs">
                          Urgent
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {activities.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucune activité récente</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminActivityFeed;
