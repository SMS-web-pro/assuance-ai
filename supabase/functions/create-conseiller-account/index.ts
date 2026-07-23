
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { email, password, userData } = await req.json()

    console.log('Création du compte conseiller pour:', email)

    // Créer le compte utilisateur avec les privilèges admin
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        role: 'conseiller',
        nom: userData.nom,
        specialite: userData.specialite
      }
    })

    if (authError) {
      console.error('Erreur création compte Auth:', authError)
      throw authError
    }

    console.log('Compte Supabase Auth créé avec succès:', authData.user?.id)

    return new Response(
      JSON.stringify({ 
        success: true, 
        user: authData.user,
        message: 'Compte créé avec succès' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Erreur dans create-conseiller-account:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Erreur interne du serveur',
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
