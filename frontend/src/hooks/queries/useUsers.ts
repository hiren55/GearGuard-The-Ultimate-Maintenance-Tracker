'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchUserList,
  fetchUser,
  updateUserProfile,
  fetchDepartmentList,
  fetchDepartment,
  fetchUsersByDepartment,
} from '@/lib/api/users';
import type { User } from '@/types';

// Query keys
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  byDepartment: (deptId: string) => [...userKeys.all, 'byDepartment', deptId] as const,
};

export const departmentKeys = {
  all: ['departments'] as const,
  lists: () => [...departmentKeys.all, 'list'] as const,
  details: () => [...departmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...departmentKeys.details(), id] as const,
};

// User Hooks
export function useUserList() {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: fetchUserList,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => fetchUser(id),
    enabled: !!id,
  });
}

export function useUsersByDepartment(departmentId: string) {
  return useQuery({
    queryKey: userKeys.byDepartment(departmentId),
    queryFn: () => fetchUsersByDepartment(departmentId),
    enabled: !!departmentId,
  });
}

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<Pick<User, 'full_name' | 'phone' | 'avatar_url'>>;
    }) => updateUserProfile(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
    },
  });
}

// Department Hooks
export function useDepartmentList() {
  return useQuery({
    queryKey: departmentKeys.lists(),
    queryFn: fetchDepartmentList,
    staleTime: 10 * 60 * 1000, // 10 minutes - departments don't change often
  });
}

export function useDepartment(id: string) {
  return useQuery({
    queryKey: departmentKeys.detail(id),
    queryFn: () => fetchDepartment(id),
    enabled: !!id,
  });
}
