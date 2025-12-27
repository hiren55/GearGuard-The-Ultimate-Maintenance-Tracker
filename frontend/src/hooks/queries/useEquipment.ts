'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchEquipmentList,
  fetchEquipment,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  scrapEquipment,
  fetchEquipmentCategories,
  fetchEquipmentLocations,
  fetchEquipmentMaintenanceHistory,
} from '@/lib/api/equipment';
import type {
  EquipmentFilters,
  PaginationParams,
  CreateEquipmentFormData,
} from '@/types';

// Query keys
export const equipmentKeys = {
  all: ['equipment'] as const,
  lists: () => [...equipmentKeys.all, 'list'] as const,
  list: (filters: EquipmentFilters, pagination: PaginationParams) =>
    [...equipmentKeys.lists(), { filters, pagination }] as const,
  details: () => [...equipmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...equipmentKeys.details(), id] as const,
  categories: () => [...equipmentKeys.all, 'categories'] as const,
  locations: () => [...equipmentKeys.all, 'locations'] as const,
  history: (id: string) => [...equipmentKeys.all, 'history', id] as const,
};

// Hooks
export function useEquipmentList(
  filters: EquipmentFilters = {},
  pagination: PaginationParams = { page: 1, pageSize: 10 }
) {
  return useQuery({
    queryKey: equipmentKeys.list(filters, pagination),
    queryFn: () => fetchEquipmentList(filters, pagination),
  });
}

export function useEquipment(id: string) {
  return useQuery({
    queryKey: equipmentKeys.detail(id),
    queryFn: () => fetchEquipment(id),
    enabled: !!id,
  });
}

export function useEquipmentCategories() {
  return useQuery({
    queryKey: equipmentKeys.categories(),
    queryFn: fetchEquipmentCategories,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useEquipmentLocations() {
  return useQuery({
    queryKey: equipmentKeys.locations(),
    queryFn: fetchEquipmentLocations,
    staleTime: 5 * 60 * 1000,
  });
}

export function useEquipmentMaintenanceHistory(id: string, limit?: number) {
  return useQuery({
    queryKey: equipmentKeys.history(id),
    queryFn: () => fetchEquipmentMaintenanceHistory(id, limit),
    enabled: !!id,
  });
}

export function useCreateEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, userId }: { data: CreateEquipmentFormData; userId: string }) =>
      createEquipment(data, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });
    },
  });
}

export function useUpdateEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateEquipmentFormData> }) =>
      updateEquipment(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.detail(id) });
    },
  });
}

export function useDeleteEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteEquipment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });
    },
  });
}

export function useScrapEquipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      scrapEquipment(id, reason),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: equipmentKeys.detail(id) });
    },
  });
}
