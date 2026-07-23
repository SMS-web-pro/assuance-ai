-- Migration complète: Création de demandes_assurance avec colonne consentement_rgpd
-- Conformité RGPD/Loi Cazenave 2026

-- Table principale pour toutes les demandes d'assurance
CREATE TABLE IF NOT EXISTS public.demandes_assurance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type_assurance TEXT NOT NULL CHECK (type_assurance IN ('auto', 'habitation', 'sante', 'moto', 'emprunteur', 'voyage')),
  statut TEXT NOT NULL DEFAULT 'nouveau' CHECK (statut IN ('nouveau', 'en_cours', 'traite', 'termine', 'archive', 'email_envoye')),
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
  priorite TEXT DEFAULT 'normale' CHECK (priorite IN ('basse', 'normale', 'haute', 'urgente')),
  consentement_rgpd JSONB DEFAULT NULL
);

-- Commentaire pour la colonne RGPD
COMMENT ON COLUMN demandes_assurance.consentement_rgpd IS 
'Preuve de consentement RGPD/Loi Cazenave: {consentement: boolean, preuve: {date: string, message_consentement: string, mention_rgpd_affichee: boolean, ip: string | null}}';

-- Table pour l'assurance auto
CREATE TABLE IF NOT EXISTS public.assurance_auto (
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
CREATE TABLE IF NOT EXISTS public.assurance_habitation (
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
CREATE TABLE IF NOT EXISTS public.assurance_sante (
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
CREATE TABLE IF NOT EXISTS public.assurance_moto (
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
CREATE TABLE IF NOT EXISTS public.assurance_emprunteur (
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
CREATE TABLE IF NOT EXISTS public.assurance_voyage (
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

-- Table pour les rappels clients
CREATE TABLE IF NOT EXISTS public.rappels_clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  demande_id UUID NOT NULL REFERENCES public.demandes_assurance(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  description TEXT,
  date_rappel TIMESTAMP WITH TIME ZONE NOT NULL,
  type_rappel TEXT DEFAULT 'rappele',
  statut TEXT DEFAULT 'planifie' CHECK (statut IN ('planifie', 'en_cours', 'termine', 'annule')),
  created_by TEXT,
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  email_subject TEXT,
  email_content TEXT,
  send_automatically BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les configurations SMTP
CREATE TABLE IF NOT EXISTS public.smtp_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  host TEXT NOT NULL,
  port TEXT NOT NULL,
  security TEXT DEFAULT 'tls',
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  sender_name TEXT,
  sender_email TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les paramètres applicatifs
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table pour les conseillers
CREATE TABLE IF NOT EXISTS public.conseillers (
  id SERIAL PRIMARY KEY,
  nom TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  telephone TEXT,
  specialite TEXT,
  statut TEXT DEFAULT 'En ligne' CHECK (statut IN ('En ligne', 'Hors ligne', 'En pause')),
  date_embauche DATE,
  competences TEXT[],
  objectif_mensuel INTEGER DEFAULT 0,
  demandsactuelles INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Triggers pour mise à jour automatique
CREATE OR REPLACE FUNCTION update_modified_time()
RETURNS TRIGGER AS $$
BEGIN
    NEW.date_modification = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
DROP TRIGGER IF EXISTS update_demandes_assurance_modtime ON public.demandes_assurance;
CREATE TRIGGER update_demandes_assurance_modtime
    BEFORE UPDATE ON public.demandes_assurance
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_time();

DROP TRIGGER IF EXISTS update_rappels_clients_updated_at ON public.rappels_clients;
CREATE TRIGGER update_rappels_clients_updated_at
    BEFORE UPDATE ON public.rappels_clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_smtp_configs_updated_at ON public.smtp_configs;
CREATE TRIGGER update_smtp_configs_updated_at
    BEFORE UPDATE ON public.smtp_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_settings_updated_at ON public.app_settings;
CREATE TRIGGER update_app_settings_updated_at
    BEFORE UPDATE ON public.app_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conseillers_updated_at ON public.conseillers;
CREATE TRIGGER update_conseillers_updated_at
    BEFORE UPDATE ON public.conseillers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Activation RLS
ALTER TABLE public.demandes_assurance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assurance_auto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assurance_habitation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assurance_sante ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assurance_moto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assurance_emprunteur ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assurance_voyage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rappels_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smtp_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conseillers ENABLE ROW LEVEL SECURITY;

-- Politiques RLS (accès public pour développement)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permettre toutes les opérations sur demandes_assurance' AND tablename = 'demandes_assurance') THEN
    CREATE POLICY "Permettre toutes les opérations sur demandes_assurance" ON public.demandes_assurance FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permettre toutes les opérations sur assurance_auto' AND tablename = 'assurance_auto') THEN
    CREATE POLICY "Permettre toutes les opérations sur assurance_auto" ON public.assurance_auto FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permettre toutes les opérations sur assurance_habitation' AND tablename = 'assurance_habitation') THEN
    CREATE POLICY "Permettre toutes les opérations sur assurance_habitation" ON public.assurance_habitation FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permettre toutes les opérations sur assurance_sante' AND tablename = 'assurance_sante') THEN
    CREATE POLICY "Permettre toutes les opérations sur assurance_sante" ON public.assurance_sante FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permettre toutes les opérations sur assurance_moto' AND tablename = 'assurance_moto') THEN
    CREATE POLICY "Permettre toutes les opérations sur assurance_moto" ON public.assurance_moto FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permettre toutes les opérations sur assurance_emprunteur' AND tablename = 'assurance_emprunteur') THEN
    CREATE POLICY "Permettre toutes les opérations sur assurance_emprunteur" ON public.assurance_emprunteur FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permettre toutes les opérations sur assurance_voyage' AND tablename = 'assurance_voyage') THEN
    CREATE POLICY "Permettre toutes les opérations sur assurance_voyage" ON public.assurance_voyage FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permettre toutes les opérations sur rappels_clients' AND tablename = 'rappels_clients') THEN
    CREATE POLICY "Permettre toutes les opérations sur rappels_clients" ON public.rappels_clients FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permettre toutes les opérations sur smtp_configs' AND tablename = 'smtp_configs') THEN
    CREATE POLICY "Permettre toutes les opérations sur smtp_configs" ON public.smtp_configs FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permettre toutes les opérations sur app_settings' AND tablename = 'app_settings') THEN
    CREATE POLICY "Permettre toutes les opérations sur app_settings" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Permettre toutes les opérations sur conseillers' AND tablename = 'conseillers') THEN
    CREATE POLICY "Permettre toutes les opérations sur conseillers" ON public.conseillers FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_demandes_type_assurance ON public.demandes_assurance(type_assurance);
CREATE INDEX IF NOT EXISTS idx_demandes_statut ON public.demandes_assurance(statut);
CREATE INDEX IF NOT EXISTS idx_demandes_date_creation ON public.demandes_assurance(date_creation);
CREATE INDEX IF NOT EXISTS idx_demandes_email ON public.demandes_assurance(email);
CREATE INDEX IF NOT EXISTS idx_demandes_telephone ON public.demandes_assurance(telephone);
CREATE INDEX IF NOT EXISTS idx_rappels_date ON public.rappels_clients(date_rappel);
CREATE INDEX IF NOT EXISTS idx_rappels_statut ON public.rappels_clients(statut);
