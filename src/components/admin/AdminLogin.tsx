
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Shield } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log('Tentative de connexion admin avec:', email);
      
      // Connexion via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (authError) {
        console.error('Erreur authentification:', authError);
        toast.error("Email ou mot de passe incorrect");
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        toast.error("Erreur de connexion");
        setIsLoading(false);
        return;
      }

      console.log('Authentification réussie, vérification des droits admin...');

      // Vérifier si l'utilisateur est admin (email spécifique ou rôle)
      const adminEmails = ['admin@assur.com', 'admin@assuranceia.com', 'admin@example.com', 'sahabyoussef@gmail.com', 'demo.admin@gmail.com'];
      const isAdmin = adminEmails.includes(email.trim().toLowerCase());

      if (!isAdmin) {
        console.log('Utilisateur non autorisé pour l\'administration');
        await supabase.auth.signOut();
        toast.error("Accès non autorisé - Vous n'êtes pas administrateur");
        setIsLoading(false);
        return;
      }

      console.log('Connexion admin réussie');

      // Stocker les informations de session admin
      localStorage.setItem('admin_session', JSON.stringify({
        user_id: authData.user.id,
        email: authData.user.email,
        role: 'admin',
        login_time: new Date().toISOString()
      }));

      toast.success("Connexion administrateur réussie !");
      window.location.reload();
    } catch (error) {
      console.error('Erreur de connexion admin:', error);
      toast.error("Erreur lors de la connexion");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-black p-3 rounded-full">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Administration
          </CardTitle>
          <p className="text-gray-600">
            Connexion sécurisée administrateur
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email administrateur</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="demo.admin@gmail.com"
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
                  placeholder="Votre mot de passe sécurisé"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-black hover:bg-gray-800"
              disabled={isLoading}
            >
              {isLoading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Accès réservé aux administrateurs autorisés
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
