import { getSupabaseClient } from '@/lib/supabase/client';
import type {
  Equipment,
  EquipmentWithDetails,
  EquipmentFilters,
  PaginationParams,
  PaginatedResponse,
  CreateEquipmentFormData,
} from '@/types';
import { validateEquipmentData, ApiValidationError } from './validation';

const supabase = getSupabaseClient();

// Fetch equipment list with filters and pagination
export async function fetchEquipmentList(
  filters: EquipmentFilters = {},
  pagination: PaginationParams = { page: 1, pageSize: 10 }
): Promise<PaginatedResponse<EquipmentWithDetails>> {
  const { page, pageSize } = pagination;
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from('equipment')
    .select(`
      *,
      department:departments(*),
      owner:users!equipment_owner_id_fkey(*),
      default_team:maintenance_teams(*)
    `, { count: 'exact' });

  // Apply filters
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,serial_number.ilike.%${filters.search}%,asset_tag.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }

  if (filters.category) {
    query = query.eq('category', filters.category);
  }

  if (filters.department_id) {
    query = query.eq('department_id', filters.department_id);
  }

  if (filters.location) {
    query = query.ilike('location', `%${filters.location}%`);
  }

  // Apply pagination
  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data: (data || []) as EquipmentWithDetails[],
    count: count || 0,
    page,
    pageSize,
    totalPages: Math.ceil((count || 0) / pageSize),
  };
}

// Fetch single equipment by ID
export async function fetchEquipment(id: string): Promise<EquipmentWithDetails> {
  const { data, error } = await supabase
    .from('equipment')
    .select(`
      *,
      department:departments(*),
      owner:users!equipment_owner_id_fkey(*),
      default_team:maintenance_teams(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as EquipmentWithDetails;
}

// Create equipment
export async function createEquipment(
  data: CreateEquipmentFormData,
  userId: string
): Promise<Equipment> {
  // Validate data before sending to database
  const validationResult = validateEquipmentData({
    ...data,
    // Ensure ownership fields are correctly set based on ownership_type
    department_id: data.ownership_type === 'department' ? data.department_id : null,
    owner_id: data.ownership_type === 'employee' ? data.owner_id : null,
  });

  if (!validationResult.success) {
    throw new ApiValidationError(
      validationResult.error || 'Validation failed',
      validationResult.fieldErrors
    );
  }

  // Map ownership fields correctly based on ownership_type
  // DB constraint requires: department_id XOR owner_id based on ownership_type
  const insertData = {
    name: data.name,
    description: data.description,
    asset_tag: data.asset_tag,
    serial_number: data.serial_number,
    model: data.model,
    manufacturer: data.manufacturer,
    category: data.category,
    location: data.location,
    purchase_date: data.purchase_date,
    purchase_cost: data.purchase_cost,
    warranty_expiry: data.warranty_expiry,
    criticality: data.criticality || 'medium',
    ownership_type: data.ownership_type,
    // Conditionally set department_id or owner_id based on ownership_type
    department_id: data.ownership_type === 'department' ? data.department_id : null,
    owner_id: data.ownership_type === 'employee' ? data.owner_id : null,
    default_team_id: data.default_team_id,
    notes: data.notes,
    created_by: userId,
    status: 'active' as const,
  };

  const { data: equipment, error } = await supabase
    .from('equipment')
    .insert(insertData)
    .select()
    .single();

  if (error) throw error;
  return equipment;
}

// Update equipment
export async function updateEquipment(
  id: string,
  data: Partial<CreateEquipmentFormData>
): Promise<Equipment> {
  // Build update object, handling ownership fields correctly
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  // Copy basic fields
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.asset_tag !== undefined) updateData.asset_tag = data.asset_tag;
  if (data.serial_number !== undefined) updateData.serial_number = data.serial_number;
  if (data.model !== undefined) updateData.model = data.model;
  if (data.manufacturer !== undefined) updateData.manufacturer = data.manufacturer;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.location !== undefined) updateData.location = data.location;
  if (data.purchase_date !== undefined) updateData.purchase_date = data.purchase_date;
  if (data.purchase_cost !== undefined) updateData.purchase_cost = data.purchase_cost;
  if (data.warranty_expiry !== undefined) updateData.warranty_expiry = data.warranty_expiry;
  if (data.criticality !== undefined) updateData.criticality = data.criticality;
  if (data.default_team_id !== undefined) updateData.default_team_id = data.default_team_id;
  if (data.notes !== undefined) updateData.notes = data.notes;

  // Handle ownership fields together if ownership_type is being updated
  if (data.ownership_type !== undefined) {
    updateData.ownership_type = data.ownership_type;
    updateData.department_id = data.ownership_type === 'department' ? data.department_id : null;
    updateData.owner_id = data.ownership_type === 'employee' ? data.owner_id : null;
  }

  const { data: equipment, error } = await supabase
    .from('equipment')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return equipment;
}

// Delete equipment
export async function deleteEquipment(id: string): Promise<void> {
  const { error } = await supabase
    .from('equipment')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

// Scrap equipment
export async function scrapEquipment(id: string, reason: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('scrap_equipment', {
    p_equipment_id: id,
    p_reason: reason,
  });

  if (error) throw error;
  return data;
}

// Get equipment categories for filters
export async function fetchEquipmentCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from('equipment')
    .select('category')
    .not('category', 'is', null);

  if (error) throw error;

  // Get unique categories
  const categories = [...new Set(data?.map((e) => e.category))].filter(Boolean);
  return categories.sort();
}

// Get equipment locations for filters
export async function fetchEquipmentLocations(): Promise<string[]> {
  const { data, error } = await supabase
    .from('equipment')
    .select('location')
    .not('location', 'is', null);

  if (error) throw error;

  const locations = [...new Set(data?.map((e) => e.location))].filter(Boolean) as string[];
  return locations.sort();
}

// Get maintenance history for equipment
export async function fetchEquipmentMaintenanceHistory(
  equipmentId: string,
  limit: number = 10
): Promise<any[]> {
  const { data, error } = await supabase
    .from('maintenance_requests')
    .select(`
      *,
      requester:users!maintenance_requests_requester_id_fkey(id, full_name, avatar_url),
      assigned_to:users!maintenance_requests_assigned_to_id_fkey(id, full_name, avatar_url)
    `)
    .eq('equipment_id', equipmentId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}
