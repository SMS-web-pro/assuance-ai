
-- Ajouter des champs pour l'envoi automatique d'emails
ALTER TABLE public.rappels_clients 
ADD COLUMN email_subject TEXT,
ADD COLUMN email_content TEXT,
ADD COLUMN email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN send_automatically BOOLEAN DEFAULT FALSE,
ADD COLUMN email_sent_at TIMESTAMP WITH TIME ZONE;

-- Index pour trouver les emails à envoyer
CREATE INDEX idx_rappels_clients_automated_email 
ON public.rappels_clients(date_rappel, send_automatically, email_sent) 
WHERE send_automatically = true AND email_sent = false;
