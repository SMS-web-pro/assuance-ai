import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, MessageSquare, Calendar, Users, FileText, Clock, AlertCircle, CheckCircle, ArrowRight, Target, TrendingUp, HelpCircle, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ConseillerLayout } from "@/components/ConseillerLayout";
import { NotificationPermissionButton } from "@/components/NotificationPermissionButton";

interface ConseillerSession {
  id: number;
  nom: string;
  email: string;
  specialite?: string;
  auth_user_id?: string;
}

interface ConseillerData {
  id: number;
  nom: string;
  email: string;
  specialite?: string;
  objectif_mensuel?: number;
  demandsactuelles?: number;
  statut: string;
}

interface DemandeData {
  id: string;
  nom: string;
  prenom: string;
  type_assurance: string;
  statut: string;
  priorite: string;
  date_creation: string;
  date_modification: string;
  conseiller_assigne: string;
}

interface RappelData {
  id: string;
  titre: string;
  description: string;
  date_rappel: string;
  type_rappel: string;
  statut: string;
}

interface NotificationData {
  id: string;
  type: 'demande' | 'rappel' | 'message';
  titre: string;
  description: string;
  timestamp: string;
  priority: 'normal' | 'urgent';
  read: boolean;
}

interface ObjectifsData {
  objectif_mensuel: number;
  demandes_totales: number;
  demandes_terminees: number;
  demandes_en_cours: number;
  demandes_nouvelles: number;
  taux_conversion: number;
}

