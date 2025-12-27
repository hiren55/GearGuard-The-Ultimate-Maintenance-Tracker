import { getSupabaseClient } from '@/lib/supabase/client';
import type {
  MaintenanceTeam,
  TeamMember,
  TeamMemberWithUser,
  User,
} from '@/types';

const supabase = getSupabaseClient();

// Fetch all teams
export async function fetchTeamList(): Promise<MaintenanceTeam[]> {
  const { data, error } = await supabase
    .from('maintenance_teams')
    .select(`
      *,
      leader:users!maintenance_teams_leader_id_fkey(id, full_name, avatar_url, email)
    `)
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data || [];
}

// Fetch single team by ID with members
export async function fetchTeam(id: string): Promise<MaintenanceTeam & { members: TeamMemberWithUser[] }> {
  const { data: team, error: teamError } = await supabase
    .from('maintenance_teams')
    .select(`
      *,
      leader:users!maintenance_teams_leader_id_fkey(*)
    `)
    .eq('id', id)
    .single();

  if (teamError) throw teamError;

  // Fetch team members
  const { data: members, error: membersError } = await supabase
    .from('team_members')
    .select(`
      *,
      user:users(*)
    `)
    .eq('team_id', id)
    .eq('is_active', true);

  if (membersError) throw membersError;

  // Mark the leader
  const membersWithLeader = (members || []).map((m) => ({
    ...m,
    is_leader: m.user_id === team.leader_id,
  }));

  return {
    ...team,
    members: membersWithLeader as TeamMemberWithUser[],
  };
}

// Create team
export async function createTeam(data: {
  name: string;
  description?: string;
  specialization?: string;
  leader_id?: string;
}): Promise<MaintenanceTeam> {
  const { data: team, error } = await supabase
    .from('maintenance_teams')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return team;
}

// Update team
export async function updateTeam(
  id: string,
  data: Partial<MaintenanceTeam>
): Promise<MaintenanceTeam> {
  const { data: team, error } = await supabase
    .from('maintenance_teams')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return team;
}

// Delete/deactivate team
export async function deleteTeam(id: string): Promise<void> {
  const { error } = await supabase
    .from('maintenance_teams')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
}

// Add member to team
export async function addTeamMember(teamId: string, userId: string): Promise<TeamMember> {
  const { data, error } = await supabase
    .from('team_members')
    .insert({
      team_id: teamId,
      user_id: userId,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Remove member from team
export async function removeTeamMember(teamId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('team_members')
    .update({ is_active: false })
    .eq('team_id', teamId)
    .eq('user_id', userId);

  if (error) throw error;
}

// Get team members (technicians)
export async function fetchTeamMembers(teamId: string): Promise<TeamMemberWithUser[]> {
  const { data, error } = await supabase
    .from('team_members')
    .select(`
      *,
      user:users(*)
    `)
    .eq('team_id', teamId)
    .eq('is_active', true);

  if (error) throw error;
  return (data || []) as TeamMemberWithUser[];
}

// Get available technicians (for assignment)
export async function fetchAvailableTechnicians(teamId?: string): Promise<User[]> {
  let query = supabase
    .from('users')
    .select('*')
    .in('role', ['technician', 'team_leader'])
    .eq('is_active', true)
    .order('full_name');

  // If team specified, filter to team members
  if (teamId) {
    const { data: memberIds } = await supabase
      .from('team_members')
      .select('user_id')
      .eq('team_id', teamId)
      .eq('is_active', true);

    if (memberIds && memberIds.length > 0) {
      query = query.in('id', memberIds.map((m) => m.user_id));
    }
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// Get team workload stats
export async function fetchTeamWorkload(teamId: string): Promise<{
  new: number;
  assigned: number;
  in_progress: number;
  completed_this_month: number;
}> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [newCount, assignedCount, inProgressCount, completedCount] = await Promise.all([
    supabase
      .from('maintenance_requests')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_team_id', teamId)
      .eq('status', 'new'),
    supabase
      .from('maintenance_requests')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_team_id', teamId)
      .eq('status', 'assigned'),
    supabase
      .from('maintenance_requests')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_team_id', teamId)
      .eq('status', 'in_progress'),
    supabase
      .from('maintenance_requests')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_team_id', teamId)
      .eq('status', 'completed')
      .gte('completed_at', startOfMonth.toISOString()),
  ]);

  return {
    new: newCount.count || 0,
    assigned: assignedCount.count || 0,
    in_progress: inProgressCount.count || 0,
    completed_this_month: completedCount.count || 0,
  };
}
