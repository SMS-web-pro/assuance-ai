-- Création de l'utilisateur administrateur
-- Email: admin@assur.com
-- Mot de passe: admin@@1234

-- 1. Activer l'extension pgcrypto si nécessaire (pour gen_salt et crypt)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Créer l'utilisateur dans auth.users
DO $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Générer un UUID pour le nouvel utilisateur
  new_user_id := gen_random_uuid();

  -- Insérer dans auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'admin',
    'admin@assur.com',
    crypt('admin@@1234', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"admin","full_name":"Admin AssurAI"}',
    now(),
    now()
  );

  -- Insérer dans auth.identities (nécessaire pour l'authentification)
  INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    new_user_id,
    'admin@assur.com',
    jsonb_build_object(
      'sub', new_user_id::text,
      'email', 'admin@assur.com',
      'email_verified', true
    ),
    'email',
    now(),
    now(),
    now()
  );

  -- Insérer dans auth.sessions (optionnel, crée une session active)
  INSERT INTO auth.sessions (
    id,
    user_id,
    created_at,
    updated_at,
    factor_id,
    aal,
    not_after
  ) VALUES (
    gen_random_uuid(),
    new_user_id,
    now(),
    now(),
    NULL,
    'aal1',
    now() + INTERVAL '7 days'
  );

  RAISE NOTICE 'Admin user created successfully with ID: %', new_user_id;
END $$;

-- 3. Vérifier que l'utilisateur a été créé
SELECT 
  id,
  email,
  role,
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email = 'admin@assur.com';
