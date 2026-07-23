
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Clock, CheckCircle, XCircle, Phone, Mail, Car, Home, Heart, Bike, RotateCcw, Filter, Download, Eye, Edit, Trash2, UserPlus, Calendar, AlertCircle, Grid, List, FileText, Send, Archive, Star, Flag, Copy, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import ConseillerStats from "./ConseillerStats";
import AddEditConseillerModal from "./AddEditConseillerModal";
import ConseillerDemandesModal from "./ConseillerDemandesModal";

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

const ConseillersManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [specialiteFilter, setSpecialiteFilter] = useState("all");
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedConseillers, setSelectedConseillers] = useState<number[]>([]);
  const [addEditModalOpen, setAddEditModalOpen] = useState(false);
  const [selectedConseiller, setSelectedConseiller] = useState<Conseiller | null>(null);
  const [demandesModalOpen, setDemandesModalOpen] = useState(false);
  const [selectedConseillerForDemandes, setSelectedConseillerForDemandes] = useState<Conseiller | null>(null);

  const {
    data: conseillers = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['conseillers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conseillers')
        .select('*')
        .order('nom', { ascending: true });
      
      if (error) {
        console.error('Error fetching conseillers:', error);
        throw error;
      }
      return data as Conseiller[];
    }
  });

  useEffect(() => {
    if (error) {
      toast.error("Erreur lors du chargement des conseillers");
      console.error('Query error:', error);
    }
  }, [error]);

  const handleSyncConseillers = async () => {
    setIsSyncing(true);
    try {
      await refetch();
      toast.success("Synchronisation des conseillers terminée");
    } catch (error) {
      console.error('Error syncing conseillers:', error);
      toast.error("Erreur lors de la synchronisation");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddConseiller = () => {
    setSelectedConseiller(null);
    setAddEditModalOpen(true);
  };

  const handleEditConseiller = (conseiller: Conseiller) => {
    setSelectedConseiller(conseiller);
    setAddEditModalOpen(true);
  };

  const handleSaveConseiller = async (conseillerData: any) => {
    try {
      if (conseillerData.id) {
        // Mise à jour
        const { error } = await supabase
          .from('conseillers')
          .update(conseillerData)
          .eq('id', conseillerData.id);
        if (error) throw error;
        toast.success("Conseiller mis à jour avec succès");
      } else {
        // Ajout
        const { error } = await supabase
          .from('conseillers')
          .insert(conseillerData);
        if (error) throw error;
        toast.success("Conseiller ajouté avec succès");
      }
      refetch();
    } catch (error) {
      console.error('Error saving conseiller:', error);
      toast.error("Erreur lors de la sauvegarde du conseiller");
    } finally {
      setAddEditModalOpen(false);
      setSelectedConseiller(null);
    }
  };

  const handleDeleteConseiller = async (id: number) => {
    try {
      const { error } = await supabase
        .from('conseillers')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success("Conseiller supprimé avec succès");
      refetch();
    } catch (error) {
      console.error('Error deleting conseiller:', error);
      toast.error("Erreur lors de la suppression du conseiller");
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedConseillers.length === 0) {
      toast.error("Aucun conseiller sélectionné");
      return;
    }
    try {
      const { error } = await supabase
        .from('conseillers')
        .update({ statut: newStatus })
        .in('id', selectedConseillers);
      if (error) throw error;
      toast.success(`${selectedConseillers.length} conseiller(s) mis à jour`);
      setSelectedConseillers([]);
      refetch();
    } catch (error) {
      console.error('Error updating conseillers:', error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const specialites = Array.from(new Set(conseillers.map(c => c.specialite).filter(Boolean)));

  const filteredConseillers = conseillers.filter(conseiller => {
    const matchesSearch = conseiller.nom?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         conseiller.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesStatus = statusFilter === "all" || conseiller.statut === statusFilter;
    const matchesSpecialite = specialiteFilter === "all" || conseiller.specialite === specialiteFilter;
    return matchesSearch && matchesStatus && matchesSpecialite;
  });

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "En ligne":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">En ligne</Badge>;
      case "Absent":
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Absent</Badge>;
      case "En pause":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">En pause</Badge>;
      case "Congé":
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Congé</Badge>;
      default:
        return <Badge variant="secondary">{statut}</Badge>;
    }
  };

  const handleViewDemandes = (conseiller: Conseiller) => {
    setSelectedConseillerForDemandes(conseiller);
    setDemandesModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Conseillers</h2>
          <p className="text-muted-foreground">
            Suivez et gérez les conseillers ({filteredConseillers.length} conseillers)
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAddConseiller} className="bg-blue-600 hover:bg-blue-700">
            <UserPlus className="w-4 h-4 mr-2" />
            Ajouter
          </Button>
          <Button onClick={handleSyncConseillers} disabled={isSyncing} className="bg-green-600 hover:bg-green-700">
            <RotateCcw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Synchronisation...' : 'Synchroniser'}
          </Button>
        </div>
      </div>

      <ConseillerStats conseillers={conseillers} />

      {/* Filtres avancés */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtres avancés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
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
                <SelectItem value="En ligne">En ligne</SelectItem>
                <SelectItem value="Absent">Absent</SelectItem>
                <SelectItem value="En pause">En pause</SelectItem>
                <SelectItem value="Congé">Congé</SelectItem>
              </SelectContent>
            </Select>
            <Select value={specialiteFilter} onValueChange={setSpecialiteFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Spécialité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes spécialités</SelectItem>
                {specialites.map(specialite => (
                  <SelectItem key={specialite} value={specialite!}>
                    {specialite}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Actions en lot */}
      {selectedConseillers.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">
                {selectedConseillers.length} conseiller(s) sélectionné(s)
              </span>
              <div className="flex gap-2">
                <Select onValueChange={handleBulkStatusUpdate}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Changer le statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="En ligne">En ligne</SelectItem>
                    <SelectItem value="Absent">Absent</SelectItem>
                    <SelectItem value="En pause">En pause</SelectItem>
                    <SelectItem value="Congé">Congé</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => setSelectedConseillers([])}>
                  Désélectionner tout
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Toggle vue */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button 
            variant={viewMode === 'cards' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setViewMode('cards')}
          >
            <Grid className="w-4 h-4 mr-2" />
            Cartes
          </Button>
          <Button 
            variant={viewMode === 'table' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setViewMode('table')}
          >
            <List className="w-4 h-4 mr-2" />
            Tableau
          </Button>
        </div>
      </div>

      {filteredConseillers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucun conseiller trouvé</h3>
            <p className="text-muted-foreground">
              {conseillers.length === 0 
                ? "Aucun conseiller n'a encore été ajouté." 
                : "Aucun conseiller ne correspond à vos critères de recherche."
              }
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'cards' ? (
        <div className="grid gap-4">
          {filteredConseillers.map((conseiller) => (
            <Card key={conseiller.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <Checkbox 
                      checked={selectedConseillers.includes(conseiller.id)} 
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedConseillers([...selectedConseillers, conseiller.id]);
                        } else {
                          setSelectedConseillers(selectedConseillers.filter(id => id !== conseiller.id));
                        }
                      }} 
                    />
                    <div>
                      <CardTitle className="text-lg">
                        {conseiller.nom}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {conseiller.email} • {conseiller.specialite}
                      </p>
                      <Badge variant="outline">{conseiller.statut}</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="flex items-center gap-4">
                    {conseiller.telephone && (
                      <div className="text-sm">
                        <Phone className="w-4 h-4 inline-block mr-1" />
                        {conseiller.telephone}
                      </div>
                    )}
                    {conseiller.date_embauche && (
                      <div className="text-sm">
                        <Calendar className="w-4 h-4 inline-block mr-1" />
                        {new Date(conseiller.date_embauche).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditConseiller(conseiller)}>
                      <Edit className="w-3 h-3 mr-1" />
                      Modifier
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleViewDemandes(conseiller)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FileText className="w-3 h-3 mr-1" />
                      Demandes ({conseiller.demandsactuelles || 0})
                    </Button>
                    
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteConseiller(conseiller.id)}>
                      <Trash2 className="w-3 h-3 mr-1" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={selectedConseillers.length === filteredConseillers.length} 
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedConseillers(filteredConseillers.map(c => c.id));
                        } else {
                          setSelectedConseillers([]);
                        }
                      }} 
                    />
                  </TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Spécialité</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Date d'embauche</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConseillers.map((conseiller) => (
                  <TableRow key={conseiller.id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedConseillers.includes(conseiller.id)} 
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedConseillers([...selectedConseillers, conseiller.id]);
                          } else {
                            setSelectedConseillers(selectedConseillers.filter(id => id !== conseiller.id));
                          }
                        }} 
                      />
                    </TableCell>
                    <TableCell>{conseiller.nom}</TableCell>
                    <TableCell>{conseiller.email}</TableCell>
                    <TableCell>{conseiller.specialite}</TableCell>
                    <TableCell>{getStatutBadge(conseiller.statut)}</TableCell>
                    <TableCell>{conseiller.telephone || 'N/A'}</TableCell>
                    <TableCell>
                      {conseiller.date_embauche ? new Date(conseiller.date_embauche).toLocaleDateString('fr-FR') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEditConseiller(conseiller)} title="Modifier">
                          <Edit className="w-3 h-3" />
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleViewDemandes(conseiller)}
                          title="Voir les demandes"
                        >
                          <FileText className="w-3 h-3" />
                        </Button>
                        
                        <Button variant="ghost" size="sm" onClick={() => handleDeleteConseiller(conseiller.id)} title="Supprimer">
                          <Trash2 className="w-3 h-3" />
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

      <AddEditConseillerModal
        isOpen={addEditModalOpen}
        onClose={() => {
          setAddEditModalOpen(false);
          setSelectedConseiller(null);
        }}
        conseiller={selectedConseiller}
        onSave={handleSaveConseiller}
      />

      {/* Modal des demandes du conseiller */}
      <ConseillerDemandesModal
        isOpen={demandesModalOpen}
        onClose={() => {
          setDemandesModalOpen(false);
          setSelectedConseillerForDemandes(null);
        }}
        conseiller={selectedConseillerForDemandes}
      />
    </div>
  );
};

export default ConseillersManagement;
