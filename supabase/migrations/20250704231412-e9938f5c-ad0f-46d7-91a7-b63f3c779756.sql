
-- Créer la table conseillers
CREATE TABLE public.conseillers (
  id SERIAL PRIMARY KEY,
  nom TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  telephone TEXT,
  specialite TEXT,
  statut TEXT NOT NULL DEFAULT 'En ligne',
  date_embauche DATE,
  competences TEXT[],
  objectif_mensuel INTEGER DEFAULT 0,
  demandsActuelles INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer Row Level Security
ALTER TABLE public.conseillers ENABLE ROW LEVEL SECURITY;

-- Créer une politique pour permettre toutes les opérations sur conseillers
CREATE POLICY "Permettre toutes les opérations sur conseillers" 
  ON public.conseillers 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Créer un trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_conseillers_updated_at
  BEFORE UPDATE ON public.conseillers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insérer quelques données d'exemple
INSERT INTO public.conseillers (nom, email, telephone, specialite, statut, date_embauche, competences, objectif_mensuel, demandsActuelles) VALUES
('Jean Dupont', 'jean.dupont@example.com', '0123456789', 'Auto', 'En ligne', '2023-01-15', ARRAY['Assurance Auto', 'Négociation'], 50, 12),
('Marie Martin', 'marie.martin@example.com', '0123456790', 'Habitation', 'En ligne', '2023-02-20', ARRAY['Assurance Habitation', 'Conseil'], 45, 8),
('Pierre Moreau', 'pierre.moreau@example.com', '0123456791', 'Santé', 'Absent', '2022-12-10', ARRAY['Assurance Santé', 'Analyse'], 40, 15);
