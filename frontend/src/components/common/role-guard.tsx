'use client';

import * as React from 'react';
import { useAuth } from '@/hooks/use-auth';

type Role = 'admin' | 'manager' | 'team_leader' | 'technician' | 'requester';

interface RoleGuardProps {
  allowedRoles: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGuard({ allowedRoles, children, fallback = null }: RoleGuardProps) {
  const { user } = useAuth();

  if (!user) {
    return <>{fallback}</>;
  }

  const userRole = user.role as Role;

  if (!allowedRoles.includes(userRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
