
-- Table principale pour stocker toutes les demandes de devis
CREATE TABLE public.demandes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_nom TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_telephone TEXT NOT NULL,
  type_assurance TEXT NOT NULL CHECK (type_assurance IN ('Auto', 'Habitation', 'Santé', 'Moto', 'Emprunteur', 'Voyage')),
  statut TEXT NOT NULL DEFAULT 'En attente' CHECK (statut IN ('En attente', 'En cours', 'Terminé', 'Annulé')),
  priorite TEXT NOT NULL DEFAULT 'Normale' CHECK (priorite IN ('Basse', 'Normale', 'Haute')),
  conseiller TEXT DEFAULT 'Non assigné',
  budget TEXT,
  commentaire TEXT,
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour améliorer les performances de recherche
CREATE INDEX idx_demandes_type_assurance ON public.demandes(type_assurance);
CREATE INDEX idx_demandes_statut ON public.demandes(statut);
CREATE INDEX idx_demandes_created_at ON public.demandes(created_at DESC);
CREATE INDEX idx_demandes_client_email ON public.demandes(client_email);

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_demandes_updated_at 
    BEFORE UPDATE ON public.demandes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Activer RLS (Row Level Security) - optionnel selon vos besoins
ALTER TABLE public.demandes ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour permettre la lecture à tous (vous pouvez ajuster selon vos besoins)
CREATE POLICY "Allow read access to demandes" ON public.demandes
    FOR SELECT USING (true);

-- Politique RLS pour permettre l'insertion à tous (vous pouvez ajuster selon vos besoins)
CREATE POLICY "Allow insert access to demandes" ON public.demandes
    FOR INSERT WITH CHECK (true);

-- Politique RLS pour permettre la mise à jour à tous (vous pouvez ajuster selon vos besoins)
CREATE POLICY "Allow update access to demandes" ON public.demandes
    FOR UPDATE USING (true);
