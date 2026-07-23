
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ClipboardList, Plus, Calendar, User, Flag } from "lucide-react";
import { ConseillerLayout } from "@/components/ConseillerLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Tache {
  id: string;
  titre: string;
  description: string;
  priorite: string;
  echeance: string;
  client: string;
  statut: string;
  termine: boolean;
  type_assurance: string;
  date_creation: string;
}

const ConseilleurTaches = () => {
  const [taches, setTaches] = useState<Tache[]>([]);
  const [loading, setLoading] = useState(true);
  const [conseillerNom, setConseillerNom] = useState<string>("");

  useEffect(() => {
    const sessionData = localStorage.getItem('conseiller_session');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      setConseillerNom(session.nom);
      fetchTaches(session.nom);
    }
  }, []);

  const fetchTaches = async (nomConseiller: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('demandes_assurance')
        .select('*')
        .eq('conseiller_assigne', nomConseiller)
        .order('date_creation', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des tâches:', error);
        toast.error('Erreur lors du chargement des tâches');
        return;
      }

      // Transformer les demandes en tâches
      const tachesGeneres: Tache[] = (data || []).map(demande => ({
        id: demande.id,
        titre: `Traiter la demande de ${demande.nom} ${demande.prenom}`,
        description: `Finaliser la demande d'assurance ${demande.type_assurance}`,
        priorite: demande.priorite || 'normale',
        echeance: new Date(demande.date_creation).toLocaleDateString('fr-FR'),
        client: `${demande.nom} ${demande.prenom}`,
        statut: demande.statut,
        termine: demande.statut === 'termine',
        type_assurance: demande.type_assurance,
        date_creation: demande.date_creation
      }));

      setTaches(tachesGeneres);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des tâches');
    } finally {
      setLoading(false);
    }
  };

  const getPrioriteBadge = (priorite: string) => {
    switch (priorite) {
      case "haute":
      case "urgent":
        return <Badge variant="destructive" className="flex items-center gap-1">
          <Flag className="w-3 h-3" />
          Haute
        </Badge>;
      case "normale":
        return <Badge variant="outline" className="flex items-center gap-1">
          <Flag className="w-3 h-3" />
          Normale
        </Badge>;
      case "basse":
        return <Badge className="bg-gray-100 text-gray-600 flex items-center gap-1">
          <Flag className="w-3 h-3" />
          Basse
        </Badge>;
      default:
        return <Badge className="flex items-center gap-1">
          <Flag className="w-3 h-3" />
          {priorite}
        </Badge>;
    }
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "nouveau":
        return <Badge className="bg-red-100 text-red-800">Urgent</Badge>;
      case "en cours":
        return <Badge className="bg-orange-100 text-orange-800">En cours</Badge>;
      case "termine":
        return <Badge className="bg-green-100 text-green-800">Terminé</Badge>;
      default:
        return <Badge>{statut}</Badge>;
    }
  };

  const tachesEnCours = taches.filter(t => !t.termine);
  const tachesTerminees = taches.filter(t => t.termine);

  // Statistiques pour les cartes résumé
  const tachesUrgentes = tachesEnCours.filter(t => t.statut === 'nouveau').length;
  const tachesEnCoursCount = tachesEnCours.filter(t => t.statut === 'en cours').length;
  const tachesAFaire = tachesEnCours.length;
  const tachesTermineesCount = tachesTerminees.length;

  if (loading) {
    return (
      <ConseillerLayout title="Mes Tâches">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Chargement des tâches...</div>
        </div>
      </ConseillerLayout>
    );
  }

  return (
    <ConseillerLayout title="Mes Tâches">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Mes Tâches</h1>
            <p className="text-gray-600">{tachesAFaire} tâche(s) à traiter</p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Tâche
          </Button>
        </div>

        {/* Résumé des tâches */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-700">{tachesUrgentes}</div>
                <p className="text-sm text-red-600">Urgentes</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-700">{tachesEnCoursCount}</div>
                <p className="text-sm text-orange-600">En cours</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-700">{tachesAFaire}</div>
                <p className="text-sm text-blue-600">À faire</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">{tachesTermineesCount}</div>
                <p className="text-sm text-green-600">Terminées</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tâches en cours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Tâches en cours ({tachesEnCours.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {tachesEnCours.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Aucune tâche en cours</p>
            ) : (
              tachesEnCours.map((tache) => (
                <div
                  key={tache.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Checkbox className="mt-1" />
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium">{tache.titre}</h3>
                        <p className="text-sm text-gray-600 mt-1">{tache.description}</p>
                      </div>
                      <div className="flex gap-2">
                        {getPrioriteBadge(tache.priorite)}
                        {getStatutBadge(tache.statut)}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {tache.client}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {tache.echeance}
                      </span>
                    </div>
                    
                    <div className="flex gap-2 mt-3">
                      <Button size="sm">
                        Commencer
                      </Button>
                      <Button size="sm" variant="outline">
                        Reporter
                      </Button>
                      <Button size="sm" variant="outline">
                        Modifier
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Tâches terminées */}
        {tachesTerminees.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-700">
                <ClipboardList className="w-5 h-5" />
                Tâches terminées ({tachesTerminees.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tachesTerminees.map((tache) => (
                <div
                  key={tache.id}
                  className="flex items-start gap-4 p-4 border rounded-lg bg-green-50 border-green-200"
                >
                  <Checkbox checked className="mt-1" />
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium line-through text-gray-600">{tache.titre}</h3>
                        <p className="text-sm text-gray-500 mt-1">{tache.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {tache.client}
                      </span>
                      <span className="text-green-600 font-medium">✓ Terminé</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </ConseillerLayout>
  );
};

export default ConseilleurTaches;
