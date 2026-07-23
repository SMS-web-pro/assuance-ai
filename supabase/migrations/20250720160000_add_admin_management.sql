-- Enable Row Level Security
ALTER TABLE IF EXISTS public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    is_super_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id),
    UNIQUE(email)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);

-- Add RLS policies
DROP POLICY IF EXISTS "Enable read access for admins" ON public.admin_users;
CREATE POLICY "Enable read access for admins" 
ON public.admin_users 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.admin_users au 
    WHERE au.user_id = auth.uid()
  )
);

-- Only super admins can modify admin users
DROP POLICY IF EXISTS "Enable insert for super admins" ON public.admin_users;
CREATE POLICY "Enable insert for super admins" 
ON public.admin_users 
FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE user_id = auth.uid() AND is_super_admin = true
  )
);

-- Function to check if a user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = is_admin.user_id
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function to check if a user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users 
    WHERE admin_users.user_id = is_super_admin.user_id 
    AND is_super_admin = true
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Enable necessary extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create admin management functions
CREATE OR REPLACE FUNCTION public.add_admin(
  admin_email TEXT,
  admin_name TEXT,
  make_super_admin BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
  new_admin_id UUID;
  user_exists BOOLEAN;
BEGIN
  -- Check if user already exists in auth.users
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE email = admin_email) INTO user_exists;
  
  -- If user doesn't exist, create a new one using auth.users table
  IF NOT user_exists THEN
    -- Insert into auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_token,
      confirmation_sent_at,
      recovery_token,
      recovery_sent_at,
      email_change_token_new,
      email_change,
      email_change_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      phone,
      phone_confirmed_at,
      phone_change,
      phone_change_token,
      phone_change_sent_at,
      email_change_token_current,
      email_change_confirm_status,
      banned_until,
      reauthentication_token,
      reauthentication_sent_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', -- instance_id
      uuid_generate_v4(), -- id
      'authenticated', -- aud
      'authenticated', -- role
      admin_email, -- email
      '', -- encrypted_password (will be set by Supabase Auth)
      NOW(), -- email_confirmed_at
      '', -- confirmation_token
      NOW(), -- confirmation_sent_at
      '', -- recovery_token
      NULL, -- recovery_sent_at
      '', -- email_change_token_new
      '', -- email_change
      NULL, -- email_change_sent_at
      NULL, -- last_sign_in_at
      '{}', -- raw_app_meta_data
      jsonb_build_object('provider', 'email', 'providers', ARRAY['email'], 'name', admin_name), -- raw_user_meta_data
      false, -- is_super_admin
      NOW(), -- created_at
      NOW(), -- updated_at
      NULL, -- phone
      NULL, -- phone_confirmed_at
      '', -- phone_change
      '', -- phone_change_token
      NULL, -- phone_change_sent_at
      '', -- email_change_token_current
      0, -- email_change_confirm_status
      NULL, -- banned_until
      '', -- reauthentication_token
      NULL -- reauthentication_sent_at
    ) RETURNING id INTO new_user_id;
    
    -- Insert into auth.identities
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      uuid_generate_v4(),
      new_user_id,
      jsonb_build_object('sub', new_user_id::text, 'email', admin_email),
      'email',
      NOW(),
      NOW(),
      NOW()
    );
  ELSE
    -- Get existing user ID
    SELECT id INTO new_user_id FROM auth.users WHERE email = admin_email LIMIT 1;
  END IF;
  
  -- Add to admin_users
  INSERT INTO public.admin_users (user_id, email, full_name, is_super_admin, created_at, updated_at)
  VALUES (
    new_user_id, 
    admin_email, 
    admin_name, 
    COALESCE(make_super_admin, false),
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    is_super_admin = EXCLUDED.is_super_admin,
    updated_at = NOW()
  RETURNING id INTO new_admin_id;
  
  -- Send invitation email if this is a new user
  IF NOT user_exists THEN
    PERFORM auth.invite_user(admin_email);
  END IF;
  
  RETURN new_admin_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove admin
CREATE OR REPLACE FUNCTION public.remove_admin(admin_email TEXT)
RETURNS VOID AS $$
BEGIN
  -- Only super admins can remove admins
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admins can remove admins';
  END IF;
  
  -- Don't allow removing yourself
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = admin_email AND id = auth.uid()) THEN
    RAISE EXCEPTION 'You cannot remove yourself as admin';
  END IF;
  
  DELETE FROM public.admin_users 
  WHERE email = admin_email 
  RETURNING *;
  
  -- Note: We don't delete the auth user, just remove admin privileges
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to promote/demote super admins
CREATE OR REPLACE FUNCTION public.set_super_admin(
  admin_email TEXT,
  is_super BOOLEAN
)
RETURNS VOID AS $$
BEGIN
  -- Only super admins can modify super admin status
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admins can modify super admin status';
  END IF;
  
  -- Don't allow demoting yourself
  IF is_super = FALSE AND 
     EXISTS (SELECT 1 FROM auth.users WHERE email = admin_email AND id = auth.uid()) THEN
    RAISE EXCEPTION 'You cannot demote yourself from super admin';
  END IF;
  
  UPDATE public.admin_users 
  SET 
    is_super_admin = is_super,
    updated_at = NOW()
  WHERE email = admin_email;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Admin not found';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
