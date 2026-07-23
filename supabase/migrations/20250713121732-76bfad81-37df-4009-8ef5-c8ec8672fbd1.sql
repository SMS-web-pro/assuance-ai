
-- Supprimer l'ancienne contrainte qui ne permet pas 'archive'
ALTER TABLE demandes_assurance DROP CONSTRAINT IF EXISTS demandes_assurance_statut_check;

-- Créer une nouvelle contrainte qui inclut 'archive'
ALTER TABLE demandes_assurance ADD CONSTRAINT demandes_assurance_statut_check 
CHECK (statut IN ('nouveau', 'en_cours', 'traite', 'termine', 'archive'));

-- Mettre à jour la fonction de mise à jour automatique de la date de modification
CREATE OR REPLACE FUNCTION update_demande_modification_date()
RETURNS TRIGGER AS $$
BEGIN
    NEW.date_modification = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger pour mettre à jour automatiquement date_modification
DROP TRIGGER IF EXISTS update_demande_modification_trigger ON demandes_assurance;
CREATE TRIGGER update_demande_modification_trigger
    BEFORE UPDATE ON demandes_assurance
    FOR EACH ROW
    EXECUTE FUNCTION update_demande_modification_date();
