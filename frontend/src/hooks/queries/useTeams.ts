'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTeamList,
  fetchTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  addTeamMember,
  removeTeamMember,
  fetchTeamMembers,
  fetchAvailableTechnicians,
  fetchTeamWorkload,
} from '@/lib/api/teams';
import type { MaintenanceTeam } from '@/types';

// Query keys
export const teamKeys = {
  all: ['teams'] as const,
  lists: () => [...teamKeys.all, 'list'] as const,
  details: () => [...teamKeys.all, 'detail'] as const,
  detail: (id: string) => [...teamKeys.details(), id] as const,
  members: (id: string) => [...teamKeys.all, 'members', id] as const,
  technicians: (teamId?: string) => [...teamKeys.all, 'technicians', teamId] as const,
  workload: (id: string) => [...teamKeys.all, 'workload', id] as const,
};

// Hooks
export function useTeamList() {
  return useQuery({
    queryKey: teamKeys.lists(),
    queryFn: fetchTeamList,
  });
}

export function useTeam(id: string) {
  return useQuery({
    queryKey: teamKeys.detail(id),
    queryFn: () => fetchTeam(id),
    enabled: !!id,
  });
}

export function useTeamMembers(teamId: string) {
  return useQuery({
    queryKey: teamKeys.members(teamId),
    queryFn: () => fetchTeamMembers(teamId),
    enabled: !!teamId,
  });
}

export function useAvailableTechnicians(teamId?: string) {
  return useQuery({
    queryKey: teamKeys.technicians(teamId),
    queryFn: () => fetchAvailableTechnicians(teamId),
  });
}

export function useTeamWorkload(teamId: string) {
  return useQuery({
    queryKey: teamKeys.workload(teamId),
    queryFn: () => fetchTeamWorkload(teamId),
    enabled: !!teamId,
    refetchInterval: 60 * 1000, // Refresh every minute
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      description?: string;
      specialization?: string;
      leader_id?: string;
    }) => createTeam(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
    },
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MaintenanceTeam> }) =>
      updateTeam(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(id) });
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTeam(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() });
    },
  });
}

export function useAddTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      addTeamMember(teamId, userId),
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(teamId) });
      queryClient.invalidateQueries({ queryKey: teamKeys.members(teamId) });
      queryClient.invalidateQueries({ queryKey: teamKeys.technicians(teamId) });
    },
  });
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      removeTeamMember(teamId, userId),
    onSuccess: (_, { teamId }) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(teamId) });
      queryClient.invalidateQueries({ queryKey: teamKeys.members(teamId) });
      queryClient.invalidateQueries({ queryKey: teamKeys.technicians(teamId) });
    },
  });
}
