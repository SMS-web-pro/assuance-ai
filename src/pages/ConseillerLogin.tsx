
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const ConseillerLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Tentative de connexion avec Supabase Auth pour:', email);

      // Connexion via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password
      });

      if (authError) {
        console.error('Erreur authentification:', authError);
        toast.error("Email ou mot de passe incorrect");
        return;
      }

      if (!authData.user) {
        toast.error("Erreur de connexion");
        return;
      }

      console.log('Authentification réussie, recherche du conseiller...');

      // Vérifier si l'utilisateur est un conseiller
      const { data: conseiller, error: conseillerError } = await supabase
        .from('conseillers')
        .select('*')
        .ilike('email', email.trim())
        .maybeSingle();

      if (conseillerError) {
        console.error('Erreur lors de la recherche du conseiller:', conseillerError);
        await supabase.auth.signOut();
        toast.error("Erreur lors de la vérification du compte");
        return;
      }

      if (!conseiller) {
        console.log('Utilisateur non trouvé dans la table conseillers');
        // Déconnecter l'utilisateur si ce n'est pas un conseiller
        await supabase.auth.signOut();
        toast.error("Accès non autorisé - Vous n'êtes pas un conseiller");
        return;
      }

      console.log('Connexion réussie pour le conseiller:', conseiller.nom);

      // Stocker les informations de session
      localStorage.setItem('conseiller_session', JSON.stringify({
        id: conseiller.id,
        nom: conseiller.nom,
        email: conseiller.email,
        specialite: conseiller.specialite,
        auth_user_id: authData.user.id
      }));

      toast.success(`Bienvenue ${conseiller.nom} !`);
      window.location.href = "/conseiller-dashboard";

    } catch (error) {
      console.error('Erreur de connexion:', error);
      toast.error("Erreur lors de la connexion");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-full">
              <User className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Panel Conseiller
          </CardTitle>
          <p className="text-gray-600">
            Connectez-vous à votre espace conseiller
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="votre.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Votre mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-blue-600 hover:bg-blue-700" 
              disabled={isLoading}
            >
              {isLoading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConseillerLogin;
