import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Bell, Settings, Mail, MessageSquare, Calendar, User } from "lucide-react";
import { ConseillerLayout } from "@/components/ConseillerLayout";

const ConseilleurNotifications = () => {
  const notifications = [
    {
      id: 1,
      type: "message",
      titre: "Nouveau message de Pierre Martin",
      description: "Question sur le devis d'assurance habitation",
      heure: "Il y a 10 min",
      lu: false
    },
    {
      id: 2,
      type: "rdv",
      titre: "Rappel: RDV avec Marie Dubois",
      description: "Rendez-vous dans 30 minutes",
      heure: "Il y a 20 min",
      lu: false
    },
    {
      id: 3,
      type: "demande",
      titre: "Nouvelle demande assignée",
      description: "Assurance auto - Sophie Bernard",
      heure: "Il y a 1h",
      lu: true
    },
    {
      id: 4,
      type: "systeme",
      titre: "Objectif mensuel atteint à 48%",
      description: "Vous progressez bien vers votre objectif",
      heure: "Il y a 2h",
      lu: true
    }
  ];

  const parametresNotifications = [
    {
      categorie: "Messages clients",
      description: "Notifications pour les nouveaux messages",
      email: true,
      push: true,
      son: true
    },
    {
      categorie: "Rendez-vous",
      description: "Rappels et confirmations de RDV",
      email: true,
      push: true,
      son: false
    },
    {
      categorie: "Nouvelles demandes",
      description: "Attribution de nouvelles demandes",
      email: true,
      push: false,
      son: false
    },
    {
      categorie: "Objectifs et performance",
      description: "Suivi des objectifs et statistiques",
      email: false,
      push: true,
      son: false
    },
    {
      categorie: "Rappels tâches",
      description: "Notifications pour les tâches à effectuer",
      email: true,
      push: true,
      son: true
    }
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case "rdv":
        return <Calendar className="w-4 h-4 text-green-600" />;
      case "demande":
        return <User className="w-4 h-4 text-orange-600" />;
      case "systeme":
        return <Settings className="w-4 h-4 text-purple-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "message":
        return <Badge className="bg-blue-100 text-blue-800">Message</Badge>;
      case "rdv":
        return <Badge className="bg-green-100 text-green-800">RDV</Badge>;
      case "demande":
        return <Badge className="bg-orange-100 text-orange-800">Demande</Badge>;
      case "systeme":
        return <Badge className="bg-purple-100 text-purple-800">Système</Badge>;
      default:
        return <Badge>Autre</Badge>;
    }
  };

  return (
    <ConseillerLayout title="Notifications">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Tout marquer comme lu
          </Button>
        </div>

        {/* Notifications récentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications Récentes
              <Badge className="bg-red-100 text-red-800 ml-2">
                {notifications.filter(n => !n.lu).length} non lues
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-4 p-4 border rounded-lg transition-colors ${
                  !notification.lu
                    ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="mt-1">
                  {getTypeIcon(notification.type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className={`font-medium ${!notification.lu ? 'text-blue-900' : ''}`}>
                      {notification.titre}
                    </h3>
                    <div className="flex items-center gap-2">
                      {getTypeBadge(notification.type)}
                      {!notification.lu && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{notification.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{notification.heure}</span>
                    <div className="flex gap-2">
                      {!notification.lu && (
                        <Button size="sm" variant="outline">
                          Marquer comme lu
                        </Button>
                      )}
                      <Button size="sm">
                        Voir
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Paramètres de notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Paramètres de Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {parametresNotifications.map((param, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-start justif y-between mb-3">
                  <div>
                    <h3 className="font-medium">{param.categorie}</h3>
                    <p className="text-sm text-gray-600">{param.description}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-600" />
                      <span className="text-sm">Email</span>
                    </div>
                    <Switch checked={param.email} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-gray-600" />
                      <span className="text-sm">Push</span>
                    </div>
                    <Switch checked={param.push} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-gray-600" />
                      <span className="text-sm">Son</span>
                    </div>
                    <Switch checked={param.son} />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Heures de notification */}
        <Card>
          <CardHeader>
            <CardTitle>Heures de Notification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Ne pas déranger</h3>
                  <p className="text-sm text-gray-600">
                    Suspendre les notifications pendant certaines heures
                  </p>
                </div>
                <Switch />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block mb-1 font-medium">Début</label>
                  <input
                    type="time"
                    className="w-full p-2 border rounded-md"
                    defaultValue="20:00"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium">Fin</label>
                  <input
                    type="time"
                    className="w-full p-2 border rounded-md"
                    defaultValue="08:00"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ConseillerLayout>
  );
};

export default ConseilleurNotifications;
