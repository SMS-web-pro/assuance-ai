import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Search, Eye, Car, Home, Heart, Bike, UserPlus, Phone, Mail, Archive, Calendar, AlertCircle, Clock, CheckCircle, Trophy, MessageSquare, Users, FilterX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import ClientDetailsCard from "./ClientDetailsCard";
import EditClientModal from "./EditClientModal";
import ScheduleReminderModal from "./ScheduleReminderModal";
import DevisGenerationModal from "./DevisGenerationModal";
import AdvancedEmailModal from "./AdvancedEmailModal";

const DemandesManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [conseillerFilter, setConseillerFilter] = useState("all");
  
  // Modals states
  const [selectedDemande, setSelectedDemande] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editClientModalOpen, setEditClientModalOpen] = useState(false);
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [devisModalOpen, setDevisModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  // Récupérer toutes les demandes NON ARCHIVÉES
  const { data: demandes = [], isLoading, refetch } = useQuery({
    queryKey: ['demandes-assurance'],
    queryFn: async () => {
      console.log('Fetching active demandes...');
      const { data, error } = await supabase
        .from('demandes_assurance')
        .select(`
          *,
          assurance_auto(*),
          assurance_habitation(*),
          assurance_sante(*),
          assurance_moto(*),
          assurance_emprunteur(*),
          assurance_voyage(*)
        `)
        .neq('statut', 'archive') // Exclure les demandes archivées
        .order('date_creation', { ascending: false });
      
      if (error) {
        console.error('Error fetching demandes:', error);
        throw error;
      }
      
      console.log('Fetched active demandes:', data.length);
      return data;
    }
  });

  // Récupérer la liste des conseillers
  const { data: conseillers = [] } = useQuery({
    queryKey: ['conseillers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conseillers')
        .select('nom')
        .eq('statut', 'En ligne');
      
      if (error) throw error;
      return data;
    }
  });

  const filteredDemandes = demandes.filter(demande => {
    const matchesSearch = 
      demande.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      demande.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      demande.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || demande.statut === statusFilter;
    const matchesType = typeFilter === "all" || demande.type_assurance === typeFilter;
    const matchesPriority = priorityFilter === "all" || demande.priorite === priorityFilter;
    
    // Gérer le filtre conseiller avec la nouvelle valeur "non_assigne"
    const matchesConseiller = conseillerFilter === "all" || 
      (conseillerFilter === "non_assigne" && !demande.conseiller_assigne) ||
      demande.conseiller_assigne === conseillerFilter;
    
    return matchesSearch && matchesStatus && matchesType && matchesPriority && matchesConseiller;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "auto":
        return <Car className="w-4 h-4" />;
      case "habitation":
        return <Home className="w-4 h-4" />;
      case "sante":
        return <Heart className="w-4 h-4" />;
      case "moto":
        return <Bike className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels = {
      auto: "Auto",
      habitation: "Habitation",
      sante: "Santé",
      moto: "Moto",
      emprunteur: "Emprunteur",
      voyage: "Voyage"
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "nouveau":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          <AlertCircle className="w-3 h-3 mr-1" />
          Nouveau
        </Badge>;
      case "en_cours":
        return <Badge className="bg-blue-100 text-blue-800">
          <Clock className="w-3 h-3 mr-1" />
          En cours
        </Badge>;
      case "traite":
        return <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Traité
        </Badge>;
      case "termine":
        return <Badge className="bg-purple-100 text-purple-800">
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
        return <Badge variant="destructive">{priorite}</Badge>;
      case "normale":
        return <Badge variant="outline">{priorite}</Badge>;
      case "basse":
        return <Badge className="bg-gray-100 text-gray-600">{priorite}</Badge>;
      default:
        return <Badge>{priorite}</Badge>;
    }
  };

  const handleViewDetails = (demande: any) => {
    setSelectedDemande(demande);
    setIsDetailsOpen(true);
  };

  const handleEditClient = (demande: any) => {
    setSelectedDemande(demande);
    setEditClientModalOpen(true);
  };

  const handleCallClient = (demande: any) => {
    if (demande.telephone) {
      window.open(`tel:${demande.telephone}`);
      toast.success(`Appel vers ${demande.nom} ${demande.prenom}`);
      updateContactDate(demande.id);
    } else {
      toast.error("Aucun numéro de téléphone disponible");
    }
  };

  const handleEmailClient = (demande: any) => {
    setSelectedDemande(demande);
    setEmailModalOpen(true);
  };

  const handleGenerateQuote = (demande: any) => {
    setSelectedDemande(demande);
    setDevisModalOpen(true);
  };

  const handleScheduleCallback = (demande: any) => {
    setSelectedDemande(demande);
    setReminderModalOpen(true);
  };

  const handleReminderCreated = () => {
    toast.success(`Rappel programmé pour ${selectedDemande?.nom} ${selectedDemande?.prenom}`);
    setReminderModalOpen(false);
  };

  const handleClientUpdated = () => {
    refetch();
    setEditClientModalOpen(false);
  };

  const handleArchiveDemande = async (demandeId: string) => {
    try {
      const { error } = await supabase
        .from('demandes_assurance')
        .update({ statut: 'archive' })
        .eq('id', demandeId);

      if (error) throw error;
      toast.success("Demande archivée avec succès");
      refetch();
    } catch (error) {
      console.error('Error archiving demande:', error);
      toast.error("Erreur lors de l'archivage");
    }
  };

  const updateContactDate = async (demandeId: string) => {
    try {
      await supabase
        .from('demandes_assurance')
        .update({ date_contact: new Date().toISOString() })
        .eq('id', demandeId);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la date de contact:', error);
    }
  };

  const assignDemandeToConseiller = async (demandeId: string, conseillerNom: string) => {
    try {
      const { error } = await supabase
        .from('demandes_assurance')
        .update({ 
          conseiller_assigne: conseillerNom,
          statut: 'en_cours' 
        })
        .eq('id', demandeId);

      if (error) throw error;
      toast.success(`Demande assignée à ${conseillerNom}`);
      refetch();
    } catch (error) {
      console.error('Error assigning demande:', error);
      toast.error("Erreur lors de l'assignation");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setTypeFilter("all");
    setPriorityFilter("all");
    setConseillerFilter("all");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Gestion des Demandes</h2>
            <p className="text-muted-foreground">Chargement des demandes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Demandes</h2>
          <p className="text-muted-foreground">
            Gérez toutes les demandes d'assurance actives ({filteredDemandes.length} demandes)
          </p>
        </div>
        <Button onClick={clearFilters} variant="outline" size="sm">
          <FilterX className="w-4 h-4 mr-2" />
          Effacer les filtres
        </Button>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Filtres et Recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
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

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="habitation">Habitation</SelectItem>
                <SelectItem value="sante">Santé</SelectItem>
                <SelectItem value="moto">Moto</SelectItem>
                <SelectItem value="emprunteur">Emprunteur</SelectItem>
                <SelectItem value="voyage">Voyage</SelectItem>
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

            <Select value={conseillerFilter} onValueChange={setConseillerFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Conseiller" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les conseillers</SelectItem>
                <SelectItem value="non_assigne">Non assigné</SelectItem>
                {conseillers.map(conseiller => (
                  <SelectItem key={conseiller.nom} value={conseiller.nom}>
                    {conseiller.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des demandes */}
      {filteredDemandes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucune demande trouvée</h3>
            <p className="text-muted-foreground">
              {demandes.length === 0 
                ? "Aucune demande active n'a été trouvée." 
                : "Aucune demande ne correspond à vos critères de recherche."
              }
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Les demandes archivées ne sont pas affichées ici. Consultez la section Archives.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Priorité</TableHead>
                  <TableHead>Conseiller</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDemandes.map(demande => (
                  <TableRow key={demande.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{demande.nom} {demande.prenom}</div>
                        <div className="text-sm text-muted-foreground">{demande.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        {getTypeIcon(demande.type_assurance)}
                        {getTypeLabel(demande.type_assurance)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getStatutBadge(demande.statut)}
                    </TableCell>
                    <TableCell>
                      {getPrioriteBadge(demande.priorite)}
                    </TableCell>
                    <TableCell>
                      {demande.conseiller_assigne ? (
                        <Badge variant="secondary">{demande.conseiller_assigne}</Badge>
                      ) : (
                        <Select onValueChange={(value) => assignDemandeToConseiller(demande.id, value)}>
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue placeholder="Assigner" />
                          </SelectTrigger>
                          <SelectContent>
                            {conseillers.map(conseiller => (
                              <SelectItem key={conseiller.nom} value={conseiller.nom}>
                                {conseiller.nom}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(demande.date_creation).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(demande)}
                          title="Voir les détails"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditClient(demande)}
                          title="Modifier le client"
                        >
                          <UserPlus className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCallClient(demande)}
                          title="Appeler"
                        >
                          <Phone className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEmailClient(demande)}
                          title="Envoyer un email"
                        >
                          <Mail className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleScheduleCallback(demande)}
                          title="Programmer un rappel"
                        >
                          <Calendar className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleArchiveDemande(demande.id)}
                          title="Archiver"
                          className="text-orange-600 hover:text-orange-700"
                        >
                          <Archive className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <ClientDetailsCard 
        demande={selectedDemande} 
        isOpen={isDetailsOpen} 
        onClose={() => setIsDetailsOpen(false)} 
      />

      <EditClientModal 
        isOpen={editClientModalOpen} 
        onClose={() => setEditClientModalOpen(false)} 
        demande={selectedDemande} 
        onClientUpdated={handleClientUpdated} 
      />

      <ScheduleReminderModal 
        isOpen={reminderModalOpen} 
        onClose={() => setReminderModalOpen(false)} 
        demande={selectedDemande} 
        onReminderCreated={handleReminderCreated} 
      />

      <DevisGenerationModal 
        isOpen={devisModalOpen} 
        onClose={() => setDevisModalOpen(false)} 
        demande={selectedDemande} 
      />

      <AdvancedEmailModal 
        open={emailModalOpen} 
        onOpenChange={setEmailModalOpen} 
        demande={selectedDemande} 
      />
    </div>
  );
};

export default DemandesManagement;
