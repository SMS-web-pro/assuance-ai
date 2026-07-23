
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Archive, RotateCcw, Search, Download, Eye, Trash2, Car, Home, Heart, Bike } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const ArchivesManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: archivedDemandes = [], isLoading, refetch } = useQuery({
    queryKey: ['archived-demandes'],
    queryFn: async () => {
      console.log('Fetching archived demandes...');
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
        .eq('statut', 'archive')
        .order('date_modification', { ascending: false });
      
      if (error) {
        console.error('Error fetching archived demandes:', error);
        throw error;
      }
      
      console.log('Fetched archived demandes:', data);
      return data;
    }
  });

  const filteredDemandes = archivedDemandes.filter(demande => {
    const matchesSearch = 
      demande.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      demande.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      demande.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "all" || demande.type_assurance === typeFilter;
    
    return matchesSearch && matchesType;
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
        return <Archive className="w-4 h-4" />;
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

  const handleRestoreDemande = async (demandeId: string) => {
    try {
      const { error } = await supabase
        .from('demandes_assurance')
        .update({ statut: 'nouveau' })
        .eq('id', demandeId);
      
      if (error) throw error;
      
      toast.success("Demande restaurée avec succès");
      refetch();
    } catch (error) {
      console.error('Error restoring demande:', error);
      toast.error("Erreur lors de la restauration");
    }
  };

  const handlePermanentDelete = async (demandeId: string) => {
    console.log('=== DÉBUT DE LA SUPPRESSION ===');
    console.log('ID de la demande à supprimer:', demandeId);
    
    try {
      // 1. Vérifier la connexion à Supabase
      console.log('1. Vérification de la connexion Supabase...');
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      console.log('Session:', sessionData?.session);
      if (sessionError) console.error('Erreur de session:', sessionError);

      // 2. Vérifier la demande
      console.log('2. Vérification de la demande...');
      const { data: existingDemande, error: fetchError } = await supabase
        .from('demandes_assurance')
        .select('*')
        .eq('id', demandeId)
        .single();
      
      console.log('Détails de la demande:', existingDemande);
      
      if (fetchError) {
        console.error('Erreur lors de la récupération:', fetchError);
        throw new Error(`Impossible de récupérer la demande: ${fetchError.message}`);
      }
      
      if (!existingDemande) {
        throw new Error('La demande est introuvable ou a déjà été supprimée');
      }

      // 3. Tenter la suppression
      console.log('3. Tentative de suppression...');
      const { data: deleteData, error: deleteError } = await supabase
        .from('demandes_assurance')
        .delete()
        .eq('id', demandeId)
        .select();
      
      console.log('Réponse de suppression:', { deleteData, deleteError });
      
      if (deleteError) {
        console.error('Erreur détaillée:', {
          message: deleteError.message,
          code: deleteError.code,
          details: deleteError.details,
          hint: deleteError.hint
        });
        throw deleteError;
      }
      
      console.log('3. Suppression réussie, rafraîchissement...');
      toast.success("✅ La demande a été supprimée avec succès");
      
      // Rafraîchir la liste après un court délai
      setTimeout(() => {
        refetch().catch(err => {
          console.error('Erreur lors du rafraîchissement:', err);
          window.location.reload();
        });
      }, 500);
      
    } catch (error) {
      console.error('=== ERREUR LORS DE LA SUPPRESSION ===', {
        name: error.name,
        message: error.message,
        ...(error.code && { code: error.code })
      });
      
      let errorMessage = "Erreur lors de la suppression de la demande";
      
      if (error?.message) {
        if (error.message.includes('foreign key constraint')) {
          errorMessage = "Impossible de supprimer cette demande car elle est liée à d'autres éléments";
        } else if (error.message.includes('permission denied')) {
          errorMessage = "Accès refusé. Vous n'avez pas les droits nécessaires.";
        } else if (error.message.includes('JWT')) {
          errorMessage = "Session expirée. Veuillez vous reconnecter.";
        }
      }
      
      toast.error(`❌ ${errorMessage}`);
    }
  };

  const exportArchivedToCSV = () => {
    const csvContent = [
      ['ID', 'Nom', 'Prénom', 'Email', 'Téléphone', 'Type', 'Date archivage'].join(','),
      ...filteredDemandes.map(d => [
        d.id.slice(0, 8),
        d.nom || '',
        d.prenom || '',
        d.email || '',
        d.telephone || '',
        getTypeLabel(d.type_assurance),
        new Date(d.date_modification).toLocaleDateString('fr-FR')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `archives_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success("Export CSV des archives terminé");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Archives</h2>
            <p className="text-muted-foreground">Chargement des demandes archivées...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Archives</h2>
          <p className="text-muted-foreground">
            Gérez les demandes archivées ({filteredDemandes.length} demandes)
          </p>
        </div>
        <Button onClick={exportArchivedToCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Rechercher par nom, prénom ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
                <SelectItem value="emprunteur">Emprunteur</SelectItem>
                <SelectItem value="voyage">Voyage</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Liste des demandes archivées */}
      {filteredDemandes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Archive className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Aucune demande archivée</h3>
            <p className="text-muted-foreground">
              {archivedDemandes.length === 0 
                ? "Aucune demande n'a encore été archivée." 
                : "Aucune demande archivée ne correspond à vos critères de recherche."
              }
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
                  <TableHead>Conseiller</TableHead>
                  <TableHead>Date archivage</TableHead>
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
                      {demande.conseiller_assigne || 'Non assigné'}
                    </TableCell>
                    <TableCell>
                      {new Date(demande.date_modification).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRestoreDemande(demande.id)}
                          title="Restaurer"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePermanentDelete(demande.id)}
                          title="Supprimer définitivement"
                          className="text-red-600 hover:text-red-700"
                        >
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
    </div>
  );
};

export default ArchivesManagement;
