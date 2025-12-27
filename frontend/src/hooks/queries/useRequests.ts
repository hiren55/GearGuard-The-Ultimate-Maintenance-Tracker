'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  fetchRequestList,
  fetchRequestsByStatus,
  fetchRequest,
  createRequest,
  updateRequest,
  updateRequestStatus,
  assignRequest,
  addWorkLog,
  completeRequest,
  fetchRequestLogs,
  fetchOverdueCount,
} from '@/lib/api/requests';
import type {
  RequestFilters,
  PaginationParams,
  CreateRequestFormData,
  MaintenanceRequest,
  RequestStatus,
} from '@/types';

// Helper to check and warn about audit log failures
function checkAuditLogResult(result: { auditLogSuccess?: boolean; auditLogError?: string }) {
  if (result.auditLogSuccess === false) {
    toast.warning('Action completed, but audit log failed to save', {
      description: result.auditLogError || 'The action was successful but the audit trail could not be recorded.',
      duration: 5000,
    });
  }
}

// Query keys
export const requestKeys = {
  all: ['requests'] as const,
  lists: () => [...requestKeys.all, 'list'] as const,
  list: (filters: RequestFilters, pagination: PaginationParams) =>
    [...requestKeys.lists(), { filters, pagination }] as const,
  byStatus: () => [...requestKeys.all, 'byStatus'] as const,
  details: () => [...requestKeys.all, 'detail'] as const,
  detail: (id: string) => [...requestKeys.details(), id] as const,
  logs: (id: string) => [...requestKeys.all, 'logs', id] as const,
  overdueCount: () => [...requestKeys.all, 'overdueCount'] as const,
};

// Hooks
export function useRequestList(
  filters: RequestFilters = {},
  pagination: PaginationParams = { page: 1, pageSize: 10 }
) {
  return useQuery({
    queryKey: requestKeys.list(filters, pagination),
    queryFn: () => fetchRequestList(filters, pagination),
  });
}

export function useRequestsByStatus() {
  return useQuery({
    queryKey: requestKeys.byStatus(),
    queryFn: fetchRequestsByStatus,
  });
}

export function useRequest(id: string) {
  return useQuery({
    queryKey: requestKeys.detail(id),
    queryFn: () => fetchRequest(id),
    enabled: !!id,
  });
}

export function useRequestLogs(requestId: string) {
  return useQuery({
    queryKey: requestKeys.logs(requestId),
    queryFn: () => fetchRequestLogs(requestId),
    enabled: !!requestId,
  });
}

export function useOverdueCount() {
  return useQuery({
    queryKey: requestKeys.overdueCount(),
    queryFn: fetchOverdueCount,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
}

export function useCreateRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, requesterId }: { data: CreateRequestFormData; requesterId: string }) =>
      createRequest(data, requesterId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: requestKeys.byStatus() });
    },
  });
}

export function useUpdateRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<MaintenanceRequest> }) =>
      updateRequest(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: requestKeys.byStatus() });
      queryClient.invalidateQueries({ queryKey: requestKeys.detail(id) });
    },
  });
}

export function useUpdateRequestStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
      userId,
      notes,
    }: {
      id: string;
      status: RequestStatus;
      userId: string;
      notes?: string;
    }) => updateRequestStatus(id, status, userId, notes),
    onSuccess: (result, { id }) => {
      // Check if audit log failed and warn user
      checkAuditLogResult(result);

      queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: requestKeys.byStatus() });
      queryClient.invalidateQueries({ queryKey: requestKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: requestKeys.logs(id) });
      queryClient.invalidateQueries({ queryKey: requestKeys.overdueCount() });
    },
  });
}

export function useAssignRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      assignedToId,
      assignedById,
      teamId,
    }: {
      id: string;
      assignedToId: string;
      assignedById: string;
      teamId?: string;
    }) => assignRequest(id, assignedToId, assignedById, teamId),
    onSuccess: (result, { id }) => {
      // Check if audit log failed and warn user
      checkAuditLogResult(result);

      queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: requestKeys.byStatus() });
      queryClient.invalidateQueries({ queryKey: requestKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: requestKeys.logs(id) });
    },
  });
}

export function useAddWorkLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      requestId,
      userId,
      notes,
      laborHours,
      partsUsed,
    }: {
      requestId: string;
      userId: string;
      notes: string;
      laborHours?: number;
      partsUsed?: string;
    }) => addWorkLog(requestId, userId, notes, laborHours, partsUsed),
    onSuccess: (_, { requestId }) => {
      queryClient.invalidateQueries({ queryKey: requestKeys.detail(requestId) });
      queryClient.invalidateQueries({ queryKey: requestKeys.logs(requestId) });
    },
  });
}

export function useCompleteRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      userId,
      resolution,
      laborHours,
      partsUsed,
      actualCost,
    }: {
      id: string;
      userId: string;
      resolution: string;
      laborHours?: number;
      partsUsed?: string;
      actualCost?: number;
    }) => completeRequest(id, userId, resolution, laborHours, partsUsed, actualCost),
    onSuccess: (result, { id }) => {
      // Check if audit log failed and warn user
      checkAuditLogResult(result);

      queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: requestKeys.byStatus() });
      queryClient.invalidateQueries({ queryKey: requestKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: requestKeys.logs(id) });
      queryClient.invalidateQueries({ queryKey: requestKeys.overdueCount() });
    },
  });
}
