import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Mail, Edit, Trash2, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type SmtpConfig = Tables<'smtp_configs'>;

interface SmtpConfigListProps {
  onAddNew: () => void;
  onConfigChange?: () => void;
}

const SmtpConfigList = ({ onAddNew, onConfigChange }: SmtpConfigListProps) => {
  const [smtpConfigs, setSmtpConfigs] = useState<SmtpConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSmtpConfigs();
  }, []);

  const loadSmtpConfigs = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('smtp_configs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSmtpConfigs(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des configurations SMTP:', error);
      toast.error("Erreur lors du chargement des configurations SMTP");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSmtpStatus = async (id: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('smtp_configs')
        .update({ enabled })
        .eq('id', id);

      if (error) throw error;
      
      setSmtpConfigs(configs => 
        configs.map(config => 
          config.id === id ? { ...config, enabled } : config
        )
      );
      
      toast.success(enabled ? "Configuration SMTP activée" : "Configuration SMTP désactivée");
      onConfigChange?.();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const setAsDefault = async (id: string) => {
    try {
      // Désactiver tous les autres comme défaut
      await supabase
        .from('smtp_configs')
        .update({ is_default: false });

      // Activer celui-ci comme défaut
      const { error } = await supabase
        .from('smtp_configs')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;
      
      setSmtpConfigs(configs => 
        configs.map(config => ({
          ...config,
          is_default: config.id === id
        }))
      );
      
      toast.success("Configuration définie par défaut");
      onConfigChange?.();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const deleteConfig = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette configuration ?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from('smtp_configs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setSmtpConfigs(configs => configs.filter(config => config.id !== id));
      toast.success("Configuration supprimée");
      onConfigChange?.();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast.error("Erreur lors de la suppression");
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <div className="text-center">Chargement des configurations...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Configurations SMTP sauvegardées
          </CardTitle>
          <Button onClick={onAddNew} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {smtpConfigs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucune configuration SMTP sauvegardée
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Serveur</TableHead>
                <TableHead>Port</TableHead>
                <TableHead>Sécurité</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {smtpConfigs.map((config) => (
                <TableRow key={config.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {config.name}
                      {config.is_default && (
                        <Badge variant="secondary">Par défaut</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{config.host}</TableCell>
                  <TableCell>{config.port}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {config.security.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={config.enabled}
                      onCheckedChange={(enabled) => toggleSmtpStatus(config.id, enabled)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {!config.is_default && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setAsDefault(config.id)}
                        >
                          Défaut
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteConfig(config.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default SmtpConfigList;
