// Equipment hooks
export {
  equipmentKeys,
  useEquipmentList,
  useEquipment,
  useEquipmentCategories,
  useEquipmentLocations,
  useEquipmentMaintenanceHistory,
  useCreateEquipment,
  useUpdateEquipment,
  useDeleteEquipment,
  useScrapEquipment,
} from './useEquipment';

// Request hooks
export {
  requestKeys,
  useRequestList,
  useRequestsByStatus,
  useRequest,
  useRequestLogs,
  useOverdueCount,
  useCreateRequest,
  useUpdateRequest,
  useUpdateRequestStatus,
  useAssignRequest,
  useAddWorkLog,
  useCompleteRequest,
} from './useRequests';

// Team hooks
export {
  teamKeys,
  useTeamList,
  useTeam,
  useTeamMembers,
  useAvailableTechnicians,
  useTeamWorkload,
  useCreateTeam,
  useUpdateTeam,
  useDeleteTeam,
  useAddTeamMember,
  useRemoveTeamMember,
} from './useTeams';

// User hooks
export {
  userKeys,
  departmentKeys,
  useUserList,
  useUser,
  useUsersByDepartment,
  useUpdateUserProfile,
  useDepartmentList,
  useDepartment,
} from './useUsers';

// Schedule hooks
export {
  scheduleKeys,
  useScheduleList,
  useSchedulesForCalendar,
  useRequestsForCalendar,
  useCalendarEvents,
  useCreateSchedule,
  useUpdateSchedule,
  useDeleteSchedule,
} from './useSchedules';
