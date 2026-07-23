
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
    console.log('Traitement des emails programmés')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Récupérer les rappels email à envoyer (date passée et pas encore envoyés)
    const now = new Date().toISOString()
    const { data: rappelsToSend, error: rappelsError } = await supabase
      .from('rappels_clients')
      .select(`
        *,
        demandes_assurance (
          nom,
          prenom,
          email,
          type_assurance
        )
      `)
      .eq('send_automatically', true)
      .eq('email_sent', false)
      .eq('type_rappel', 'email')
      .lte('date_rappel', now)

    if (rappelsError) {
      console.error('Erreur lors de la récupération des rappels:', rappelsError)
      throw rappelsError
    }

    console.log(`${rappelsToSend?.length || 0} emails à envoyer`)

    if (!rappelsToSend || rappelsToSend.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Aucun email à envoyer', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Récupérer la configuration SMTP
    const { data: smtpConfig, error: smtpError } = await supabase
      .from('smtp_configs')
      .select('*')
      .eq('enabled', true)
      .eq('is_default', true)
      .single()

    if (smtpError || !smtpConfig) {
      console.error('Aucune configuration SMTP trouvée')
      throw new Error('Configuration SMTP manquante')
    }

    let emailsSent = 0
    let emailsError = 0

    // Traiter chaque rappel email
    for (const rappel of rappelsToSend) {
      try {
        const demande = rappel.demandes_assurance

        if (!demande?.email) {
          console.log(`Pas d'email pour le rappel ${rappel.id}`)
          continue
        }

        // Préparer les données de l'email
        const formData = new FormData()
        formData.append('to', demande.email)
        formData.append('subject', rappel.email_subject || `Suivi de votre demande d'assurance ${demande.type_assurance}`)
        formData.append('message', rappel.email_content || `
Bonjour ${demande.prenom} ${demande.nom},

Nous espérons que vous vous portez bien.

${rappel.description || 'Nous souhaitions faire le point avec vous concernant votre demande d\'assurance.'}

N'hésitez pas à nous contacter si vous avez des questions.

Cordialement,
L'équipe AssureAI
        `.trim())

        // Appeler la fonction d'envoi d'email
        const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-email', {
          body: formData
        })

        if (emailError) {
          console.error(`Erreur envoi email rappel ${rappel.id}:`, emailError)
          emailsError++
          continue
        }

        // Marquer le rappel comme envoyé
        const { error: updateError } = await supabase
          .from('rappels_clients')
          .update({
            email_sent: true,
            email_sent_at: new Date().toISOString(),
            statut: 'termine'
          })
          .eq('id', rappel.id)

        if (updateError) {
          console.error(`Erreur mise à jour rappel ${rappel.id}:`, updateError)
        } else {
          console.log(`Email envoyé avec succès pour le rappel ${rappel.id}`)
          emailsSent++
        }

      } catch (error) {
        console.error(`Erreur traitement rappel ${rappel.id}:`, error)
        emailsError++
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Traitement terminé',
        processed: rappelsToSend.length,
        sent: emailsSent,
        errors: emailsError
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erreur lors du traitement des emails programmés:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erreur lors du traitement des emails programmés',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
