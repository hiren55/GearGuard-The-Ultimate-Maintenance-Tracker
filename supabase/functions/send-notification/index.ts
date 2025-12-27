// Edge Function: send-notification
// Description: Sends email notifications for important events
// Trigger: HTTP POST (called by database webhooks or other functions)
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationPayload {
  user_id: string
  type: 'request_created' | 'request_assigned' | 'status_changed' | 'request_completed' | 'request_overdue' | 'equipment_scrapped'
  title: string
  message: string
  reference_type?: string
  reference_id?: string
  send_email?: boolean
}

interface UserEmail {
  email: string
  full_name: string
}

// Email templates
const emailTemplates = {
  request_assigned: (data: { userName: string; requestNumber: string; title: string }) => ({
    subject: `[GearGuard] New Request Assigned: ${data.requestNumber}`,
    html: `
      <h2>Hello ${data.userName},</h2>
      <p>You have been assigned to a new maintenance request:</p>
      <p><strong>Request:</strong> ${data.requestNumber}</p>
      <p><strong>Title:</strong> ${data.title}</p>
      <p>Please log in to GearGuard to view the details and start working on this request.</p>
      <br>
      <p>Best regards,<br>GearGuard System</p>
    `,
  }),
  request_completed: (data: { userName: string; requestNumber: string; title: string }) => ({
    subject: `[GearGuard] Request Completed: ${data.requestNumber}`,
    html: `
      <h2>Hello ${data.userName},</h2>
      <p>Your maintenance request has been completed:</p>
      <p><strong>Request:</strong> ${data.requestNumber}</p>
      <p><strong>Title:</strong> ${data.title}</p>
      <p>Please log in to GearGuard to verify the work and close the request.</p>
      <br>
      <p>Best regards,<br>GearGuard System</p>
    `,
  }),
  request_overdue: (data: { userName: string; requestNumber: string; title: string; daysOverdue: number }) => ({
    subject: `[GearGuard] OVERDUE: Request ${data.requestNumber}`,
    html: `
      <h2>Hello ${data.userName},</h2>
      <p><strong style="color: red;">ATTENTION:</strong> The following request is overdue:</p>
      <p><strong>Request:</strong> ${data.requestNumber}</p>
      <p><strong>Title:</strong> ${data.title}</p>
      <p><strong>Days Overdue:</strong> ${data.daysOverdue}</p>
      <p>Please prioritize this request or update its status in GearGuard.</p>
      <br>
      <p>Best regards,<br>GearGuard System</p>
    `,
  }),
  equipment_scrapped: (data: { userName: string; equipmentName: string; reason: string }) => ({
    subject: `[GearGuard] Equipment Scrapped: ${data.equipmentName}`,
    html: `
      <h2>Hello ${data.userName},</h2>
      <p>The following equipment has been marked as scrapped:</p>
      <p><strong>Equipment:</strong> ${data.equipmentName}</p>
      <p><strong>Reason:</strong> ${data.reason}</p>
      <p>All open maintenance requests for this equipment have been cancelled.</p>
      <br>
      <p>Best regards,<br>GearGuard System</p>
    `,
  }),
  default: (data: { userName: string; title: string; message: string }) => ({
    subject: `[GearGuard] ${data.title}`,
    html: `
      <h2>Hello ${data.userName},</h2>
      <p>${data.message}</p>
      <br>
      <p>Best regards,<br>GearGuard System</p>
    `,
  }),
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const payload: NotificationPayload = await req.json()

    // Validate payload
    if (!payload.user_id || !payload.type || !payload.title || !payload.message) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create in-app notification
    const { data: notification, error: notifError } = await supabase
      .from('notifications')
      .insert({
        user_id: payload.user_id,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        reference_type: payload.reference_type,
        reference_id: payload.reference_id,
      })
      .select()
      .single()

    if (notifError) {
      throw notifError
    }

    let emailSent = false

    // Send email if requested and API key is configured
    if (payload.send_email && resendApiKey) {
      // Get user email
      const { data: user } = await supabase
        .from('users')
        .select('email, full_name')
        .eq('id', payload.user_id)
        .single()

      if (user?.email) {
        const templateData = {
          userName: user.full_name,
          title: payload.title,
          message: payload.message,
          requestNumber: '',
          equipmentName: '',
          reason: '',
          daysOverdue: 0,
        }

        // Get additional data based on notification type
        if (payload.reference_type === 'maintenance_request' && payload.reference_id) {
          const { data: request } = await supabase
            .from('maintenance_requests')
            .select('request_number, title')
            .eq('id', payload.reference_id)
            .single()

          if (request) {
            templateData.requestNumber = request.request_number
            templateData.title = request.title
          }
        }

        const template = emailTemplates[payload.type as keyof typeof emailTemplates] || emailTemplates.default
        const emailContent = template(templateData)

        try {
          const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
              from: 'GearGuard <notifications@yourdomain.com>',
              to: [user.email],
              subject: emailContent.subject,
              html: emailContent.html,
            }),
          })

          emailSent = emailResponse.ok
        } catch (emailError) {
          console.error('Error sending email:', emailError)
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notification_id: notification.id,
        email_sent: emailSent,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in send-notification function:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
