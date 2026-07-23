
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Phone, Mail, User, MessageSquare, CheckCircle, X, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const RemindersCalendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const { data: rappels = [], isLoading, refetch } = useQuery({
    queryKey: ['rappels-clients'],
    queryFn: async () => {
      console.log('Fetching rappels...');
      const { data, error } = await supabase
        .from('rappels_clients')
        .select(`
          *,
          demandes_assurance!inner(
            id,
            nom,
            prenom,
            email,
            telephone,
            type_assurance,
            statut
          )
        `)
        .order('date_rappel', { ascending: true });
      
      if (error) {
        console.error('Erreur lors du chargement des rappels:', error);
        throw error;
      }
      
      console.log('Rappels chargés:', data);
      return data;
    }
  });

  const updateRappelStatus = async (rappelId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('rappels_clients')
        .update({ statut: newStatus })
        .eq('id', rappelId);

      if (error) throw error;

      toast.success(`Rappel marqué comme ${newStatus}`);
      refetch();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du rappel:', error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "appel": return <Phone className="w-4 h-4" />;
      case "email": return <Mail className="w-4 h-4" />;
      case "rdv": return <User className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "planifie":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Planifié</Badge>;
      case "termine":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Terminé</Badge>;
      case "annule":
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Annulé</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const isUpcoming = (dateRappel: string) => {
    const rappelDate = new Date(dateRappel);
    const now = new Date();
    const diffHours = (rappelDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours > 0 && diffHours <= 24; // Prochaines 24h
  };

  const isOverdue = (dateRappel: string) => {
    const rappelDate = new Date(dateRappel);
    const now = new Date();
    return rappelDate < now;
  };

  // Séparer les rappels par statut
  const rappelsPlanifies = rappels.filter(r => r.statut === 'planifie');
  const rappelsUpcoming = rappelsPlanifies.filter(r => isUpcoming(r.date_rappel));
  const rappelsOverdue = rappelsPlanifies.filter(r => isOverdue(r.date_rappel));
  const rappelsReguliers = rappelsPlanifies.filter(r => !isUpcoming(r.date_rappel) && !isOverdue(r.date_rappel));

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Rappels programmés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Chargement des rappels...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Rappels programmés ({rappels.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rappels.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Aucun rappel programmé pour le moment
            </p>
          ) : (
            <div className="space-y-6">
              {/* Rappels en retard */}
              {rappelsOverdue.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 font-semibold text-red-600 mb-3">
                    <AlertCircle className="w-4 h-4" />
                    En retard ({rappelsOverdue.length})
                  </h3>
                  <div className="space-y-2">
                    {rappelsOverdue.map((rappel: any) => (
                      <Card key={rappel.id} className="border-red-200 bg-red-50 dark:bg-red-900/10">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {getTypeIcon(rappel.type_rappel)}
                                <span className="font-medium">{rappel.titre}</span>
                                {getStatusBadge(rappel.statut)}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                Client: {rappel.demandes_assurance?.nom} {rappel.demandes_assurance?.prenom}
                              </p>
                              <p className="text-sm text-red-600 font-medium">
                                <Clock className="w-3 h-3 inline mr-1" />
                                {format(new Date(rappel.date_rappel), "PPP à HH:mm", { locale: fr })}
                              </p>
                              {rappel.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {rappel.description}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1 ml-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateRappelStatus(rappel.id, 'termine')}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Terminé
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateRappelStatus(rappel.id, 'annule')}
                              >
                                <X className="w-3 h-3 mr-1" />
                                Annuler
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Rappels prochains (24h) */}
              {rappelsUpcoming.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 font-semibold text-orange-600 mb-3">
                    <Clock className="w-4 h-4" />
                    Prochaines 24h ({rappelsUpcoming.length})
                  </h3>
                  <div className="space-y-2">
                    {rappelsUpcoming.map((rappel: any) => (
                      <Card key={rappel.id} className="border-orange-200 bg-orange-50 dark:bg-orange-900/10">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {getTypeIcon(rappel.type_rappel)}
                                <span className="font-medium">{rappel.titre}</span>
                                {getStatusBadge(rappel.statut)}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                Client: {rappel.demandes_assurance?.nom} {rappel.demandes_assurance?.prenom}
                              </p>
                              <p className="text-sm text-orange-600 font-medium">
                                <Clock className="w-3 h-3 inline mr-1" />
                                {format(new Date(rappel.date_rappel), "PPP à HH:mm", { locale: fr })}
                              </p>
                              {rappel.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {rappel.description}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1 ml-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateRappelStatus(rappel.id, 'termine')}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Terminé
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateRappelStatus(rappel.id, 'annule')}
                              >
                                <X className="w-3 h-3 mr-1" />
                                Annuler
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Autres rappels planifiés */}
              {rappelsReguliers.length > 0 && (
                <div>
                  <h3 className="flex items-center gap-2 font-semibold text-blue-600 mb-3">
                    <Calendar className="w-4 h-4" />
                    Programmés ({rappelsReguliers.length})
                  </h3>
                  <div className="space-y-2">
                    {rappelsReguliers.map((rappel: any) => (
                      <Card key={rappel.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {getTypeIcon(rappel.type_rappel)}
                                <span className="font-medium">{rappel.titre}</span>
                                {getStatusBadge(rappel.statut)}
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                Client: {rappel.demandes_assurance?.nom} {rappel.demandes_assurance?.prenom}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                <Clock className="w-3 h-3 inline mr-1" />
                                {format(new Date(rappel.date_rappel), "PPP à HH:mm", { locale: fr })}
                              </p>
                              {rappel.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {rappel.description}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1 ml-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateRappelStatus(rappel.id, 'termine')}
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Terminé
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateRappelStatus(rappel.id, 'annule')}
                              >
                                <X className="w-3 h-3 mr-1" />
                                Annuler
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RemindersCalendar;
