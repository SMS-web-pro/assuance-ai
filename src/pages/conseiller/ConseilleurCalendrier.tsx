import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, Phone, Plus, Mail, Bell } from "lucide-react";
import { ConseillerLayout } from "@/components/ConseillerLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import CreateRdvModal from "@/components/conseiller/CreateRdvModal";
import EditRdvModal from "@/components/conseiller/EditRdvModal";
import EmailReminderModal from "@/components/conseiller/EmailReminderModal";
import { CalendarView } from "@/components/conseiller/CalendarView";

interface RendezVous {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  email?: string;
  type_assurance: string;
  statut: string;
  date_creation: string;
  date_contact?: string;
  priorite: string;
  notes_conseiller?: string;
  donnees_specifiques?: any;
}

const ConseilleurCalendrier = () => {
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [loading, setLoading] = useState(true);
  const [conseillerNom, setConseillerNom] = useState<string>("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEmailReminderModalOpen, setIsEmailReminderModalOpen] = useState(false);
  const [selectedRdv, setSelectedRdv] = useState<RendezVous | null>(null);

  useEffect(() => {
    const sessionData = localStorage.getItem('conseiller_session');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      setConseillerNom(session.nom);
      fetchRendezVous(session.nom);
    }
  }, []);

  const fetchRendezVous = async (nomConseiller: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('demandes_assurance')
        .select('*')
        .eq('conseiller_assigne', nomConseiller)
        .in('statut', ['nouveau', 'en cours', 'termine'])
        .order('date_contact', { ascending: true });

      if (error) {
        console.error('Erreur lors de la récupération des rendez-vous:', error);
        toast.error('Erreur lors du chargement du calendrier');
        return;
      }

      setRendezVous(data || []);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement du calendrier');
    } finally {
      setLoading(false);
    }
  };

  const handleRdvCreated = () => {
    if (conseillerNom) {
      fetchRendezVous(conseillerNom);
    }
  };

  const handleRdvUpdated = () => {
    if (conseillerNom) {
      fetchRendezVous(conseillerNom);
    }
  };

  const handleEditRdv = (rdv: RendezVous) => {
    setSelectedRdv(rdv);
    setIsEditModalOpen(true);
  };

  const handleContactClient = (rdv: RendezVous) => {
    setSelectedRdv(rdv);
    setIsEmailReminderModalOpen(true);
  };

  const handleCallClient = (rdv: RendezVous) => {
    if (rdv.telephone) {
      // Ouvrir l'application de téléphone ou copier le numéro
      if (navigator.clipboard) {
        navigator.clipboard.writeText(rdv.telephone);
        toast.success('Numéro de téléphone copié dans le presse-papiers');
      }
      // Tentative d'ouverture de l'application téléphone
      window.location.href = `tel:${rdv.telephone}`;
    } else {
      toast.error('Aucun numéro de téléphone disponible');
    }
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "nouveau":
        return <Badge className="bg-orange-100 text-orange-800">À contacter</Badge>;
      case "en cours":
        return <Badge className="bg-green-100 text-green-800">En cours</Badge>;
      case "termine":
        return <Badge className="bg-blue-100 text-blue-800">Terminé</Badge>;
      case "annule":
        return <Badge className="bg-red-100 text-red-800">Annulé</Badge>;
      default:
        return <Badge>{statut}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getHeureFromDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const isToday = (dateString: string) => {
    const today = new Date();
    const date = new Date(dateString);
    return today.toDateString() === date.toDateString();
  };

  const prochainRdv = rendezVous
    .filter(rdv => rdv.statut === 'nouveau' && new Date(rdv.date_contact || rdv.date_creation) >= new Date())
    .sort((a, b) => new Date(a.date_contact || a.date_creation).getTime() - new Date(b.date_contact || b.date_creation).getTime())[0];

  const rdvAujourdhui = rendezVous.filter(rdv => isToday(rdv.date_contact || rdv.date_creation));

  if (loading) {
    return (
      <ConseillerLayout title="Calendrier">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Chargement du calendrier...</div>
        </div>
      </ConseillerLayout>
    );
  }

  return (
    <ConseillerLayout title="Calendrier">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Calendrier des Rendez-vous</h1>
            <p className="text-gray-600">
              {rendezVous.length} rendez-vous • {rdvAujourdhui.length} aujourd'hui
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => {
                // Rafraîchir les données
                if (conseillerNom) {
                  fetchRendezVous(conseillerNom);
                }
              }}
            >
              <Bell className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouveau RDV
            </Button>
          </div>
        </div>

        {prochainRdv && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Prochain Client à Contacter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-lg">
                    {getHeureFromDate(prochainRdv.date_contact || prochainRdv.date_creation)} - {prochainRdv.nom} {prochainRdv.prenom}
                  </p>
                  <p className="text-gray-600">Consultation {prochainRdv.type_assurance}</p>
                  {prochainRdv.telephone && (
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <Phone className="w-3 h-3" />
                      {prochainRdv.telephone}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleCallClient(prochainRdv)}
                  >
                    <Phone className="w-4 h-4 mr-1" />
                    Appeler
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => handleContactClient(prochainRdv)}
                  >
                    <Mail className="w-4 h-4 mr-1" />
                    Contacter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <CalendarView
          rendezVous={rendezVous}
          onEditRdv={handleEditRdv}
          onContactClient={handleContactClient}
          onCallClient={handleCallClient}
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Rendez-vous à venir
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {rendezVous.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Aucun rendez-vous planifié</p>
                <p className="text-gray-400 text-sm">Créez votre premier rendez-vous pour commencer</p>
              </div>
            ) : (
              rendezVous
                .filter(rdv => new Date(rdv.date_contact || rdv.date_creation) >= new Date())
                .slice(0, 5)
                .map((rdv) => (
                <div key={rdv.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="font-semibold text-lg">{getHeureFromDate(rdv.date_contact || rdv.date_creation)}</div>
                      <div className="text-xs text-gray-500">
                        {isToday(rdv.date_contact || rdv.date_creation) ? 'Aujourd\'hui' : formatDate(rdv.date_contact || rdv.date_creation)}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {rdv.nom} {rdv.prenom}
                      </p>
                      <p className="text-sm text-gray-600">Consultation {rdv.type_assurance}</p>
                      {rdv.telephone && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <Phone className="w-3 h-3" />
                          {rdv.telephone}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {getStatutBadge(rdv.statut)}
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleEditRdv(rdv)}
                      >
                        Modifier
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => handleContactClient(rdv)}
                        disabled={rdv.statut === 'annule' || rdv.statut === 'termine'}
                      >
                        <Mail className="w-4 h-4 mr-1" />
                        Contacter
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <CreateRdvModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onRdvCreated={handleRdvCreated}
        conseillerNom={conseillerNom}
      />

      <EditRdvModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onRdvUpdated={handleRdvUpdated}
        rdv={selectedRdv}
      />

      <EmailReminderModal
        isOpen={isEmailReminderModalOpen}
        onClose={() => setIsEmailReminderModalOpen(false)}
        rdv={selectedRdv}
      />
    </ConseillerLayout>
  );
};

export default ConseilleurCalendrier;
