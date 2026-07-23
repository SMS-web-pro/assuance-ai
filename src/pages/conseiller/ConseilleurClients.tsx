import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Phone, Mail, MapPin, Calendar, Search, Filter, User, MessageCircle, Eye, UserPlus, Activity, TrendingUp } from "lucide-react";
import { ConseillerLayout } from "@/components/ConseillerLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ClientContactModal } from "@/components/conseiller/ClientContactModal";
import { ClientProfileModal } from "@/components/conseiller/ClientProfileModal";
interface Client {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  adresse_complete: string;
  type_assurance: string;
  statut: string;
  date_creation: string;
  date_contact?: string;
  code_postal?: string;
  date_naissance?: string;
  notes_conseiller?: string;
}
const ConseilleurClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [conseillerNom, setConseillerNom] = useState<string>("");
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [contactFilter, setContactFilter] = useState("all");
  useEffect(() => {
    const sessionData = localStorage.getItem('conseiller_session');
    if (sessionData) {
      const session = JSON.parse(sessionData);
      setConseillerNom(session.nom);
      fetchClients(session.nom);
    }
  }, []);
  useEffect(() => {
    filterClients();
  }, [clients, searchTerm, statusFilter, typeFilter, contactFilter]);
  const fetchClients = async (nomConseiller: string) => {
    try {
      setLoading(true);
      const {
        data,
        error
      } = await supabase.from('demandes_assurance').select('*').eq('conseiller_assigne', nomConseiller).order('date_creation', {
        ascending: false
      });
      if (error) {
        console.error('Erreur lors de la récupération des clients:', error);
        toast.error('Erreur lors du chargement des clients');
        return;
      }
      setClients(data || []);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des clients');
    } finally {
      setLoading(false);
    }
  };
  const filterClients = () => {
    let filtered = clients;
    if (searchTerm) {
      filtered = filtered.filter(client => client.nom?.toLowerCase().includes(searchTerm.toLowerCase()) || client.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) || client.email?.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (statusFilter !== "all") {
      filtered = filtered.filter(client => client.statut === statusFilter);
    }
    if (typeFilter !== "all") {
      filtered = filtered.filter(client => client.type_assurance === typeFilter);
    }
    if (contactFilter !== "all") {
      if (contactFilter === "contacted") {
        filtered = filtered.filter(client => client.date_contact);
      } else if (contactFilter === "not_contacted") {
        filtered = filtered.filter(client => !client.date_contact);
      }
    }
    setFilteredClients(filtered);
  };
  const updateContactDate = async (clientId: string) => {
    try {
      await supabase.from('demandes_assurance').update({
        date_contact: new Date().toISOString()
      }).eq('id', clientId);
      const sessionData = localStorage.getItem('conseiller_session');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        fetchClients(session.nom);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la date de contact:', error);
    }
  };
  const handleContact = (client: Client) => {
    setSelectedClient(client);
    setContactModalOpen(true);
  };
  const handleViewProfile = (client: Client) => {
    setSelectedClient(client);
    setProfileModalOpen(true);
  };
  const handleContactUpdate = () => {
    if (selectedClient) {
      updateContactDate(selectedClient.id);
    }
  };
  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "termine":
        return <Badge className="bg-green-100 text-green-800 border-green-300">
          <Activity className="w-3 h-3 mr-1" />
          Client Actif
        </Badge>;
      case "en_cours":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">
          <TrendingUp className="w-3 h-3 mr-1" />
          Prospect
        </Badge>;
      case "nouveau":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          <UserPlus className="w-3 h-3 mr-1" />
          Nouveau Contact
        </Badge>;
      default:
        return <Badge>{statut}</Badge>;
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
      year: 'numeric'
    });
  };
  const getDaysSinceContact = (dateContact?: string) => {
    if (!dateContact) return null;
    const days = Math.floor((Date.now() - new Date(dateContact).getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };
  const getStatsCards = () => {
    const total = filteredClients.length;
    const actifs = filteredClients.filter(c => c.statut === "termine").length;
    const prospects = filteredClients.filter(c => c.statut === "en_cours").length;
    const contacted = filteredClients.filter(c => c.date_contact).length;
    return [{
      title: "Total Clients",
      value: total,
      icon: Users,
      color: "bg-blue-50 text-blue-700"
    }, {
      title: "Clients Actifs",
      value: actifs,
      icon: Activity,
      color: "bg-green-50 text-green-700"
    }, {
      title: "Prospects",
      value: prospects,
      icon: TrendingUp,
      color: "bg-orange-50 text-orange-700"
    }, {
      title: "Contactés",
      value: contacted,
      icon: MessageCircle,
      color: "bg-purple-50 text-purple-700"
    }];
  };
  if (loading) {
    return <ConseillerLayout title="Mes Clients">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600">Chargement des clients...</div>
        </div>
      </ConseillerLayout>;
  }
  return <ConseillerLayout title="Mes Clients">
      <div className="space-y-6">
        {/* En-tête avec statistiques */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Mon Portefeuille Clients
            </h1>
            <p className="text-gray-600 mt-1">Gérez et développez votre relation client</p>
          </div>
          
        </div>

        {/* Cartes de statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {getStatsCards().map(stat => <Card key={stat.title} className="hover:shadow-lg transition-shadow">
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
            </Card>)}
        </div>

        {/* Filtres avancés */}
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
                <Input placeholder="Rechercher un client..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="termine">Client Actif</SelectItem>
                  <SelectItem value="en_cours">Prospect</SelectItem>
                  <SelectItem value="nouveau">Nouveau Contact</SelectItem>
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

              <Select value={contactFilter} onValueChange={setContactFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut contact" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="contacted">Contactés</SelectItem>
                  <SelectItem value="not_contacted">Non contactés</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Liste des clients */}
        {filteredClients.length === 0 ? <Card className="text-center py-12">
            <CardContent>
              <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">
                {clients.length === 0 ? "Aucun client dans votre portefeuille pour le moment." : "Aucun client ne correspond aux critères de recherche."}
              </p>
            </CardContent>
          </Card> : <div className="grid gap-4">
            {filteredClients.map(client => <Card key={client.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="text-2xl">{getTypeIcon(client.type_assurance)}</div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            <User className="w-4 h-4 text-green-600" />
                            {client.nom} {client.prenom}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                            {client.email && <p className="text-sm text-gray-600 flex items-center gap-2">
                                <Mail className="w-3 h-3" />
                                {client.email}
                              </p>}
                            {client.telephone && <p className="text-sm text-gray-600 flex items-center gap-2">
                                <Phone className="w-3 h-3" />
                                {client.telephone}
                              </p>}
                            {client.adresse_complete && <p className="text-sm text-gray-600 flex items-center gap-2">
                                <MapPin className="w-3 h-3" />
                                {client.adresse_complete}
                              </p>}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {client.type_assurance}
                          </Badge>
                        </div>
                        <span className="text-gray-600 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Client depuis: {formatDate(client.date_creation)}
                        </span>
                        {client.date_contact && <span className="text-gray-600 flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            Dernier contact: {formatDate(client.date_contact)}
                            {getDaysSinceContact(client.date_contact) !== null && <Badge variant={getDaysSinceContact(client.date_contact)! > 30 ? "destructive" : "secondary"} className="ml-1 text-xs">
                                {getDaysSinceContact(client.date_contact)} jours
                              </Badge>}
                          </span>}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      {getStatutBadge(client.statut)}
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleContact(client)} className="hover:bg-green-50">
                          <MessageCircle className="w-3 h-3 mr-1" />
                          Contacter
                        </Button>
                        <Button size="sm" onClick={() => handleViewProfile(client)} className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                          <Eye className="w-3 h-3 mr-1" />
                          Voir Profil
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>)}
          </div>}
      </div>

      <ClientContactModal isOpen={contactModalOpen} onClose={() => setContactModalOpen(false)} client={selectedClient} onContactUpdate={handleContactUpdate} />

      <ClientProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} client={selectedClient} />
    </ConseillerLayout>;
};
export default ConseilleurClients;