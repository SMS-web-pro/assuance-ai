
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, newPassword } = await req.json()

    if (!email || !newPassword) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email et nouveau mot de passe requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Rechercher l'utilisateur par email
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('Erreur lors de la recherche des utilisateurs:', listError)
      return new Response(
        JSON.stringify({ success: false, error: 'Erreur lors de la recherche de l\'utilisateur' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const user = users.users.find(u => u.email === email)
    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Utilisateur non trouvé' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Mettre à jour le mot de passe
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    )

    if (updateError) {
      console.error('Erreur lors de la mise à jour du mot de passe:', updateError)
      return new Response(
        JSON.stringify({ success: false, error: 'Erreur lors de la mise à jour du mot de passe' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Mot de passe mis à jour avec succès pour:', email)

    return new Response(
      JSON.stringify({ success: true, message: 'Mot de passe mis à jour avec succès' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erreur dans update-conseiller-password:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Erreur interne du serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
