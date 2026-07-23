
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Eye, EyeOff, Edit2, Check, X } from "lucide-react";
import { toast } from "sonner";

interface ApiKey {
  id: number;
  name: string;
  key: string;
  service: string;
  enabled: boolean;
  created_at: string;
}

interface ApiKeysSectionProps {
  apiKeys: ApiKey[];
  setApiKeys: (keys: ApiKey[]) => void;
}

// Modèles IA disponibles pour le chatbot d'assurance
const AI_MODELS = [
  { value: "openai-gpt-4", label: "OpenAI GPT-4" },
  { value: "openai-gpt-3.5-turbo", label: "OpenAI GPT-3.5 Turbo" },
  { value: "anthropic-claude-3", label: "Anthropic Claude 3" },
  { value: "anthropic-claude-2", label: "Anthropic Claude 2" },
  { value: "google-gemini-pro", label: "Google Gemini Pro" },
  { value: "google-palm-2", label: "Google PaLM 2" },
  { value: "cohere-command", label: "Cohere Command" },
  { value: "huggingface-llama", label: "Hugging Face LLaMA" },
  { value: "mistral-7b", label: "Mistral 7B" },
  { value: "perplexity-ai", label: "Perplexity AI" },
  { value: "deepseek-coder", label: "DeepSeek Coder" },
  { value: "azure-openai", label: "Azure OpenAI" }
];

const ApiKeysSection = ({ apiKeys, setApiKeys }: ApiKeysSectionProps) => {
  const [newApiKey, setNewApiKey] = useState({ name: '', key: '', service: '' });
  const [showKeys, setShowKeys] = useState<{[key: number]: boolean}>({});
  const [editingKey, setEditingKey] = useState<number | null>(null);
  const [editData, setEditData] = useState({ name: '', service: '' });

  const addApiKey = () => {
    if (newApiKey.name && newApiKey.key && newApiKey.service) {
      const newKey: ApiKey = {
        ...newApiKey,
        id: Date.now(),
        enabled: true,
        created_at: new Date().toISOString()
      };
      setApiKeys([...apiKeys, newKey]);
      setNewApiKey({ name: '', key: '', service: '' });
      toast.success("Clé API ajoutée avec succès");
    } else {
      toast.error("Veuillez remplir tous les champs");
    }
  };

  const removeApiKey = (id: number) => {
    setApiKeys(apiKeys.filter(key => key.id !== id));
    toast.success("Clé API supprimée");
  };

  const toggleApiKey = (id: number) => {
    setApiKeys(apiKeys.map(key => 
      key.id === id ? { ...key, enabled: !key.enabled } : key
    ));
    const key = apiKeys.find(k => k.id === id);
    toast.success(`Clé API ${key?.enabled ? 'désactivée' : 'activée'}`);
  };

  const toggleShowKey = (id: number) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const startEditing = (key: ApiKey) => {
    setEditingKey(key.id);
    setEditData({ name: key.name, service: key.service });
  };

  const saveEdit = (id: number) => {
    setApiKeys(apiKeys.map(key => 
      key.id === id ? { ...key, name: editData.name, service: editData.service } : key
    ));
    setEditingKey(null);
    toast.success("Clé API modifiée");
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditData({ name: '', service: '' });
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return key;
    return key.substring(0, 4) + '•'.repeat(key.length - 8) + key.substring(key.length - 4);
  };

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="text-gray-900 dark:text-white flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          Clés API - Chatbot Agents IA d'Assurance
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Gérez les clés API pour les différents modèles d'IA utilisés par vos agents d'assurance
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formulaire d'ajout */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Ajouter une nouvelle clé API
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-gray-700 dark:text-gray-300">Nom de la clé</Label>
              <Input
                value={newApiKey.name}
                onChange={(e) => setNewApiKey({...newApiKey, name: e.target.value})}
                placeholder="Ex: OpenAI Production"
                className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
              />
            </div>
            <div>
              <Label className="text-gray-700 dark:text-gray-300">Modèle IA</Label>
              <Select
                value={newApiKey.service}
                onValueChange={(value) => setNewApiKey({...newApiKey, service: value})}
              >
                <SelectTrigger className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600">
                  <SelectValue placeholder="Sélectionner un modèle IA" />
                </SelectTrigger>
                <SelectContent>
                  {AI_MODELS.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-700 dark:text-gray-300">Clé API</Label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={newApiKey.key}
                  onChange={(e) => setNewApiKey({...newApiKey, key: e.target.value})}
                  placeholder="sk-..."
                  className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                />
                <Button onClick={addApiKey} size="sm" className="px-3">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Liste des clés API */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            Clés API configurées ({apiKeys.length})
          </h3>
          
          {apiKeys.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <Plus className="w-6 h-6" />
              </div>
              <p>Aucune clé API configurée</p>
              <p className="text-xs">Ajoutez votre première clé API pour commencer</p>
            </div>
          ) : (
            apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex-1 min-w-0">
                  {editingKey === apiKey.id ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        value={editData.name}
                        onChange={(e) => setEditData({...editData, name: e.target.value})}
                        className="text-sm"
                        placeholder="Nom de la clé"
                      />
                      <Select
                        value={editData.service}
                        onValueChange={(value) => setEditData({...editData, service: value})}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {AI_MODELS.map((model) => (
                            <SelectItem key={model.value} value={model.value}>
                              {model.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {apiKey.name}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          apiKey.enabled 
                            ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                            : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                        }`}>
                          {apiKey.enabled ? 'Activé' : 'Désactivé'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-blue-600 dark:text-blue-400">
                          {AI_MODELS.find(m => m.value === apiKey.service)?.label || apiKey.service}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                          {showKeys[apiKey.id] ? apiKey.key : maskKey(apiKey.key)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Ajoutée le {new Date(apiKey.created_at).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  {editingKey === apiKey.id ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => saveEdit(apiKey.id)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={cancelEdit}
                        className="text-gray-600 hover:text-gray-700"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleShowKey(apiKey.id)}
                        className="text-gray-600 hover:text-gray-700"
                      >
                        {showKeys[apiKey.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(apiKey)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={apiKey.enabled}
                          onCheckedChange={() => toggleApiKey(apiKey.id)}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeApiKey(apiKey.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Informations sur l'utilisation */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            💡 Informations importantes
          </h4>
          <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Les clés API sont utilisées par les agents IA pour les différents types d'assurance</li>
            <li>• Seules les clés activées seront utilisées par le système</li>
            <li>• Vos clés sont stockées de manière sécurisée et chiffrées</li>
            <li>• Vous pouvez avoir plusieurs clés pour le même modèle (backup, quotas différents)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiKeysSection;
