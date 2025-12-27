'use client';

import * as React from 'react';
import { Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MaintenanceButtonProps {
  equipmentId: string;
  equipmentName: string;
  defaultTeamId?: string;
  onRequestMaintenance: (data: {
    equipmentId: string;
    equipmentName: string;
    defaultTeamId?: string;
    type: 'corrective';
  }) => void;
  disabled?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function MaintenanceButton({
  equipmentId,
  equipmentName,
  defaultTeamId,
  onRequestMaintenance,
  disabled = false,
  variant = 'default',
  size = 'default',
  className,
}: MaintenanceButtonProps) {
  const handleClick = () => {
    onRequestMaintenance({
      equipmentId,
      equipmentName,
      defaultTeamId,
      type: 'corrective',
    });
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={disabled}
      className={className}
    >
      <Wrench className="mr-2 h-4 w-4" />
      Request Maintenance
    </Button>
  );
}
