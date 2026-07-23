
-- Créer la table app_settings si elle n'existe pas déjà
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Activer RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre à tous les utilisateurs authentifiés de lire/écrire
CREATE POLICY "Allow all operations on app_settings" ON public.app_settings
  FOR ALL USING (true) WITH CHECK (true);

-- Insérer les paramètres par défaut s'ils n'existent pas
INSERT INTO public.app_settings (key, value, description) VALUES
  ('smtp_enabled', 'false', 'Enable SMTP email sending'),
  ('smtp_host', '', 'SMTP server hostname'),
  ('smtp_port', '587', 'SMTP server port'),
  ('smtp_username', '', 'SMTP username'),
  ('smtp_password', '', 'SMTP password'),
  ('smtp_security', 'tls', 'SMTP security type (ssl, tls, none)'),
  ('sender_name', 'AssureAI Support', 'Default sender name'),
  ('sender_email', '', 'Default sender email address'),
  ('company_logo', '', 'Company logo URL for PDF generation')
ON CONFLICT (key) DO NOTHING;

-- Créer le trigger pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_app_settings_updated_at 
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Créer le bucket de stockage public
INSERT INTO storage.buckets (id, name, public) VALUES ('public', 'public', true);

-- Politique de stockage pour permettre à tous d'uploader et lire
CREATE POLICY "Allow all operations on public bucket" ON storage.objects
  FOR ALL USING (bucket_id = 'public') WITH CHECK (bucket_id = 'public');
