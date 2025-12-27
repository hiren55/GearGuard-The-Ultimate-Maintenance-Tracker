// Edge Function: check-overdue
// Description: Checks for overdue maintenance requests and sends notifications
// Trigger: Scheduled (cron) - runs daily at 8 AM
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OverdueRequest {
  id: string
  request_number: string
  title: string
  due_date: string
  assigned_to_id: string | null
  assigned_team_id: string | null
  requester_id: string
}

interface TeamLeader {
  user_id: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find all overdue requests that haven't been notified today
    const { data: overdueRequests, error: fetchError } = await supabase
      .from('maintenance_requests')
      .select(`
        id,
        request_number,
        title,
        due_date,
        assigned_to_id,
        assigned_team_id,
        requester_id
      `)
      .lt('due_date', new Date().toISOString())
      .not('status', 'in', '("completed","verified","cancelled")')

    if (fetchError) {
      throw fetchError
    }

    const notifications: Array<{
      user_id: string
      type: string
      title: string
      message: string
      reference_type: string
      reference_id: string
    }> = []

    for (const request of (overdueRequests as OverdueRequest[]) || []) {
      const daysOverdue = Math.floor(
        (new Date().getTime() - new Date(request.due_date).getTime()) / (1000 * 60 * 60 * 24)
      )

      // Notify assigned technician
      if (request.assigned_to_id) {
        notifications.push({
          user_id: request.assigned_to_id,
          type: 'request_overdue',
          title: 'Overdue Request',
          message: `Request ${request.request_number} is ${daysOverdue} day(s) overdue: ${request.title}`,
          reference_type: 'maintenance_request',
          reference_id: request.id,
        })
      }

      // Notify team leader if assigned to a team
      if (request.assigned_team_id) {
        const { data: team } = await supabase
          .from('maintenance_teams')
          .select('leader_id')
          .eq('id', request.assigned_team_id)
          .single()

        if (team?.leader_id && team.leader_id !== request.assigned_to_id) {
          notifications.push({
            user_id: team.leader_id,
            type: 'request_overdue',
            title: 'Team Request Overdue',
            message: `Request ${request.request_number} is ${daysOverdue} day(s) overdue: ${request.title}`,
            reference_type: 'maintenance_request',
            reference_id: request.id,
          })
        }
      }
    }

    // Batch insert notifications
    if (notifications.length > 0) {
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications)

      if (insertError) {
        console.error('Error inserting notifications:', insertError)
      }
    }

    // Log execution to audit_logs
    await supabase.from('audit_logs').insert({
      action: 'scheduled_check_overdue',
      entity_type: 'system',
      additional_context: {
        overdue_count: overdueRequests?.length || 0,
        notifications_sent: notifications.length,
        executed_at: new Date().toISOString(),
      },
    })

    return new Response(
      JSON.stringify({
        success: true,
        overdue_count: overdueRequests?.length || 0,
        notifications_sent: notifications.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in check-overdue function:', error)

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
