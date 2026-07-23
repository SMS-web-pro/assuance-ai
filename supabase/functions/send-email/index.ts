
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createTransport } from "npm:nodemailer@6.9.7"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Début du traitement de la demande d\'envoi d\'email')

    // Initialiser le client Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Récupérer la configuration SMTP par défaut
    const { data: smtpConfig, error: smtpError } = await supabase
      .from('smtp_configs')
      .select('*')
      .eq('enabled', true)
      .eq('is_default', true)
      .single()

    if (smtpError || !smtpConfig) {
      console.error('Aucune configuration SMTP active trouvée:', smtpError)
      return new Response(
        JSON.stringify({ error: 'Aucune configuration SMTP active trouvée' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Configuration SMTP trouvée:', smtpConfig.name)

    // Traiter les données - FormData ou JSON
    let to, cc, subject, message, attachments = []
    
    const contentType = req.headers.get('content-type') || ''
    
    if (contentType.includes('multipart/form-data')) {
      // Traitement FormData
      const formData = await req.formData()
      to = formData.get('to') as string
      cc = formData.get('cc') as string
      subject = formData.get('subject') as string
      message = formData.get('message') as string

      console.log('Données FormData reçues:', { to, cc, subject })

      // Traiter le PDF s'il existe
      const pdfFile = formData.get('pdf') as File
      if (pdfFile && pdfFile.size > 0) {
        const pdfBuffer = await pdfFile.arrayBuffer()
        attachments.push({
          filename: pdfFile.name,
          content: new Uint8Array(pdfBuffer),
          contentType: 'application/pdf'
        })
        console.log('PDF ajouté aux pièces jointes:', pdfFile.name)
      }

      // Traiter les autres pièces jointes
      let attachmentIndex = 0
      while (true) {
        const attachmentFile = formData.get(`attachment_${attachmentIndex}`) as File
        if (!attachmentFile || attachmentFile.size === 0) break
        
        const fileBuffer = await attachmentFile.arrayBuffer()
        attachments.push({
          filename: attachmentFile.name,
          content: new Uint8Array(fileBuffer),
          contentType: attachmentFile.type || 'application/octet-stream'
        })
        console.log('Pièce jointe ajoutée:', attachmentFile.name)
        attachmentIndex++
      }
    } else {
      // Traitement JSON
      const body = await req.json()
      to = body.to
      cc = body.cc
      subject = body.subject
      message = body.message || body.html
      
      // Traiter les attachments en base64 si présents
      if (body.attachments && Array.isArray(body.attachments)) {
        for (const att of body.attachments) {
          if (att.content && att.filename) {
            // Décoder le base64
            const binaryString = atob(att.content)
            const bytes = new Uint8Array(binaryString.length)
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i)
            }
            
            attachments.push({
              filename: att.filename,
              content: bytes,
              contentType: att.contentType || 'application/octet-stream'
            })
            console.log('Attachment base64 ajouté:', att.filename)
          }
        }
      }
    }

    // Validation des paramètres
    if (!to || !subject || !message) {
      console.error('Paramètres manquants:', { to: !!to, subject: !!subject, message: !!message })
      return new Response(
        JSON.stringify({ error: 'Paramètres manquants (to, subject, message requis)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Configuration du transporteur SMTP
    const transportConfig = {
      host: smtpConfig.host,
      port: parseInt(smtpConfig.port),
      secure: smtpConfig.security === 'ssl', // true pour SSL (port 465), false pour TLS (port 587)
      auth: {
        user: smtpConfig.username,
        pass: smtpConfig.password,
      },
    }

    console.log('Configuration SMTP:', {
      host: smtpConfig.host,
      port: smtpConfig.port,
      security: smtpConfig.security,
      user: smtpConfig.username
    })

    const transporter = createTransport(transportConfig)

    // Configuration de l'email
    const mailOptions = {
      from: `${smtpConfig.sender_name || 'AssureAI'} <${smtpConfig.sender_email || smtpConfig.username}>`,
      to: to,
      cc: cc || undefined,
      subject: subject,
      html: typeof message === 'string' ? message.replace(/\n/g, '<br>') : message,
      attachments: attachments,
    }

    console.log('Configuration email:', {
      from: mailOptions.from,
      to: mailOptions.to,
      cc: mailOptions.cc,
      subject: mailOptions.subject,
      attachmentsCount: attachments.length
    })

    // Envoyer l'email
    const info = await transporter.sendMail(mailOptions)

    console.log('Email envoyé avec succès:', info.messageId)

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: info.messageId,
        message: 'Email envoyé avec succès' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error)
    
    // Retourner une erreur plus détaillée
    const errorMessage = error.message || 'Erreur inconnue'
    const errorDetails = {
      error: 'Erreur lors de l\'envoi de l\'email',
      details: errorMessage,
      type: error.name || 'UnknownError'
    }
    
    return new Response(
      JSON.stringify(errorDetails),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
