
-- Créer la table smtp_configs pour stocker les configurations SMTP
CREATE TABLE IF NOT EXISTS public.smtp_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  host TEXT NOT NULL,
  port TEXT NOT NULL,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  security TEXT NOT NULL DEFAULT 'tls',
  sender_name TEXT,
  sender_email TEXT,
  enabled BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Activer RLS
ALTER TABLE public.smtp_configs ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre à tous les utilisateurs authentifiés de lire/écrire
CREATE POLICY "Allow all operations on smtp_configs" ON public.smtp_configs
  FOR ALL USING (true) WITH CHECK (true);

-- Créer le trigger pour updated_at
CREATE TRIGGER update_smtp_configs_updated_at 
  BEFORE UPDATE ON public.smtp_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- S'assurer qu'il n'y a qu'une seule configuration par défaut à la fois
CREATE OR REPLACE FUNCTION ensure_single_default_smtp() 
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    UPDATE smtp_configs SET is_default = FALSE WHERE id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_smtp_trigger
  AFTER INSERT OR UPDATE ON public.smtp_configs
  FOR EACH ROW
  WHEN (NEW.is_default = TRUE)
  EXECUTE FUNCTION ensure_single_default_smtp();
