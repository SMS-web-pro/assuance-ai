
-- Créer une table pour stocker les rappels clients
CREATE TABLE public.rappels_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  demande_id UUID REFERENCES public.demandes_assurance(id) ON DELETE CASCADE NOT NULL,
  titre TEXT NOT NULL,
  description TEXT,
  date_rappel TIMESTAMP WITH TIME ZONE NOT NULL,
  statut TEXT NOT NULL DEFAULT 'planifie' CHECK (statut IN ('planifie', 'termine', 'annule')),
  type_rappel TEXT NOT NULL DEFAULT 'general' CHECK (type_rappel IN ('appel', 'email', 'rdv', 'general')),
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Activer RLS
ALTER TABLE public.rappels_clients ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour permettre toutes les opérations (comme les autres tables)
CREATE POLICY "Permettre toutes les opérations sur rappels_clients"
  ON public.rappels_clients
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Créer un trigger pour mettre à jour updated_at
CREATE TRIGGER update_rappels_clients_updated_at
  BEFORE UPDATE ON public.rappels_clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index pour améliorer les performances
CREATE INDEX idx_rappels_clients_demande_id ON public.rappels_clients(demande_id);
CREATE INDEX idx_rappels_clients_date_rappel ON public.rappels_clients(date_rappel);
CREATE INDEX idx_rappels_clients_statut ON public.rappels_clients(statut);
