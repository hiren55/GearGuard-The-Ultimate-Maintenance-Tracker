// Edge Function: generate-preventive
// Description: Generates preventive maintenance requests from schedules
// Trigger: Scheduled (cron) - runs daily at 6 AM
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PreventiveSchedule {
  id: string
  name: string
  description: string | null
  equipment_id: string
  frequency_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  frequency_value: number
  next_due: string
  created_by: string
  equipment: {
    id: string
    name: string
    status: string
    default_team_id: string | null
  }
}

function calculateNextDue(currentDue: Date, frequencyType: string, frequencyValue: number): Date {
  const nextDue = new Date(currentDue)

  switch (frequencyType) {
    case 'daily':
      nextDue.setDate(nextDue.getDate() + frequencyValue)
      break
    case 'weekly':
      nextDue.setDate(nextDue.getDate() + frequencyValue * 7)
      break
    case 'monthly':
      nextDue.setMonth(nextDue.getMonth() + frequencyValue)
      break
    case 'quarterly':
      nextDue.setMonth(nextDue.getMonth() + frequencyValue * 3)
      break
    case 'yearly':
      nextDue.setFullYear(nextDue.getFullYear() + frequencyValue)
      break
  }

  return nextDue
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

    // Get schedules that are due within the next 30 days
    const thirtyDaysFromNow = new Date()
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const { data: schedules, error: fetchError } = await supabase
      .from('preventive_schedules')
      .select(`
        id,
        name,
        description,
        equipment_id,
        frequency_type,
        frequency_value,
        next_due,
        created_by,
        equipment:equipment_id (
          id,
          name,
          status,
          default_team_id
        )
      `)
      .eq('is_active', true)
      .lte('next_due', thirtyDaysFromNow.toISOString().split('T')[0])

    if (fetchError) {
      throw fetchError
    }

    let requestsCreated = 0
    let schedulesUpdated = 0

    for (const schedule of (schedules as unknown as PreventiveSchedule[]) || []) {
      // Skip if equipment is scrapped
      if (schedule.equipment?.status === 'scrapped') {
        continue
      }

      // Check if a request already exists for this schedule that's still open
      const { data: existingRequest } = await supabase
        .from('maintenance_requests')
        .select('id')
        .eq('schedule_id', schedule.id)
        .not('status', 'in', '("completed","verified","cancelled")')
        .single()

      if (existingRequest) {
        // Request already exists, skip
        continue
      }

      // Create new preventive maintenance request
      const { data: newRequest, error: insertError } = await supabase
        .from('maintenance_requests')
        .insert({
          title: `Preventive: ${schedule.name}`,
          description: schedule.description || `Scheduled preventive maintenance for ${schedule.equipment?.name}`,
          request_type: 'preventive',
          priority: 'medium',
          equipment_id: schedule.equipment_id,
          requester_id: schedule.created_by,
          assigned_team_id: schedule.equipment?.default_team_id,
          due_date: schedule.next_due,
          schedule_id: schedule.id,
        })
        .select()
        .single()

      if (insertError) {
        console.error(`Error creating request for schedule ${schedule.id}:`, insertError)
        continue
      }

      requestsCreated++

      // Update schedule with new next_due date
      const newNextDue = calculateNextDue(
        new Date(schedule.next_due),
        schedule.frequency_type,
        schedule.frequency_value
      )

      const { error: updateError } = await supabase
        .from('preventive_schedules')
        .update({
          last_generated: new Date().toISOString().split('T')[0],
          next_due: newNextDue.toISOString().split('T')[0],
        })
        .eq('id', schedule.id)

      if (updateError) {
        console.error(`Error updating schedule ${schedule.id}:`, updateError)
      } else {
        schedulesUpdated++
      }

      // Create notification for team leader if team is assigned
      if (schedule.equipment?.default_team_id) {
        const { data: team } = await supabase
          .from('maintenance_teams')
          .select('leader_id')
          .eq('id', schedule.equipment.default_team_id)
          .single()

        if (team?.leader_id) {
          await supabase.from('notifications').insert({
            user_id: team.leader_id,
            type: 'request_created',
            title: 'New Preventive Maintenance',
            message: `Preventive maintenance generated: ${schedule.name}`,
            reference_type: 'maintenance_request',
            reference_id: newRequest.id,
          })
        }
      }
    }

    // Log execution to audit_logs
    await supabase.from('audit_logs').insert({
      action: 'scheduled_generate_preventive',
      entity_type: 'system',
      additional_context: {
        schedules_processed: schedules?.length || 0,
        requests_created: requestsCreated,
        schedules_updated: schedulesUpdated,
        executed_at: new Date().toISOString(),
      },
    })

    return new Response(
      JSON.stringify({
        success: true,
        schedules_processed: schedules?.length || 0,
        requests_created: requestsCreated,
        schedules_updated: schedulesUpdated,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error in generate-preventive function:', error)

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
