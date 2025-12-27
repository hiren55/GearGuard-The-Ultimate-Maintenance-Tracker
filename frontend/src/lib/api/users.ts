import { getSupabaseClient } from '@/lib/supabase/client';
import type { User, Department } from '@/types';

const supabase = getSupabaseClient();

// Fetch all users
export async function fetchUserList(): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('is_active', true)
    .order('full_name');

  if (error) throw error;
  return data || [];
}

// Fetch user by ID
export async function fetchUser(id: string): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

// Update user profile
export async function updateUserProfile(
  id: string,
  data: Partial<Pick<User, 'full_name' | 'phone' | 'avatar_url'>>
): Promise<User> {
  const { data: user, error } = await supabase
    .from('users')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return user;
}

// Fetch departments
export async function fetchDepartmentList(): Promise<Department[]> {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data || [];
}

// Fetch department by ID
export async function fetchDepartment(id: string): Promise<Department> {
  const { data, error } = await supabase
    .from('departments')
    .select(`
      *,
      manager:users!departments_manager_id_fkey(id, full_name, avatar_url)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

// Fetch users by department
export async function fetchUsersByDepartment(departmentId: string): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('department_id', departmentId)
    .eq('is_active', true)
    .order('full_name');

  if (error) throw error;
  return data || [];
}
