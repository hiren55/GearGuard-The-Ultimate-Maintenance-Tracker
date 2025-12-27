// Database types generated from Supabase schema
// Run `supabase gen types typescript` to regenerate

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Enum types
export type UserRole = 'admin' | 'manager' | 'team_leader' | 'technician' | 'requester';
export type EquipmentStatus = 'active' | 'under_maintenance' | 'scrapped';
export type CriticalityLevel = 'low' | 'medium' | 'high' | 'critical';
export type OwnershipType = 'department' | 'employee';
export type RequestType = 'corrective' | 'preventive';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';
export type RequestStatus = 'new' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'verified' | 'cancelled';
export type LogAction = 'created' | 'status_changed' | 'assigned' | 'reassigned' | 'note_added' | 'priority_changed' | 'due_date_changed' | 'completed' | 'verified' | 'cancelled' | 'reopened' | 'equipment_scrapped';
export type FrequencyType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type NotificationType = 'request_created' | 'request_assigned' | 'status_changed' | 'request_completed' | 'request_overdue' | 'comment_added' | 'equipment_scrapped' | 'system';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          phone: string | null;
          avatar_url: string | null;
          role: UserRole;
          department_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          phone?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          department_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          phone?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          department_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      departments: {
        Row: {
          id: string;
          name: string;
          code: string;
          description: string | null;
          parent_id: string | null;
          manager_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          description?: string | null;
          parent_id?: string | null;
          manager_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          description?: string | null;
          parent_id?: string | null;
          manager_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      equipment: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          asset_tag: string | null;
          serial_number: string | null;
          model: string | null;
          manufacturer: string | null;
          category: string;
          location: string | null;
          purchase_date: string | null;
          purchase_cost: number | null;
          warranty_expiry: string | null;
          status: EquipmentStatus;
          criticality: CriticalityLevel;
          ownership_type: OwnershipType;
          department_id: string | null;
          owner_id: string | null;
          default_team_id: string | null;
          notes: string | null;
          image_url: string | null;
          specifications: Json | null;
          created_by: string;
          created_at: string;
          updated_at: string;
          scrapped_at: string | null;
          scrapped_by: string | null;
          scrap_reason: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          asset_tag?: string | null;
          serial_number?: string | null;
          model?: string | null;
          manufacturer?: string | null;
          category: string;
          location?: string | null;
          purchase_date?: string | null;
          purchase_cost?: number | null;
          warranty_expiry?: string | null;
          status?: EquipmentStatus;
          criticality?: CriticalityLevel;
          ownership_type: OwnershipType;
          department_id?: string | null;
          owner_id?: string | null;
          default_team_id?: string | null;
          notes?: string | null;
          image_url?: string | null;
          specifications?: Json | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          scrapped_at?: string | null;
          scrapped_by?: string | null;
          scrap_reason?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          asset_tag?: string | null;
          serial_number?: string | null;
          model?: string | null;
          manufacturer?: string | null;
          category?: string;
          location?: string | null;
          purchase_date?: string | null;
          purchase_cost?: number | null;
          warranty_expiry?: string | null;
          status?: EquipmentStatus;
          criticality?: CriticalityLevel;
          ownership_type?: OwnershipType;
          department_id?: string | null;
          owner_id?: string | null;
          default_team_id?: string | null;
          notes?: string | null;
          image_url?: string | null;
          specifications?: Json | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          scrapped_at?: string | null;
          scrapped_by?: string | null;
          scrap_reason?: string | null;
        };
      };
      maintenance_teams: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          specialization: string | null;
          leader_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          specialization?: string | null;
          leader_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          specialization?: string | null;
          leader_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          joined_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          joined_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          team_id?: string;
          user_id?: string;
          joined_at?: string;
          is_active?: boolean;
        };
      };
      maintenance_requests: {
        Row: {
          id: string;
          request_number: string;
          title: string;
          description: string;
          request_type: RequestType;
          priority: PriorityLevel;
          status: RequestStatus;
          equipment_id: string;
          requester_id: string;
          assigned_team_id: string | null;
          assigned_to_id: string | null;
          assigned_by_id: string | null;
          due_date: string | null;
          started_at: string | null;
          completed_at: string | null;
          verified_at: string | null;
          verified_by_id: string | null;
          cancelled_at: string | null;
          cancelled_by_id: string | null;
          cancellation_reason: string | null;
          resolution_notes: string | null;
          parts_used: string | null;
          labor_hours: number | null;
          cost_estimate: number | null;
          actual_cost: number | null;
          scrap_recommended: boolean;
          schedule_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          request_number?: string;
          title: string;
          description: string;
          request_type: RequestType;
          priority?: PriorityLevel;
          status?: RequestStatus;
          equipment_id: string;
          requester_id: string;
          assigned_team_id?: string | null;
          assigned_to_id?: string | null;
          assigned_by_id?: string | null;
          due_date?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          verified_at?: string | null;
          verified_by_id?: string | null;
          cancelled_at?: string | null;
          cancelled_by_id?: string | null;
          cancellation_reason?: string | null;
          resolution_notes?: string | null;
          parts_used?: string | null;
          labor_hours?: number | null;
          cost_estimate?: number | null;
          actual_cost?: number | null;
          scrap_recommended?: boolean;
          schedule_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          request_number?: string;
          title?: string;
          description?: string;
          request_type?: RequestType;
          priority?: PriorityLevel;
          status?: RequestStatus;
          equipment_id?: string;
          requester_id?: string;
          assigned_team_id?: string | null;
          assigned_to_id?: string | null;
          assigned_by_id?: string | null;
          due_date?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          verified_at?: string | null;
          verified_by_id?: string | null;
          cancelled_at?: string | null;
          cancelled_by_id?: string | null;
          cancellation_reason?: string | null;
          resolution_notes?: string | null;
          parts_used?: string | null;
          labor_hours?: number | null;
          cost_estimate?: number | null;
          actual_cost?: number | null;
          scrap_recommended?: boolean;
          schedule_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      maintenance_logs: {
        Row: {
          id: string;
          request_id: string;
          user_id: string;
          action: LogAction;
          field_changed: string | null;
          old_value: string | null;
          new_value: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          user_id: string;
          action: LogAction;
          field_changed?: string | null;
          old_value?: string | null;
          new_value?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string;
          user_id?: string;
          action?: LogAction;
          field_changed?: string | null;
          old_value?: string | null;
          new_value?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      preventive_schedules: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          equipment_id: string;
          frequency_type: FrequencyType;
          frequency_value: number;
          estimated_hours: number | null;
          last_generated: string | null;
          next_due: string;
          is_active: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          equipment_id: string;
          frequency_type: FrequencyType;
          frequency_value: number;
          estimated_hours?: number | null;
          last_generated?: string | null;
          next_due: string;
          is_active?: boolean;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          equipment_id?: string;
          frequency_type?: FrequencyType;
          frequency_value?: number;
          estimated_hours?: number | null;
          last_generated?: string | null;
          next_due?: string;
          is_active?: boolean;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          message: string;
          reference_type: string | null;
          reference_id: string | null;
          is_read: boolean;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: NotificationType;
          title: string;
          message: string;
          reference_type?: string | null;
          reference_id?: string | null;
          is_read?: boolean;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: NotificationType;
          title?: string;
          message?: string;
          reference_type?: string | null;
          reference_id?: string | null;
          is_read?: boolean;
          read_at?: string | null;
          created_at?: string;
        };
      };
      file_attachments: {
        Row: {
          id: string;
          file_name: string;
          file_type: string;
          file_size: number;
          storage_path: string;
          entity_type: string;
          entity_id: string;
          uploaded_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          file_name: string;
          file_type: string;
          file_size: number;
          storage_path: string;
          entity_type: string;
          entity_id: string;
          uploaded_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          file_name?: string;
          file_type?: string;
          file_size?: number;
          storage_path?: string;
          entity_type?: string;
          entity_id?: string;
          uploaded_by?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_my_role: {
        Args: Record<PropertyKey, never>;
        Returns: UserRole;
      };
      get_my_department: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_my_teams: {
        Args: Record<PropertyKey, never>;
        Returns: string[];
      };
      get_dashboard_stats: {
        Args: { p_team_id?: string };
        Returns: Json;
      };
      scrap_equipment: {
        Args: { p_equipment_id: string; p_reason: string };
        Returns: boolean;
      };
    };
    Enums: {
      user_role: UserRole;
      equipment_status: EquipmentStatus;
      criticality_level: CriticalityLevel;
      ownership_type: OwnershipType;
      request_type: RequestType;
      priority_level: PriorityLevel;
      request_status: RequestStatus;
      log_action: LogAction;
      frequency_type: FrequencyType;
      notification_type: NotificationType;
    };
  };
}

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Insertable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Updatable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Convenient type aliases
export type User = Tables<'users'>;
export type Department = Tables<'departments'>;
export type Equipment = Tables<'equipment'>;
export type MaintenanceTeam = Tables<'maintenance_teams'>;
export type TeamMember = Tables<'team_members'>;
export type MaintenanceRequest = Tables<'maintenance_requests'>;
export type MaintenanceLog = Tables<'maintenance_logs'>;
export type PreventiveSchedule = Tables<'preventive_schedules'>;
export type Notification = Tables<'notifications'>;
export type FileAttachment = Tables<'file_attachments'>;
