import { useState, useEffect } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from 'sonner';
import { Shield, ShieldCheck, Trash2, Plus, Loader2 } from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  is_super_admin: boolean;
  created_at: string;
}

export default function AdminUsersManager() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [currentUserIsSuperAdmin, setCurrentUserIsSuperAdmin] = useState(false);

  // Charger la liste des administrateurs
  const loadAdmins = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAdmins(data || []);
      
      // Vérifier si l'utilisateur actuel est un super admin
      if (user) {
        const { data: currentAdmin } = await supabase
          .from('admin_users')
          .select('is_super_admin')
          .eq('user_id', user.id)
          .single();
          
        setCurrentUserIsSuperAdmin(!!currentAdmin?.is_super_admin);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des administrateurs:', error);
      toast.error('Erreur lors du chargement des administrateurs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadAdmins();
    }
  }, [user]);

  // Ajouter un nouvel administrateur
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('add_admin', {
        admin_email: newAdminEmail.trim(),
        admin_name: newAdminName.trim() || newAdminEmail.split('@')[0],
        make_super_admin: isSuperAdmin
      });
      
      if (error) throw error;
      
      toast.success('Administrateur ajouté avec succès');
      setNewAdminEmail('');
      setNewAdminName('');
      setIsSuperAdmin(false);
      await loadAdmins();
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'administrateur:', error);
      toast.error(error.message || 'Erreur lors de l\'ajout de l\'administrateur');
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un administrateur
  const handleRemoveAdmin = async (adminEmail: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet administrateur ?')) return;
    
    try {
      setLoading(true);
      const { error } = await supabase.rpc('remove_admin', {
        admin_email: adminEmail
      });
      
      if (error) throw error;
      
      toast.success('Administrateur supprimé avec succès');
      await loadAdmins();
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'administrateur:', error);
      toast.error(error.message || 'Erreur lors de la suppression de l\'administrateur');
    } finally {
      setLoading(false);
    }
  };

  // Changer le statut de super admin
  const toggleSuperAdmin = async (adminEmail: string, currentStatus: boolean) => {
    try {
      setLoading(true);
      const { error } = await supabase.rpc('set_super_admin', {
        admin_email: adminEmail,
        is_super: !currentStatus
      });
      
      if (error) throw error;
      
      toast.success(`Statut de super admin ${!currentStatus ? 'activé' : 'désactivé'}`);
      await loadAdmins();
    } catch (error) {
      console.error('Erreur lors de la modification du statut:', error);
      toast.error(error.message || 'Erreur lors de la modification du statut');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestion des administrateurs</CardTitle>
          <CardDescription>
            Ajoutez ou supprimez des administrateurs pour gérer l'application
          </CardDescription>
        </CardHeader>
        <CardContent>
          {currentUserIsSuperAdmin && (
            <form onSubmit={handleAddAdmin} className="space-y-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Email de l'administrateur</label>
                  <Input
                    type="email"
                    placeholder="email@exemple.com"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Nom complet (optionnel)</label>
                  <Input
                    type="text"
                    placeholder="Nom complet"
                    value={newAdminName}
                    onChange={(e) => setNewAdminName(e.target.value)}
                  />
                </div>
                <div className="flex items-end space-x-2">
                  <div className="flex-1">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={isSuperAdmin}
                        onChange={(e) => setIsSuperAdmin(e.target.checked)}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <span className="text-sm">Super administrateur</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Les super administrateurs peuvent gérer les autres administrateurs
                    </p>
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                    Ajouter
                  </Button>
                </div>
              </div>
            </form>
          )}

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Date d'ajout</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : admins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      Aucun administrateur trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">{admin.email}</TableCell>
                      <TableCell>{admin.full_name || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {admin.is_super_admin ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              <ShieldCheck className="h-3 w-3 mr-1" />
                              Super Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <Shield className="h-3 w-3 mr-1" />
                              Admin
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(admin.created_at).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          {currentUserIsSuperAdmin && admin.email !== user?.email && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleSuperAdmin(admin.email, admin.is_super_admin)}
                              disabled={loading}
                              title={admin.is_super_admin ? 'Rétrograder en admin normal' : 'Promouvoir super admin'}
                            >
                              {admin.is_super_admin ? (
                                <Shield className="h-4 w-4 text-yellow-500" />
                              ) : (
                                <ShieldCheck className="h-4 w-4 text-blue-500" />
                              )}
                            </Button>
                          )}
                          {currentUserIsSuperAdmin && admin.email !== user?.email && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveAdmin(admin.email)}
                              disabled={loading}
                              className="text-red-500 hover:text-red-700"
                              title="Supprimer l'administrateur"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 px-6 py-4">
          <p className="text-sm text-gray-500">
            {admins.length} administrateur{admins.length !== 1 ? 's' : ''} au total
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
