-- Fonction pour créer le premier administrateur
-- À exécuter manuellement après la migration
DO $$
DECLARE
  admin_email TEXT := 'admin@example.com';  -- Remplacez par l'email souhaité
  admin_name TEXT := 'Admin Principal';     -- Remplacez par le nom souhaité
  new_user_id UUID;
  new_admin_id UUID;
BEGIN
  -- Vérifier si la table admin_users existe
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_users') THEN
    RAISE EXCEPTION 'La table admin_users n''existe pas. Exécutez d''abord la migration précédente.';
  END IF;
  
  -- Vérifier si un administrateur existe déjà
  IF EXISTS (SELECT 1 FROM public.admin_users LIMIT 1) THEN
    RAISE NOTICE 'Un administrateur existe déjà dans la table admin_users. Aucune action nécessaire.';
    RETURN;
  END IF;
  
  -- Vérifier si l'utilisateur existe déjà dans auth.users
  SELECT id INTO new_user_id FROM auth.users WHERE email = admin_email LIMIT 1;
  
  -- Créer l'utilisateur s'il n'existe pas
  IF new_user_id IS NULL THEN
    -- Insérer dans auth.users
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      confirmation_token, confirmation_sent_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      admin_email,
      '', -- Le mot de passe sera défini via le lien d'invitation
      NOW(),
      encode(gen_random_bytes(16), 'hex'),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('name', admin_name, 'provider', 'email'),
      NOW(),
      NOW()
    ) RETURNING id INTO new_user_id;
    
    -- Insérer dans auth.identities
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      new_user_id,
      jsonb_build_object('sub', new_user_id::text, 'email', admin_email),
      'email',
      NOW(),
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Nouvel utilisateur créé avec l''ID: %', new_user_id;
  ELSE
    RAISE NOTICE 'Utilisation de l''utilisateur existant avec l''ID: %', new_user_id;
  END IF;
  
  -- Ajouter à la table admin_users
  INSERT INTO public.admin_users (user_id, email, full_name, is_super_admin, created_at, updated_at)
  VALUES (
    new_user_id,
    admin_email,
    admin_name,
    TRUE, -- Premier admin est un super admin
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    is_super_admin = TRUE,
    updated_at = NOW()
  RETURNING id INTO new_admin_id;
  
  -- Envoyer l'invitation par email
  PERFORM auth.invite_user(admin_email);
  
  RAISE NOTICE 'Administrateur créé avec succès. ID: %', new_admin_id;
  RAISE NOTICE 'Un email d''invitation a été envoyé à %', admin_email;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Erreur lors de la création de l''administrateur: %', SQLERRM;
END $$;
