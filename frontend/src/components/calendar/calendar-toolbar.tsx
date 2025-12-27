'use client';

import * as React from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CalendarToolbarProps {
  onFilterChange?: (filters: CalendarFilters) => void;
  className?: string;
}

export interface CalendarFilters {
  showPreventive: boolean;
  showCorrective: boolean;
  showCompleted: boolean;
  teamId?: string;
  equipmentId?: string;
}

export function CalendarToolbar({ onFilterChange, className }: CalendarToolbarProps) {
  const [filters, setFilters] = React.useState<CalendarFilters>({
    showPreventive: true,
    showCorrective: true,
    showCompleted: false,
  });

  const handleFilterChange = (key: keyof CalendarFilters, value: boolean) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange?.(newFilters);
  };

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      <Button variant="outline" size="sm">
        <Filter className="mr-2 h-4 w-4" />
        Filter
      </Button>

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            checked={filters.showPreventive}
            onChange={(e) => handleFilterChange('showPreventive', e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Preventive
          </span>
        </label>

        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            checked={filters.showCorrective}
            onChange={(e) => handleFilterChange('showCorrective', e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            Corrective
          </span>
        </label>

        <label className="flex items-center gap-1.5 text-sm">
          <input
            type="checkbox"
            checked={filters.showCompleted}
            onChange={(e) => handleFilterChange('showCompleted', e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Completed
          </span>
        </label>
      </div>
    </div>
  );
}
