// @deno-types="./types.d.ts"

// Import the required libraries
// @ts-ignore - Les types sont définis dans types.d.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
// @ts-ignore - Les types sont définis dans types.d.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// Get environment variables - these will be provided by Supabase Functions at runtime
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders } }
    )
  }

  try {
    // Parse request body
    const requestData = await req.json()
    const { demandeId, clientEmail, clientName, conversation, typeAssurance } = requestData

    // Validate required fields
    if (!demandeId || !clientEmail) {
      return new Response(
        JSON.stringify({ error: 'ID de demande et email du client sont requis' }),
        { status: 400, headers: { ...corsHeaders } }
      )
    }

    // Initialize Supabase client
    const supabaseClient = createClient(supabaseUrl, supabaseKey)

    // Récupérer les détails complets de la demande
    const { data: demandeData, error: demandeError } = await supabaseClient
      .from('demandes_assurance')
      .select('*')
      .eq('id', demandeId);

    if (demandeError || !demandeData || demandeData.length === 0) {
      console.error('Erreur lors de la récupération de la demande:', demandeError);
      return new Response(
        JSON.stringify({ error: 'Demande non trouvée' }),
        { status: 404, headers: { ...corsHeaders } }
      );
    }

    const demande = demandeData[0];

    // Vérifier que nous avons bien une URL et une clé
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Configuration Supabase manquante')
    }

    // Créer le contenu HTML de l'email
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
        <!-- En-tête avec logo -->
        <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #e5e7eb;">
          <h1 style="color: #2563eb; margin: 0;">AssurConnect</h1>
          <p style="color: #6b7280; margin: 5px 0 0 0;">Votre partenaire assurance</p>
        </div>
        
        <!-- Contenu principal -->
        <div style="padding: 30px 20px;">
          <h2 style="color: #1e40af; margin-top: 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Confirmation de votre demande de devis</h2>
          
          <p>Bonjour ${clientName || 'client'},</p>
          
          <p>Nous avons bien reçu votre demande de devis pour une assurance <strong>${typeAssurance || ''}</strong>.</p>
          
          <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 25px 0; border: 1px solid #e2e8f0;">
            <h3 style="color: #1e40af; margin-top: 0;">Résumé de votre demande</h3>
            <p><strong>Référence :</strong> ${demandeId}</p>
            <p><strong>Date :</strong> ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
            <p><strong>Type d'assurance :</strong> ${typeAssurance || 'Non spécifié'}</p>
          </div>
          
          <h3 style="color: #1e40af; margin-top: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px;">Détails de la conversation</h3>
          ${conversation ? `
            <div style="margin: 20px 0;">
              ${conversation.map((msg, index) => `
                <div style="margin-bottom: 15px; padding: 12px; background-color: ${msg.role === 'user' ? '#f0f7ff' : '#f9fafb'}; border-radius: 8px; border-left: 3px solid ${msg.role === 'user' ? '#3b82f6' : '#9ca3af'};">
                  <div style="font-weight: 600; color: #374151; margin-bottom: 5px;">
                    ${msg.role === 'user' ? 'Vous' : 'Conseiller AssurConnect'}
                  </div>
                  <div style="color: #4b5563; white-space: pre-line; line-height: 1.5;">
                    ${msg.content}
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          <div style="background-color: #eff6ff; padding: 15px; border-radius: 8px; margin: 25px 0; border: 1px solid #bfdbfe;">
            <p style="margin: 0; color: #1e40af; font-weight: 500;">
              Votre demande a été transmise à notre équipe. Un conseiller vous contactera dans les plus brefs délais pour finaliser votre devis.
            </p>
          </div>
          
          <p>Pour toute question, n'hésitez pas à nous contacter en répondant à cet email.</p>
          
          <p style="margin-top: 30px;">Cordialement,<br>L'équipe AssurConnect</p>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
            <p style="margin: 5px 0;">Cet email a été envoyé automatiquement, merci de ne pas y répondre directement.</p>
            <p style="margin: 5px 0;">© ${new Date().getFullYear()} AssurConnect. Tous droits réservés.</p>
          </div>
        </div>
      </div>
    `

    try {
      // Initialiser le client Supabase avec les informations d'identification
      const supabaseClient = createClient(supabaseUrl, supabaseKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });

      // Mettre à jour le statut de la demande
      const { error: updateError } = await supabaseClient
        .from('demandes_assurance')
        .update({ 
          statut: 'en_cours',
          date_modification: new Date().toISOString(),
          conseiller_assigne: 'Système',
          notes_conseiller: `Email de confirmation envoyé le ${new Date().toLocaleString('fr-FR')}`
        })
        .eq('id', demandeId);

      if (updateError) {
        console.error('Erreur lors de la mise à jour de la demande:', updateError);
        throw new Error('Erreur lors de la mise à jour de la demande');
      }

      // Envoyer l'email via l'API d'authentification de Supabase
      const { error: emailError } = await supabaseClient.auth.admin.inviteUserByEmail(clientEmail, {
        data: { 
          name: clientName || 'Client',
          type_assurance: typeAssurance || 'Non spécifié'
        },
        redirectTo: `${supabaseUrl}/confirmation`,
        emailRedirectTo: `${supabaseUrl}/confirmation`
      });

      if (emailError) {
        console.error('Erreur lors de l\'envoi de l\'email:', emailError);
        throw new Error(`Erreur lors de l'envoi de l'email: ${emailError.message}`);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email de confirmation envoyé avec succès',
          demandeId: demandeId
        }),
        {
          status: 200,
          headers: { ...corsHeaders },
        }
      )
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email:', emailError)
      
      // Enregistrer l'erreur dans la base de données
      await supabaseClient
        .from('demandes_assurance')
        .update({ 
          notes_conseiller: `Erreur lors de l'envoi de l'email de confirmation: ${emailError.message}`
        })
        .eq('id', demandeId)
      
      throw new Error(`Erreur lors de l'envoi de l'email: ${emailError.message}`)
    }
  } catch (error) {
    console.error('Erreur lors du traitement de la demande:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Une erreur est survenue lors du traitement de votre demande' 
      }),
      {
        status: error.status || 500,
        headers: { ...corsHeaders },
      }
    )
  }
})