const ConseillerDashboard = () => {
  const [conseillerSession, setConseillerSession] = useState<ConseillerSession | null>(null);
  const [conseillerData, setConseillerData] = useState<ConseillerData | null>(null);
  const [objectifsData, setObjectifsData] = useState<ObjectifsData | null>(null);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [activiteRecente, setActiviteRecente] = useState<DemandeData[]>([]);
  const [rappelsAujourdhui, setRappelsAujourdhui] = useState<RappelData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérifier la session
    const sessionData = localStorage.getItem('conseiller_session');
    if (!sessionData) {
      window.location.href = "/conseiller";
      return;
    }

    try {
      const session = JSON.parse(sessionData);
      setConseillerSession(session);
      loadDashboardData(session.nom);
      
      // Configuration des mises à jour en temps réel
      setupRealtimeUpdates(session.nom);
    } catch (error) {
      console.error('Erreur de session:', error);
      window.location.href = "/conseiller";
    }
  }, []);

  // Nouveau : Configuration des mises à jour en temps réel pour le dashboard
  const setupRealtimeUpdates = (conseillerNom: string) => {
    const channel = supabase
      .channel('dashboard_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'demandes_assurance',
          filter: `conseiller_assigne=eq.${conseillerNom}`
        },
        (payload) => {
          console.log('🔄 Dashboard - Mise à jour en temps réel:', payload);
          // Recharger les données du dashboard
          loadDashboardData(conseillerNom);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // Actualisation automatique toutes les 30 secondes
  useEffect(() => {
    if (conseillerSession) {
      const interval = setInterval(() => {
        console.log('🔄 Dashboard - Actualisation automatique programmée');
        loadDashboardData(conseillerSession.nom);
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [conseillerSession]);

  const loadObjectifsData = async (conseillerNom: string) => {
    try {
      console.log('📊 Dashboard - Chargement des objectifs pour:', conseillerNom);
      
      // Charger les données du conseiller pour l'objectif mensuel
      const { data: conseillerInfo, error: conseillerError } = await supabase
        .from('conseillers')
        .select('objectif_mensuel')
        .eq('nom', conseillerNom)
        .single();

      if (conseillerError) {
        console.error('Erreur conseiller objectifs:', conseillerError);
        return;
      }

      // Calculer les dates pour le mois en cours
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      // Charger toutes les demandes du conseiller pour le mois en cours
      const { data: demandes, error: demandesError } = await supabase
        .from('demandes_assurance')
        .select('statut, date_creation')
        .eq('conseiller_assigne', conseillerNom)
        .gte('date_creation', startOfMonth.toISOString())
        .lte('date_creation', endOfMonth.toISOString());

      if (demandesError) {
        console.error('Erreur demandes objectifs:', demandesError);
        return;
      }

      const demandes_totales = demandes?.length || 0;
      
      // CLARIFICATION DES STATUTS harmonisés avec les autres pages :
      // - "nouveau" = Demandes pas encore prises en charge
      // - "en_cours" = Demandes en cours de traitement (contact établi)
      // - "traite" = Demandes traitées mais pas encore finalisées
      // - "termine" = Demandes finalisées avec succès (vente réalisée, contrat signé)
      
      const demandes_nouvelles = demandes?.filter(d => d.statut === 'nouveau').length || 0;
      const demandes_en_cours = demandes?.filter(d => d.statut === 'en_cours').length || 0;
      const demandes_traitees = demandes?.filter(d => d.statut === 'traite').length || 0;
      const demandes_terminees = demandes?.filter(d => d.statut === 'termine').length || 0;
      
      // TAUX DE CONVERSION = (Demandes terminées avec succès ÷ Total des demandes) × 100
      const taux_conversion = demandes_totales > 0 ? (demandes_terminees / demandes_totales) * 100 : 0;

      setObjectifsData({
        objectif_mensuel: conseillerInfo?.objectif_mensuel || 0,
        demandes_totales,
        demandes_terminees,
        demandes_en_cours,
        demandes_nouvelles,
        taux_conversion
      });

      console.log('📊 Dashboard - Calculs harmonisés mis à jour:', {
        demandes_totales,
        demandes_nouvelles: `${demandes_nouvelles} (nouveau)`,
        demandes_en_cours: `${demandes_en_cours} (en_cours)`, 
        demandes_traitees: `${demandes_traitees} (traite)`,
        demandes_terminees: `${demandes_terminees} (termine - succès commercial)`,
        taux_conversion: `${taux_conversion.toFixed(1)}% (termine/total)`
      });

    } catch (error) {
      console.error('Erreur lors du chargement des objectifs:', error);
    }
  };

  const loadDashboardData = async (conseillerNom: string) => {
    try {
      setLoading(true);
      console.log('🔄 Dashboard - Rechargement complet des données');

      // Charger les données des objectifs
      await loadObjectifsData(conseillerNom);

      // Charger les données du conseiller pour les objectifs
      const { data: conseillerInfo, error: conseillerError } = await supabase
        .from('conseillers')
        .select('*')
        .eq('nom', conseillerNom)
        .single();

      if (conseillerError) {
        console.error('Erreur conseiller:', conseillerError);
      } else {
        setConseillerData(conseillerInfo);
      }

      // Charger les demandes assignées récemment modifiées
      const { data: demandes, error: demandesError } = await supabase
        .from('demandes_assurance')
        .select('*')
        .eq('conseiller_assigne', conseillerNom)
        .order('date_modification', { ascending: false })
        .limit(10);

      if (demandesError) {
        console.error('Erreur demandes:', demandesError);
        toast.error('Erreur lors du chargement des demandes');
      } else {
        setActiviteRecente(demandes || []);
      }

      // Charger les rappels d'aujourd'hui
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      const { data: rappels, error: rappelsError } = await supabase
        .from('rappels_clients')
        .select(`
          *,
          demandes_assurance (nom, prenom, type_assurance)
        `)
        .gte('date_rappel', startOfDay.toISOString())
        .lt('date_rappel', endOfDay.toISOString())
        .eq('statut', 'planifie')
        .order('date_rappel', { ascending: true });

      if (rappelsError) {
        console.error('Erreur rappels:', rappelsError);
      } else {
        setRappelsAujourdhui(rappels || []);
      }

      // Générer des notifications basées sur les données
      generateNotifications(demandes || [], rappels || []);

    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const generateNotifications = (demandes: DemandeData[], rappels: RappelData[]) => {
    const newNotifications: NotificationData[] = [];

    // Notifications pour nouvelles demandes (dernières 24h)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    demandes
      .filter(d => new Date(d.date_modification) > yesterday)
      .forEach(demande => {
        newNotifications.push({
          id: `demande-${demande.id}`,
          type: 'demande',
          titre: `${demande.statut === 'nouveau' ? 'Nouvelle demande' : 'Demande mise à jour'}`,
          description: `${demande.prenom} ${demande.nom} - ${demande.type_assurance}`,
          timestamp: demande.date_modification,
          priority: demande.priorite === 'haute' || demande.priorite === 'urgent' ? 'urgent' : 'normal',
          read: false
        });
      });

    // Notifications pour rappels urgents (dans les 2 prochaines heures)
    const inTwoHours = new Date(Date.now() + 2 * 60 * 60 * 1000);
    rappels
      .filter(r => new Date(r.date_rappel) <= inTwoHours)
      .forEach(rappel => {
        newNotifications.push({
          id: `rappel-${rappel.id}`,
          type: 'rappel',
          titre: 'Rappel imminent',
          description: rappel.titre,
          timestamp: rappel.date_rappel,
          priority: 'urgent',
          read: false
        });
      });

    // Trier par timestamp décroissant
    newNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setNotifications(newNotifications.slice(0, 8)); // Limiter à 8 notifications
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "nouveau":
        return <Badge className="bg-blue-100 text-blue-800">Nouveau</Badge>;
      case "en_cours":
        return <Badge className="bg-orange-100 text-orange-800">En cours</Badge>;
      case "traite":
        return <Badge className="bg-green-100 text-green-800">Traité</Badge>;
      case "termine":
        return <Badge className="bg-purple-100 text-purple-800">Terminé</Badge>;
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const getPriorityIcon = (priority: string) => {
    return priority === 'urgent' ? (
      <AlertCircle className="h-4 w-4 text-red-500" />
    ) : (
      <Bell className="h-4 w-4 text-blue-500" />
    );
  };

  const getNotificationTypeIcon = (type: string) => {
    switch (type) {
      case 'demande':
        return <FileText className="h-4 w-4" />;
      case 'rappel':
        return <Clock className="h-4 w-4" />;
      case 'message':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const calculateObjectiveProgress = () => {
    if (!objectifsData?.objectif_mensuel || objectifsData.objectif_mensuel === 0) {
      return 0;
    }
    const progress = (objectifsData.demandes_totales / objectifsData.objectif_mensuel) * 100;
    return Math.min(progress, 100);
  };

  if (!conseillerSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Chargement...</div>
      </div>
    );
  }

  if (loading) {
    return (
      <ConseillerLayout title="Tableau de bord">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Chargement des données...</div>
        </div>
      </ConseillerLayout>
    );
  }

  return (
    <ConseillerLayout title="Tableau de bord">
      <div className="space-y-6">
        {/* Header avec bouton de notifications et actualisation */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Bonjour, {conseillerSession.nom}</h1>
            <p className="text-gray-600">Votre activité en temps réel - Dernière mise à jour : {new Date().toLocaleTimeString('fr-FR')}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => loadDashboardData(conseillerSession.nom)} 
              variant="outline" 
              size="sm"
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              🔄 Actualiser maintenant
            </Button>
            <NotificationPermissionButton 
              userType="conseiller"
              conseillerNom={conseillerSession.nom}
            />
          </div>
        </div>

        {/* Explication des indicateurs - NOUVEAU */}
        <Card className="border-l-4 border-l-blue-500 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Info className="h-5 w-5" />
              📊 Comprendre vos indicateurs
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div><strong className="text-gray-600">Nouvelles :</strong> Demandes pas encore prises en charge</div>
                <div><strong className="text-orange-600">En cours :</strong> Demandes en cours de traitement (contact établi, négociation...)</div>
                <div><strong className="text-green-600">Traitées :</strong> Demandes traitées mais pas encore finalisées</div>
                <div><strong className="text-purple-600">Terminées :</strong> Demandes finalisées avec succès (contrat signé, vente réalisée)</div>
              </div>
              <div className="space-y-2">
                <div><strong className="text-blue-600">Taux de conversion :</strong> (Terminées ÷ Total) × 100</div>
                <div className="text-xs text-gray-500">→ Mesure votre efficacité commerciale finale</div>
                <div className="text-xs text-green-600 font-medium">✅ Synchronisé en temps réel avec la page Demandes</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Objectifs assignés avec vraies données et clarifications */}
        {objectifsData && (
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                Mes Objectifs - {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Statistiques principales avec clarifications améliorées */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">Objectif mensuel</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {objectifsData.objectif_mensuel}
                    </p>
                    <p className="text-xs text-purple-600">À atteindre</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">Total reçues</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {objectifsData.demandes_totales}
                    </p>
                    <p className="text-xs text-blue-600">Ce mois-ci</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">Traitées+</p>
                    <p className="text-2xl font-bold text-green-600">
                      {(objectifsData.demandes_en_cours || 0) + (objectifsData.demandes_terminees || 0)}
                    </p>
                    <p className="text-xs text-green-600">Prises en charge</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">Conversion</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {objectifsData.taux_conversion.toFixed(1)}%
                    </p>
                    <p className="text-xs text-purple-600">Succès final</p>
                  </div>
                </div>

                {/* Répartition détaillée par statut */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <p className="text-sm text-gray-600 font-medium">Nouvelles</p>
                    </div>
                    <p className="text-xl font-semibold text-gray-700">{objectifsData.demandes_nouvelles}</p>
                    <p className="text-xs text-gray-500">À traiter</p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <MessageSquare className="h-4 w-4 text-orange-500" />
                      <p className="text-sm text-orange-600 font-medium">En cours</p>
                    </div>
                    <p className="text-xl font-semibold text-orange-700">{objectifsData.demandes_en_cours}</p>
                    <p className="text-xs text-orange-500">En négociation</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <p className="text-sm text-green-600 font-medium">Traitées</p>
                    </div>
                    <p className="text-xl font-semibold text-green-700">{objectifsData.demandes_terminees}</p>
                    <p className="text-xs text-green-500">Finalisées</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <TrendingUp className="h-4 w-4 text-blue-500" />
                      <p className="text-sm text-blue-600 font-medium">Efficacité</p>
                    </div>
                    <p className="text-xl font-semibold text-blue-700">{objectifsData.taux_conversion.toFixed(1)}%</p>
                    <p className="text-xs text-blue-500">Commercial</p>
                  </div>
                </div>
                
                {/* Barre de progression */}
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${calculateObjectiveProgress()}%` }}
                  ></div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {calculateObjectiveProgress().toFixed(1)}% de l'objectif atteint
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-purple-600">
                      {(objectifsData.demandes_en_cours || 0) + (objectifsData.demandes_terminees || 0)} traitées sur {objectifsData.demandes_totales}
                    </span>
                    <span className="text-gray-600">
                      {Math.max(0, objectifsData.objectif_mensuel - objectifsData.demandes_totales)} demandes restantes
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notifications en temps réel */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-blue-600" />
              Notifications en temps réel
              {notifications.length > 0 && (
                <Badge className="bg-red-100 text-red-800 ml-2">
                  {notifications.filter(n => !n.read).length} nouvelles
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-400" />
                  <p>Aucune nouvelle notification</p>
                  <p className="text-sm">Tout est à jour !</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-3 p-4 border rounded-lg transition-all hover:shadow-md ${
                      !notification.read ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getPriorityIcon(notification.priority)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className={`font-medium text-sm ${!notification.read ? 'text-blue-900' : 'text-gray-900'}`}>
                            {notification.titre}
                          </p>
                          <p className="text-gray-600 text-sm mt-1">{notification.description}</p>
                          <p className="text-xs text-gray-500 mt-2">{formatDate(notification.timestamp)}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {getNotificationTypeIcon(notification.type)}
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions rapides */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-600" />
              Actions rapides
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                className="flex items-center justify-between p-4 h-auto bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                onClick={() => window.location.href = '/conseiller-dashboard/demandes'}
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">Mes Demandes</div>
                    <div className="text-xs opacity-90">Gérer les dossiers</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline" 
                className="flex items-center justify-between p-4 h-auto border-green-200 hover:bg-green-50"
                onClick={() => window.location.href = '/conseiller-dashboard/calendrier'}
              >
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-green-600" />
                  <div className="text-left">
                    <div className="font-medium">Calendrier</div>
                    <div className="text-xs text-gray-600">Rendez-vous</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Button>
              
              <Button 
                variant="outline" 
                className="flex items-center justify-between p-4 h-auto border-orange-200 hover:bg-orange-50"
                onClick={() => window.location.href = '/conseiller-dashboard/clients'}
              >
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-orange-600" />
                  <div className="text-left">
                    <div className="font-medium">Mes Clients</div>
                    <div className="text-xs text-gray-600">Contacts</div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activité récente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-600" />
                Activité récente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {activiteRecente.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Aucune activité récente</p>
                ) : (
                  activiteRecente.slice(0, 8).map((demande) => (
                    <div key={demande.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {demande.prenom} {demande.nom}
                        </p>
                        <p className="text-xs text-gray-600">{demande.type_assurance}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {getStatutBadge(demande.statut)}
                        <span className="text-xs text-gray-500">{formatTime(demande.date_modification)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Rappels d'aujourd'hui */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Rappels d'aujourd'hui
                {rappelsAujourdhui.length > 0 && (
                  <Badge className="bg-red-100 text-red-800 ml-2">
                    {rappelsAujourdhui.length}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {rappelsAujourdhui.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-400" />
                    <p>Aucun rappel prévu</p>
                    <p className="text-sm">Journée tranquille !</p>
                  </div>
                ) : (
                  rappelsAujourdhui.map((rappel) => (
                    <div key={rappel.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <Clock className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{rappel.titre}</p>
                        <p className="text-xs text-gray-600 mt-1">{rappel.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {rappel.type_rappel}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {formatTime(rappel.date_rappel)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ConseillerLayout>
  );
};

export default ConseillerDashboard;
