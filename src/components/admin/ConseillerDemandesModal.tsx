
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Clock, CheckCircle, XCircle, Phone, Mail, Car, Home, Heart, Bike, FileText, Calendar, Edit, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

interface ConseillerDemandesModalProps {
  isOpen: boolean;
  onClose: () => void;
  conseiller: any;
}

const ConseillerDemandesModal = ({ isOpen, onClose, conseiller }: ConseillerDemandesModalProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");

  const {
    data: demandes = [],
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['conseiller-demandes', conseiller?.nom],
    queryFn: async () => {
      if (!conseiller) return [];
      
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
        .eq('conseiller_assigne', conseiller.nom)
        .order('date_creation', { ascending: false });

      if (error) {
        console.error('Error fetching conseiller demandes:', error);
        throw error;
      }

      return data;
    },
    enabled: isOpen && !!conseiller
  });

  const filteredDemandes = demandes.filter(demande => {
    const matchesSearch = demande.nom?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         demande.prenom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         demande.email?.toLowerCase().includes(searchTerm.toLowerCase()) || '';
    const matchesStatus = statusFilter === "all" || demande.statut === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case "nouveau":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Nouveau</Badge>;
      case "en_cours":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">En cours</Badge>;
      case "traite":
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Traité</Badge>;
      case "archive":
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Archivé</Badge>;
      default:
        return <Badge variant="secondary">{statut}</Badge>;
    }
  };

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
        return <MessageSquare className="w-4 h-4" />;
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

  const handleUpdateComment = async (demandeId: string, comment: string) => {
    try {
      const { error } = await supabase
        .from('demandes_assurance')
        .update({ notes_conseiller: comment })
        .eq('id', demandeId);

      if (error) throw error;

      toast.success("Commentaire mis à jour");
      setEditingComment(null);
      setNewComment("");
      refetch();
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error("Erreur lors de la mise à jour du commentaire");
    }
  };

  const handleUpdateStatus = async (demandeId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('demandes_assurance')
        .update({ statut: newStatus })
        .eq('id', demandeId);

      if (error) throw error;

      toast.success("Statut mis à jour");
      refetch();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error("Erreur lors de la mise à jour du statut");
    }
  };

  const getStatutStats = () => {
    const stats = {
      nouveau: 0,
      en_cours: 0,
      traite: 0,
      archive: 0
    };

    demandes.forEach(demande => {
      if (stats.hasOwnProperty(demande.statut)) {
        stats[demande.statut as keyof typeof stats]++;
      }
    });

    return stats;
  };

  const stats = getStatutStats();

  if (!isOpen || !conseiller) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Demandes assignées à {conseiller.nom}
          </DialogTitle>
        </DialogHeader>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Nouveau</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.nouveau}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">En cours</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.en_cours}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Traité</p>
                  <p className="text-2xl font-bold text-green-600">{stats.traite}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Archivé</p>
                  <p className="text-2xl font-bold text-red-600">{stats.archive}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <div className="flex gap-4 mb-6">
          <Input
            placeholder="Rechercher un client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="nouveau">Nouveau</SelectItem>
              <SelectItem value="en_cours">En cours</SelectItem>
              <SelectItem value="traite">Traité</SelectItem>
              <SelectItem value="archive">Archivé</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Liste des demandes */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Chargement des demandes...</p>
            </div>
          ) : filteredDemandes.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                {demandes.length === 0 
                  ? "Aucune demande assignée à ce conseiller"
                  : "Aucune demande ne correspond aux critères de recherche"
                }
              </p>
            </div>
          ) : (
            filteredDemandes.map(demande => (
              <Card key={demande.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(demande.type_assurance)}
                      <div>
                        <CardTitle className="text-lg">
                          {demande.nom} {demande.prenom}
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          {demande.email && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {demande.email}
                            </div>
                          )}
                          {demande.telephone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {demande.telephone}
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Créée le {new Date(demande.date_creation).toLocaleDateString('fr-FR')} •{' '}
                          <span className="font-medium">{getTypeLabel(demande.type_assurance)}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatutBadge(demande.statut)}
                      <Select onValueChange={(value) => handleUpdateStatus(demande.id, value)}>
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="Changer statut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nouveau">Nouveau</SelectItem>
                          <SelectItem value="en_cours">En cours</SelectItem>
                          <SelectItem value="traite">Traité</SelectItem>
                          <SelectItem value="archive">Archivé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Section commentaires */}
                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Commentaire du conseiller
                        </h4>
                        {editingComment !== demande.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingComment(demande.id);
                              setNewComment(demande.notes_conseiller || "");
                            }}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Modifier
                          </Button>
                        )}
                      </div>
                      
                      {editingComment === demande.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Ajouter un commentaire..."
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdateComment(demande.id, newComment)}
                            >
                              <Save className="w-3 h-3 mr-1" />
                              Enregistrer
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingComment(null);
                                setNewComment("");
                              }}
                            >
                              <X className="w-3 h-3 mr-1" />
                              Annuler
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">
                          {demande.notes_conseiller || "Aucun commentaire"}
                        </p>
                      )}
                    </div>

                    {/* Informations supplémentaires */}
                    {(demande.adresse_complete || demande.code_postal) && (
                      <div className="text-sm">
                        <span className="font-medium">Adresse: </span>
                        {demande.adresse_complete} {demande.code_postal}
                      </div>
                    )}

                    {demande.priorite && (
                      <div className="text-sm">
                        <span className="font-medium">Priorité: </span>
                        <Badge variant={demande.priorite === "haute" ? "destructive" : "default"}>
                          {demande.priorite}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={onClose} variant="outline">
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConseillerDemandesModal;
