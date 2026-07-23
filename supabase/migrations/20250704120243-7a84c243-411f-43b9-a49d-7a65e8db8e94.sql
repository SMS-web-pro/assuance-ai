
-- Table principale pour toutes les demandes d'assurance
CREATE TABLE public.demandes_assurance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type_assurance TEXT NOT NULL CHECK (type_assurance IN ('auto', 'habitation', 'sante', 'moto', 'emprunteur', 'voyage')),
  statut TEXT NOT NULL DEFAULT 'nouveau' CHECK (statut IN ('nouveau', 'en_cours', 'traite', 'archive')),
  nom TEXT,
  prenom TEXT,
  email TEXT,
  telephone TEXT,
  date_naissance DATE,
  adresse_complete TEXT,
  code_postal TEXT,
  donnees_specifiques JSONB NOT NULL DEFAULT '{}',
  notes_conseiller TEXT,
  conseiller_assigne TEXT,
  date_creation TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  date_modification TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  date_contact TIMESTAMP WITH TIME ZONE,
  priorite TEXT DEFAULT 'normale' CHECK (priorite IN ('basse', 'normale', 'haute', 'urgente'))
);

-- Table pour l'assurance auto
CREATE TABLE public.assurance_auto (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  demande_id UUID NOT NULL REFERENCES public.demandes_assurance(id) ON DELETE CASCADE,
  marque_vehicule TEXT,
  modele_vehicule TEXT,
  annee_circulation INTEGER,
  type_carburant TEXT,
  usage_vehicule TEXT CHECK (usage_vehicule IN ('prive', 'professionnel', 'mixte')),
  bonus_malus TEXT,
  antecedents_assurance TEXT,
  options_souhaitees TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour l'assurance habitation
CREATE TABLE public.assurance_habitation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  demande_id UUID NOT NULL REFERENCES public.demandes_assurance(id) ON DELETE CASCADE,
  type_logement TEXT CHECK (type_logement IN ('maison', 'appartement')),
  usage_logement TEXT CHECK (usage_logement IN ('residence_principale', 'residence_secondaire', 'location')),
  superficie_m2 INTEGER,
  nombre_pieces INTEGER,
  annee_construction INTEGER,
  systeme_securite BOOLEAN DEFAULT FALSE,
  valeur_biens_euros DECIMAL(10,2),
  antecedents_sinistres TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour l'assurance santé
CREATE TABLE public.assurance_sante (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  demande_id UUID NOT NULL REFERENCES public.demandes_assurance(id) ON DELETE CASCADE,
  situation_familiale TEXT,
  profession TEXT,
  regime_securite_sociale TEXT,
  couverture_actuelle TEXT,
  besoins_specifiques TEXT[],
  nombre_personnes_assurer INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour l'assurance moto
CREATE TABLE public.assurance_moto (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  demande_id UUID NOT NULL REFERENCES public.demandes_assurance(id) ON DELETE CASCADE,
  type_deux_roues TEXT,
  cylindree INTEGER,
  marque_modele TEXT,
  annee_circulation INTEGER,
  usage_moto TEXT CHECK (usage_moto IN ('quotidien', 'loisirs', 'mixte')),
  bonus_malus TEXT,
  antecedents_assurance TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour l'assurance emprunteur
CREATE TABLE public.assurance_emprunteur (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  demande_id UUID NOT NULL REFERENCES public.demandes_assurance(id) ON DELETE CASCADE,
  situation_professionnelle TEXT,
  montant_pret DECIMAL(12,2),
  duree_pret_mois INTEGER,
  type_bien_finance TEXT,
  etat_sante TEXT CHECK (etat_sante IN ('bon', 'suivi', 'ald')),
  couvertures_souhaitees TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour l'assurance voyage
CREATE TABLE public.assurance_voyage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  demande_id UUID NOT NULL REFERENCES public.demandes_assurance(id) ON DELETE CASCADE,
  destination TEXT,
  date_depart DATE,
  date_retour DATE,
  motif_voyage TEXT CHECK (motif_voyage IN ('tourisme', 'affaires', 'etudes')),
  nombre_voyageurs INTEGER,
  ages_voyageurs INTEGER[],
  couvertures_souhaitees TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trigger pour mettre à jour automatiquement date_modification
CREATE OR REPLACE FUNCTION update_modified_time()
RETURNS TRIGGER AS $$
BEGIN
    NEW.date_modification = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_demandes_assurance_modtime
    BEFORE UPDATE ON public.demandes_assurance
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_time();

-- RLS (Row Level Security) - Permet l'accès public pour l'instant
ALTER TABLE public.demandes_assurance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assurance_auto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assurance_habitation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assurance_sante ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assurance_moto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assurance_emprunteur ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assurance_voyage ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour permettre l'accès public (à ajuster selon vos besoins de sécurité)
CREATE POLICY "Permettre toutes les opérations sur demandes_assurance" ON public.demandes_assurance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permettre toutes les opérations sur assurance_auto" ON public.assurance_auto FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permettre toutes les opérations sur assurance_habitation" ON public.assurance_habitation FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permettre toutes les opérations sur assurance_sante" ON public.assurance_sante FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permettre toutes les opérations sur assurance_moto" ON public.assurance_moto FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permettre toutes les opérations sur assurance_emprunteur" ON public.assurance_emprunteur FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permettre toutes les opérations sur assurance_voyage" ON public.assurance_voyage FOR ALL USING (true) WITH CHECK (true);

-- Index pour optimiser les performances
CREATE INDEX idx_demandes_type_assurance ON public.demandes_assurance(type_assurance);
CREATE INDEX idx_demandes_statut ON public.demandes_assurance(statut);
CREATE INDEX idx_demandes_date_creation ON public.demandes_assurance(date_creation);
CREATE INDEX idx_demandes_email ON public.demandes_assurance(email);
CREATE INDEX idx_demandes_telephone ON public.demandes_assurance(telephone);
