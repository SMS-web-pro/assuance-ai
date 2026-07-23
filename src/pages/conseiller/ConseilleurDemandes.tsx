import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Clock, User, Phone, Mail, Search, Filter, Calendar, AlertCircle, CheckCircle, Eye, Settings, Trophy } from "lucide-react";
import { ConseillerLayout } from "@/components/ConseillerLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { VoirDemandeModal } from "@/components/conseiller/VoirDemandeModal";
import { TraiterDemandeModal } from "@/components/conseiller/TraiterDemandeModal";
import { NotificationPermissionButton } from "@/components/NotificationPermissionButton";

interface Demande {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  type_assurance: string;
  statut: string;
  priorite: string;
  date_creation: string;
  conseiller_assigne: string;
  date_naissance?: string;
  adresse_complete?: string;
  code_postal?: string;
}

const ConseilleurDemandes = () => {
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [filteredDemandes, setFilteredDemandes] = useState<Demande[]>([]);
  const [loading, setLoading] = useState(true);
  const [conseillerNom, setConseillerNom] = useState<string>("");
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null);
  const [isVoirModalOpen, setIsVoirModalOpen] = useState(false);
  const [isTraiterModalOpen, setIsTraiterModalOpen] = useState(false);
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    const sessionData = localStorage.getItem('conseiller_session');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      setConseillerNom(session.nom);
      fetchDemandes(session.nom);
      
      // Configuration de la mise à jour en temps réel
      setupRealtimeUpdates(session.nom);
    }
  }, []);

  useEffect(() => {
    filterDemandes();
  }, [demandes, searchTerm, statusFilter, priorityFilter, typeFilter]);

  // Nouveau : Configuration des mises à jour en temps réel
  const setupRealtimeUpdates = (nomConseiller: string) => {
    const channel = supabase
      .channel('demandes_updates')
      .on(
        'postgres_changes',
        {
          event: '*', // Écouter tous les événements (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'demandes_assurance',
          filter: `conseiller_assigne=eq.${nomConseiller}`
        },
        (payload) => {
          console.log('Mise à jour en temps réel détectée:', payload);
          // Recharger les données quand une modification est détectée
          fetchDemandes(nomConseiller);
          
          // Toast notification pour informer l'utilisateur
          if (payload.eventType === 'UPDATE') {
            // Vérifier si la demande a été archivée
            if (payload.new && payload.new.statut === 'archive') {
              toast.success('Demande archivée avec succès');
            } else {
              toast.success('Demande mise à jour automatiquement');
            }
          } else if (payload.eventType === 'INSERT') {
            toast.success('Nouvelle demande reçue');
          }
        }
      )
      .subscribe();

    // Nettoyage au démontage du composant
    return () => {
      supabase.removeChannel(channel);
    };
  };

  const fetchDemandes = async (nomConseiller: string) => {
    try {
      setLoading(true);
      console.log('🔄 Rechargement des demandes pour:', nomConseiller);
      
      // Exclure les demandes archivées de la liste principale
      const { data, error } = await supabase
        .from('demandes_assurance')
        .select('*')
        .eq('conseiller_assigne', nomConseiller)
        .neq('statut', 'archive') // Exclure les demandes archivées
        .order('date_creation', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des demandes:', error);
        toast.error('Erreur lors du chargement des demandes');
        return;
      }

      console.log('📊 Demandes chargées (hors archives):', data?.length || 0);
      setDemandes(data || []);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const filterDemandes = () => {
    let filtered = demandes;

    if (searchTerm) {
      filtered = filtered.filter(demande =>
        demande.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        demande.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        demande.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(demande => demande.statut === statusFilter);
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter(demande => demande.priorite === priorityFilter);
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(demande => demande.type_assurance === typeFilter);
    }

    setFilteredDemandes(filtered);
  };

  const handleVoirDemande = (demande: Demande) => {
    setSelectedDemande(demande);
    setIsVoirModalOpen(true);
  };

  const handleTraiterDemande = (demande: Demande) => {
    setSelectedDemande(demande);
    setIsTraiterModalOpen(true);
  };

  const handleDemandeUpdate = () => {
    if (conseillerNom) {
      console.log('🔄 Mise à jour manuelle des demandes');
      fetchDemandes(conseillerNom);
    }
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "nouveau":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
          <AlertCircle className="w-3 h-3 mr-1" />
          Nouveau
        </Badge>;
      case "en_cours":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">
          <Clock className="w-3 h-3 mr-1" />
          En cours
        </Badge>;
      case "traite":
        return <Badge className="bg-green-100 text-green-800 border-green-300">
          <CheckCircle className="w-3 h-3 mr-1" />
          Traité
        </Badge>;
      case "termine":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-300">
          <Trophy className="w-3 h-3 mr-1" />
          Terminé
        </Badge>;
      default:
        return <Badge>{statut}</Badge>;
    }
  };

  const getPrioriteBadge = (priorite: string) => {
    switch (priorite) {
      case "haute":
      case "urgent":
        return <Badge variant="destructive" className="animate-pulse">{priorite}</Badge>;
      case "normale":
        return <Badge variant="outline">{priorite}</Badge>;
      case "basse":
        return <Badge className="bg-gray-100 text-gray-600">{priorite}</Badge>;
      default:
        return <Badge>{priorite}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      auto: "🚗",
      habitation: "🏠",
      sante: "🏥",
      moto: "🏍️",
      voyage: "✈️",
      emprunteur: "💰"
    };
    return icons[type as keyof typeof icons] || "📄";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calcul des statistiques en temps réel basé sur les demandes actuelles (non archivées)
  const getStatsCards = () => {
    const total = filteredDemandes.length;
    const nouveau = filteredDemandes.filter(d => d.statut === "nouveau").length;
    const enCours = filteredDemandes.filter(d => d.statut === "en_cours").length;
    const traite = filteredDemandes.filter(d => d.statut === "traite").length;
    const termine = filteredDemandes.filter(d => d.statut === "termine").length;

    // Log pour debug des calculs
    console.log('📊 Statistiques calculées (hors archives):', {
      total,
      nouveau: `${nouveau} (nouveau)`,
      enCours: `${enCours} (en_cours)`, 
      traite: `${traite} (traite)`,
      termine: `${termine} (termine)`
    });

    return [
      { title: "Total", value: total, icon: FileText, color: "bg-blue-50 text-blue-700" },
      { title: "Nouveau", value: nouveau, icon: AlertCircle, color: "bg-yellow-50 text-yellow-700" },
      { title: "En cours", value: enCours, icon: Clock, color: "bg-orange-50 text-orange-700" },
      { title: "Traité", value: traite, icon: CheckCircle, color: "bg-green-50 text-green-700" },
      { title: "Terminé", value: termine, icon: Trophy, color: "bg-purple-50 text-purple-700" },
    ];
  };

  if (loading) {
    return (
      <ConseillerLayout title="Mes Demandes">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Chargement des demandes...</div>
        </div>
      </ConseillerLayout>
    );
  }

  return (
    <ConseillerLayout title="Mes Demandes">
      <div className="space-y-6">
        {/* En-tête avec statistiques */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Mes Demandes
            </h1>
            <p className="text-gray-600 mt-1">Gérez vos demandes d'assurance efficacement - Demandes actives uniquement</p>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => handleDemandeUpdate()} 
              variant="outline" 
              size="sm"
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              🔄 Actualiser
            </Button>
            <NotificationPermissionButton userType="conseiller" conseillerNom={conseillerNom} />
          </div>
        </div>

        {/* Cartes de statistiques - Mise à jour automatique (hors archives) */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {getStatsCards().map((stat) => (
            <Card key={stat.title} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filtres avancés - Exclure le statut "archive" des options */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="w-5 h-5" />
              Filtres
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="nouveau">Nouveau</SelectItem>
                  <SelectItem value="en_cours">En cours</SelectItem>
                  <SelectItem value="traite">Traité</SelectItem>
                  <SelectItem value="termine">Terminé</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les priorités</SelectItem>
                  <SelectItem value="haute">Haute</SelectItem>
                  <SelectItem value="normale">Normale</SelectItem>
                  <SelectItem value="basse">Basse</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Type d'assurance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="auto">Auto</SelectItem>
                  <SelectItem value="habitation">Habitation</SelectItem>
                  <SelectItem value="sante">Santé</SelectItem>
                  <SelectItem value="moto">Moto</SelectItem>
                  <SelectItem value="voyage">Voyage</SelectItem>
                  <SelectItem value="emprunteur">Emprunteur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Liste des demandes */}
        {filteredDemandes.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">
                {demandes.length === 0 ? "Aucune demande active pour le moment." : "Aucune demande ne correspond aux critères de recherche."}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Les demandes archivées ne sont pas affichées ici. Consultez la section Archives dans le panel administrateur.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredDemandes.map((demande) => (
              <Card key={demande.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="text-2xl">{getTypeIcon(demande.type_assurance)}</div>
                        <div>
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-600" />
                            {demande.nom} {demande.prenom}
                          </h3>
                          <div className="flex flex-wrap gap-4 mt-2">
                            {demande.email && (
                              <p className="text-sm text-gray-600 flex items-center gap-2">
                                <Mail className="w-3 h-3" />
                                {demande.email}
                              </p>
                            )}
                            {demande.telephone && (
                              <p className="text-sm text-gray-600 flex items-center gap-2">
                                <Phone className="w-3 h-3" />
                                {demande.telephone}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <span className="flex items-center gap-2 font-medium">
                          <FileText className="w-4 h-4" />
                          {demande.type_assurance}
                        </span>
                        <span className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {formatDate(demande.date_creation)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <div className="flex gap-2">
                        {getStatutBadge(demande.statut)}
                        {getPrioriteBadge(demande.priorite)}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleVoirDemande(demande)}
                          className="hover:bg-blue-50"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Voir
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => handleTraiterDemande(demande)}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          <Settings className="w-3 h-3 mr-1" />
                          Traiter
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modales */}
        <VoirDemandeModal 
          isOpen={isVoirModalOpen} 
          onClose={() => setIsVoirModalOpen(false)} 
          demande={selectedDemande} 
          onDemandeUpdate={handleDemandeUpdate} 
        />

        <TraiterDemandeModal 
          isOpen={isTraiterModalOpen} 
          onClose={() => setIsTraiterModalOpen(false)} 
          demande={selectedDemande} 
          onDemandeUpdate={handleDemandeUpdate} 
        />
      </div>
    </ConseillerLayout>
  );
};

export default ConseilleurDemandes;
