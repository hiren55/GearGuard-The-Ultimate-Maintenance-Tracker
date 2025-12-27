'use client';

import * as React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface KanbanFiltersData {
  search: string;
  priority: string;
  type: string;
  teamId: string;
  assigneeId: string;
}

interface KanbanFiltersProps {
  filters: KanbanFiltersData;
  onFiltersChange: (filters: KanbanFiltersData) => void;
  teams?: { id: string; name: string }[];
  assignees?: { id: string; name: string }[];
  className?: string;
}

export function KanbanFilters({
  filters,
  onFiltersChange,
  teams = [],
  assignees = [],
  className,
}: KanbanFiltersProps) {
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleFilterChange = (key: keyof KanbanFiltersData, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      priority: '',
      type: '',
      teamId: '',
      assigneeId: '',
    });
  };

  const activeFilterCount = [
    filters.priority,
    filters.type,
    filters.teamId,
    filters.assigneeId,
  ].filter(Boolean).length;

  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {/* Search */}
      <div className="relative w-[200px]">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search cards..."
          className="pl-8 h-9"
          value={filters.search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      {/* Priority */}
      <select
        className="flex h-9 w-[120px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        value={filters.priority}
        onChange={(e) => handleFilterChange('priority', e.target.value)}
      >
        <option value="">All Priority</option>
        <option value="critical">Critical</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>

      {/* Type */}
      <select
        className="flex h-9 w-[120px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        value={filters.type}
        onChange={(e) => handleFilterChange('type', e.target.value)}
      >
        <option value="">All Types</option>
        <option value="corrective">Corrective</option>
        <option value="preventive">Preventive</option>
      </select>

      {/* Team */}
      {teams.length > 0 && (
        <select
          className="flex h-9 w-[140px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={filters.teamId}
          onChange={(e) => handleFilterChange('teamId', e.target.value)}
        >
          <option value="">All Teams</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      )}

      {/* Assignee */}
      {assignees.length > 0 && (
        <select
          className="flex h-9 w-[140px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          value={filters.assigneeId}
          onChange={(e) => handleFilterChange('assigneeId', e.target.value)}
        >
          <option value="">All Assignees</option>
          {assignees.map((assignee) => (
            <option key={assignee.id} value={assignee.id}>
              {assignee.name}
            </option>
          ))}
        </select>
      )}

      {/* Clear */}
      {activeFilterCount > 0 && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="mr-1 h-4 w-4" />
          Clear ({activeFilterCount})
        </Button>
      )}
    </div>
  );
}
