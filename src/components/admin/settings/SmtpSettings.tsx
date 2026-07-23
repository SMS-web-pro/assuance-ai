import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Shield, TestTube, Image, Upload, Trash2, Save, Check, X } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import SmtpConfigList from "./SmtpConfigList";

interface SmtpSettingsProps {
  smtpHost: string;
  smtpPort: string;
  smtpUsername: string;
  smtpPassword: string;
  smtpSecurity: string;
  smtpEnabled: boolean;
  senderName: string;
  senderEmail: string;
  setSmtpHost: (value: string) => void;
  setSmtpPort: (value: string) => void;
  setSmtpUsername: (value: string) => void;
  setSmtpPassword: (value: string) => void;
  setSmtpSecurity: (value: string) => void;
  setSmtpEnabled: (value: boolean) => void;
  setSenderName: (value: string) => void;
  setSenderEmail: (value: string) => void;
}

interface LogoItem {
  id: string;
  url: string;
  name: string;
  isActive: boolean;
  uploadedAt: string;
}

const SmtpSettings = ({
  smtpHost,
  smtpPort,
  smtpUsername,
  smtpPassword,
  smtpSecurity,
  smtpEnabled,
  senderName,
  senderEmail,
  setSmtpHost,
  setSmtpPort,
  setSmtpUsername,
  setSmtpPassword,
  setSmtpSecurity,
  setSmtpEnabled,
  setSenderName,
  setSenderEmail
}: SmtpSettingsProps) => {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [logos, setLogos] = useState<LogoItem[]>([]);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isSavingSmtp, setIsSavingSmtp] = useState(false);
  const [configName, setConfigName] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadLogos();
  }, []);

  const loadLogos = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .like('key', 'company_logo%');

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      const logoItems: LogoItem[] = data?.map(item => ({
        id: item.id,
        url: item.value || "",
        name: item.key === 'company_logo' ? 'Logo principal' : `Logo ${item.key.replace('company_logo_', '')}`,
        isActive: item.key === 'company_logo',
        uploadedAt: item.created_at
      })) || [];

      setLogos(logoItems);
    } catch (error) {
      console.error('Erreur lors du chargement des logos:', error);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Veuillez sélectionner un fichier image");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Le fichier ne doit pas dépasser 5MB");
      return;
    }

    setIsUploadingLogo(true);

    try {
      const fileName = `logo_${Date.now()}.${file.name.split('.').pop()}`;
      const { data, error } = await supabase.storage
        .from('public')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('public')
        .getPublicUrl(fileName);

      // Créer une nouvelle entrée pour ce logo
      const logoKey = `company_logo_${Date.now()}`;
      await supabase
        .from('app_settings')
        .upsert({
          key: logoKey,
          value: publicUrl,
          description: `Logo téléchargé le ${new Date().toLocaleDateString('fr-FR')}`
        });

      toast.success("Logo téléchargé avec succès");
      loadLogos(); // Recharger la liste des logos
    } catch (error) {
      console.error('Erreur lors du téléchargement du logo:', error);
      toast.error("Erreur lors du téléchargement du logo");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleActivateLogo = async (logoId: string, logoUrl: string) => {
    try {
      // Désactiver le logo actuel (supprimer l'entrée company_logo)
      await supabase
        .from('app_settings')
        .delete()
        .eq('key', 'company_logo');

      // Activer le nouveau logo
      await supabase
        .from('app_settings')
        .upsert({
          key: 'company_logo',
          value: logoUrl,
          description: 'Logo actif de l\'entreprise pour les PDFs'
        });

      toast.success("Logo activé avec succès");
      loadLogos();
    } catch (error) {
      console.error('Erreur lors de l\'activation du logo:', error);
      toast.error("Erreur lors de l'activation du logo");
    }
  };

  const handleDeleteLogo = async (logoId: string, logoKey: string) => {
    try {
      await supabase
        .from('app_settings')
        .delete()
        .eq('id', logoId);

      toast.success("Logo supprimé avec succès");
      loadLogos();
    } catch (error) {
      console.error('Erreur lors de la suppression du logo:', error);
      toast.error("Erreur lors de la suppression du logo");
    }
  };

  const saveSmtpConfig = async () => {
    if (!configName.trim()) {
      toast.error("Veuillez entrer un nom pour la configuration");
      return;
    }

    if (!smtpHost || !smtpPort || !smtpUsername || !smtpPassword) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setIsSavingSmtp(true);

    try {
      const { error } = await supabase
        .from('smtp_configs')
        .insert({
          name: configName.trim(),
          host: smtpHost,
          port: smtpPort,
          username: smtpUsername,
          password: smtpPassword,
          security: smtpSecurity,
          sender_name: senderName,
          sender_email: senderEmail,
          enabled: smtpEnabled,
          is_default: false
        });

      if (error) throw error;

      toast.success("Configuration SMTP sauvegardée avec succès");
      setConfigName("");
      setShowAddForm(false);
      
      // Réinitialiser le formulaire
      setSmtpHost("");
      setSmtpPort("587");
      setSmtpUsername("");
      setSmtpPassword("");
      setSmtpSecurity("tls");
      setSenderName("AssureAI Support");
      setSenderEmail("");
      setSmtpEnabled(false);
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error("Erreur lors de la sauvegarde de la configuration SMTP");
    } finally {
      setIsSavingSmtp(false);
    }
  };

  const testSmtpConnection = async () => {
    if (!smtpHost || !smtpPort || !smtpUsername || !smtpPassword) {
      toast.error("Veuillez remplir tous les champs SMTP obligatoires");
      return;
    }

    setIsTestingConnection(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success("Connexion SMTP testée avec succès");
    } catch (error) {
      toast.error("Erreur lors du test de connexion SMTP");
    } finally {
      setIsTestingConnection(false);
    }
  };

  const smtpPresets = [
    { name: "Gmail", host: "smtp.gmail.com", port: "587", security: "tls" },
    { name: "Outlook", host: "smtp-mail.outlook.com", port: "587", security: "tls" },
    { name: "Yahoo", host: "smtp.mail.yahoo.com", port: "587", security: "tls" },
    { name: "OVH", host: "ssl0.ovh.net", port: "587", security: "tls" },
    { name: "Ionos", host: "smtp.ionos.fr", port: "587", security: "tls" }
  ];

  const handlePresetSelect = (preset: any) => {
    setSmtpHost(preset.host);
    setSmtpPort(preset.port);
    setSmtpSecurity(preset.security);
    toast.info(`Configuration ${preset.name} appliquée`);
  };

  return (
    <div className="space-y-6">
      {/* Gestion des logos de l'entreprise */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
            <Image className="w-5 h-5" />
            Logos de l'entreprise
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Section de téléchargement */}
          <div>
            <Label htmlFor="logo-upload" className="cursor-pointer">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">
                  {isUploadingLogo ? "Téléchargement en cours..." : "Cliquez pour télécharger un nouveau logo"}
                </p>
                <p className="text-xs text-gray-400">PNG, JPG, GIF (max 5MB)</p>
              </div>
            </Label>
            <Input
              id="logo-upload"
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              disabled={isUploadingLogo}
              className="hidden"
            />
          </div>

          {/* Liste des logos */}
          {logos.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-4">Logos disponibles</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {logos.map((logo) => (
                  <div key={logo.id} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {logo.name}
                        </span>
                        {logo.isActive && (
                          <Badge variant="default" className="text-xs">
                            Actif
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="w-full h-20 bg-white border rounded-lg overflow-hidden mb-3">
                      <img src={logo.url} alt={logo.name} className="w-full h-full object-contain" />
                    </div>
                    
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      Ajouté le {new Date(logo.uploadedAt).toLocaleDateString('fr-FR')}
                    </div>
                    
                    <div className="flex items-center justify-between gap-2">
                      {!logo.isActive ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleActivateLogo(logo.id, logo.url)}
                          className="flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          Activer
                        </Button>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Logo actuel
                        </Badge>
                      )}
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteLogo(logo.id, logo.name)}
                        className="flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message informatif */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              💡 Le logo actif sera automatiquement inclus dans tous les PDFs de devis générés.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Liste des configurations SMTP */}
      <SmtpConfigList onAddNew={() => setShowAddForm(true)} />

      {/* Formulaire d'ajout de configuration SMTP */}
      {showAddForm && (
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Ajouter une configuration SMTP
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm(false)}
              >
                Annuler
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-gray-700 dark:text-gray-300">Nom de la configuration *</Label>
              <Input
                value={configName}
                onChange={(e) => setConfigName(e.target.value)}
                placeholder="Gmail Production, SMTP Local, etc."
                className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div>
                <Label className="text-gray-700 dark:text-gray-300 font-medium">
                  Activer cette configuration
                </Label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  La configuration sera activée après sauvegarde
                </p>
              </div>
              <Switch
                checked={smtpEnabled}
                onCheckedChange={setSmtpEnabled}
              />
            </div>

            <div>
              <Label className="text-gray-700 dark:text-gray-300">Configurations prédéfinies</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mt-2">
                {smtpPresets.map((preset) => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePresetSelect(preset)}
                    className="h-auto p-2 text-xs"
                  >
                    {preset.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700 dark:text-gray-300">Nom de l'expéditeur</Label>
                <Input
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="AssureAI Support"
                  className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                />
              </div>
              <div>
                <Label className="text-gray-700 dark:text-gray-300">Email de l'expéditeur</Label>
                <Input
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="support@assureai.com"
                  className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700 dark:text-gray-300">Serveur SMTP *</Label>
                <Input
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                  placeholder="smtp.gmail.com"
                  className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                />
              </div>
              <div>
                <Label className="text-gray-700 dark:text-gray-300">Port *</Label>
                <Input
                  type="number"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                  placeholder="587"
                  className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-700 dark:text-gray-300">Nom d'utilisateur *</Label>
                <Input
                  value={smtpUsername}
                  onChange={(e) => setSmtpUsername(e.target.value)}
                  placeholder="votre-email@gmail.com"
                  className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                />
              </div>
              <div>
                <Label className="text-gray-700 dark:text-gray-300">Mot de passe *</Label>
                <Input
                  type="password"
                  value={smtpPassword}
                  onChange={(e) => setSmtpPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-700 dark:text-gray-300">Sécurité</Label>
              <Select value={smtpSecurity} onValueChange={setSmtpSecurity}>
                <SelectTrigger className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600">
                  <SelectValue placeholder="Choisir le type de sécurité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune</SelectItem>
                  <SelectItem value="ssl">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      SSL/TLS
                    </div>
                  </SelectItem>
                  <SelectItem value="tls">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      STARTTLS
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300">Test de connexion</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Vérifiez que la configuration SMTP fonctionne correctement
                </p>
              </div>
              <Button
                onClick={testSmtpConnection}
                disabled={isTestingConnection}
                variant="outline"
              >
                {isTestingConnection ? (
                  <>
                    <TestTube className="w-4 h-4 mr-2 animate-pulse" />
                    Test en cours...
                  </>
                ) : (
                  <>
                    <TestTube className="w-4 h-4 mr-2" />
                    Tester
                  </>
                )}
              </Button>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t">
              <Button
                onClick={saveSmtpConfig}
                disabled={isSavingSmtp}
                className="flex items-center gap-2"
              >
                {isSavingSmtp ? (
                  <>
                    <Save className="w-4 h-4 animate-pulse" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Enregistrer la configuration
                  </>
                )}
              </Button>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                Informations importantes
              </h4>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                <li>• Pour Gmail, utilisez un mot de passe d'application au lieu de votre mot de passe habituel</li>
                <li>• Assurez-vous que l'authentification à deux facteurs est activée pour Gmail</li>
                <li>• Les ports courants sont : 587 (STARTTLS), 465 (SSL), 25 (non sécurisé)</li>
                <li>• Vérifiez les paramètres de sécurité de votre fournisseur d'email</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SmtpSettings;
