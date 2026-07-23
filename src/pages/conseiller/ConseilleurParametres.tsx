import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Settings, User, Shield, Save, Eye, EyeOff, LogOut } from "lucide-react";
import { ConseillerLayout } from "@/components/ConseillerLayout";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useConseillerAuth } from "@/hooks/useConseillerAuth";
import NotificationSoundSettings from "@/components/admin/settings/NotificationSoundSettings";
import { useNotificationSettings } from "@/hooks/useNotificationSettings";

interface ConseillerInfo {
  id: number;
  nom: string;
  email: string;
  telephone: string;
  specialite: string;
}

const ConseilleurParametres = () => {
  const { toast } = useToast();
  const { conseillerSession, changePassword, logout } = useConseillerAuth();
  const [conseillerInfo, setConseillerInfo] = useState<ConseillerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Paramètres de notifications
  const { settings, updateSetting, isLoading: settingsLoading } = useNotificationSettings();

  // États pour les formulaires
  const [personalInfo, setPersonalInfo] = useState({
    nom: "",
    email: "",
    telephone: "",
    specialite: "",
    bio: ""
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    const initializePage = async () => {
      try {
        setPageLoading(true);
        if (conseillerSession) {
          await loadConseillerInfo();
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de la page:', error);
      } finally {
        setPageLoading(false);
      }
    };

    initializePage();
  }, [conseillerSession]);

  const loadConseillerInfo = async () => {
    if (!conseillerSession) return;

    try {
      const { data, error } = await supabase
        .from('conseillers')
        .select('*')
        .eq('id', conseillerSession.id)
        .maybeSingle();

      if (error) {
        console.error('Erreur Supabase:', error);
        throw error;
      }

      if (data) {
        setConseillerInfo(data);
        setPersonalInfo({
          nom: data.nom || "",
          email: data.email || "",
          telephone: data.telephone || "",
          specialite: data.specialite || "",
          bio: "Conseiller expérimenté avec 8 ans d'expérience dans l'assurance automobile et habitation. Spécialisé dans l'accompagnement des jeunes conducteurs et des primo-accédants."
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des informations:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger vos informations",
        variant: "destructive"
      });
    }
  };

  const handlePersonalInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conseillerInfo) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('conseillers')
        .update({
          nom: personalInfo.nom,
          email: personalInfo.email,
          telephone: personalInfo.telephone,
          specialite: personalInfo.specialite,
          updated_at: new Date().toISOString()
        })
        .eq('id', conseillerInfo.id);

      if (error) throw error;

      // Mettre à jour la session locale
      const sessionData = localStorage.getItem('conseiller_session');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        session.nom = personalInfo.nom;
        session.email = personalInfo.email;
        session.specialite = personalInfo.specialite;
        localStorage.setItem('conseiller_session', JSON.stringify(session));
      }

      toast({
        title: "Succès",
        description: "Vos informations personnelles ont été mises à jour",
      });

      loadConseillerInfo();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour vos informations",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await changePassword(passwordData.newPassword);
      
      if (result.success) {
        setPasswordData({
          newPassword: "",
          confirmPassword: ""
        });
      }
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonctions pour la sauvegarde des paramètres de notifications
  const saveNotificationSettings = async () => {
    try {
      const settingsToSave = [
        { key: 'notifications_enabled', value: settings.notificationsEnabled.toString() },
        { key: 'sounds_enabled', value: settings.soundsEnabled.toString() },
        { key: 'notification_sound', value: settings.notificationSound },
        { key: 'chat_sound', value: settings.chatSound },
        { key: 'notification_volume', value: settings.volume.toString() }
      ];

      for (const setting of settingsToSave) {
        await supabase
          .from('app_settings')
          .upsert({
            key: setting.key,
            value: setting.value,
            description: `Paramètre de notification: ${setting.key}`
          }, {
            onConflict: 'key'
          });
      }

      toast({
        title: "Succès",
        description: "Paramètres de notifications sauvegardés",
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les paramètres",
        variant: "destructive"
      });
    }
  };

  if (!conseillerSession || pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <ConseillerLayout title="Paramètres">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Paramètres</h1>
          <Button 
            variant="outline" 
            onClick={logout}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </Button>
        </div>

        {/* Paramètres de notifications */}
        {!settingsLoading && (
          <NotificationSoundSettings
            notificationsEnabled={settings.notificationsEnabled}
            soundsEnabled={settings.soundsEnabled}
            notificationSound={settings.notificationSound}
            chatSound={settings.chatSound}
            volume={settings.volume}
            setNotificationsEnabled={(value) => updateSetting('notificationsEnabled', value)}
            setSoundsEnabled={(value) => updateSetting('soundsEnabled', value)}
            setNotificationSound={(value) => updateSetting('notificationSound', value)}
            setChatSound={(value) => updateSetting('chatSound', value)}
            setVolume={(value) => updateSetting('volume', value)}
          />
        )}

        {/* Bouton pour sauvegarder les paramètres de notifications */}
        <div className="flex justify-end">
          <Button onClick={saveNotificationSettings} className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            Sauvegarder les paramètres de notifications
          </Button>
        </div>

        {/* Informations personnelles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Informations Personnelles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePersonalInfoSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom complet *</Label>
                  <Input 
                    id="nom" 
                    value={personalInfo.nom}
                    onChange={(e) => setPersonalInfo({...personalInfo, nom: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email professionnel *</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={personalInfo.email}
                    onChange={(e) => setPersonalInfo({...personalInfo, email: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input 
                    id="telephone" 
                    value={personalInfo.telephone}
                    onChange={(e) => setPersonalInfo({...personalInfo, telephone: e.target.value})}
                    placeholder="06 12 34 56 78"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialite">Spécialité</Label>
                  <Input 
                    id="specialite" 
                    value={personalInfo.specialite}
                    onChange={(e) => setPersonalInfo({...personalInfo, specialite: e.target.value})}
                    placeholder="Assurance Auto & Habitation"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Présentation</Label>
                <Textarea 
                  id="bio" 
                  placeholder="Décrivez brièvement votre expérience et vos spécialités..." 
                  value={personalInfo.bio}
                  onChange={(e) => setPersonalInfo({...personalInfo, bio: e.target.value})}
                  rows={4}
                />
              </div>

              <Button type="submit" disabled={isLoading} className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                {isLoading ? "Sauvegarde..." : "Sauvegarder les modifications"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Sécurité et mot de passe */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Sécurité & Mot de passe
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nouveau mot de passe *</Label>
                <div className="relative">
                  <Input 
                    id="newPassword" 
                    type={showPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    placeholder="Minimum 6 caractères"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
                <div className="relative">
                  <Input 
                    id="confirmPassword" 
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    placeholder="Retapez le nouveau mot de passe"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {passwordData.newPassword && passwordData.confirmPassword && 
               passwordData.newPassword !== passwordData.confirmPassword && (
                <p className="text-sm text-red-600">
                  Les mots de passe ne correspondent pas
                </p>
              )}

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Conseils pour un mot de passe sécurisé :</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Au moins 8 caractères recommandés</li>
                  <li>• Mélangez majuscules, minuscules et chiffres</li>
                  <li>• Incluez des caractères spéciaux (!@#$%)</li>
                  <li>• Évitez les informations personnelles</li>
                </ul>
              </div>

              <Button 
                type="submit" 
                variant="destructive" 
                disabled={isLoading || !passwordData.newPassword || !passwordData.confirmPassword}
                className="flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                {isLoading ? "Modification..." : "Changer le mot de passe"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Informations sur le compte */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Informations du compte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm font-medium">Statut du compte</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                Actif
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm font-medium">Dernière connexion</span>
              <span className="text-sm text-gray-600">
                {new Date().toLocaleDateString('fr-FR')}
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium">Membre depuis</span>
              <span className="text-sm text-gray-600">
                Janvier 2023
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </ConseillerLayout>
  );
};

export default ConseilleurParametres;
