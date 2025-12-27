'use client';

import * as React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface RequestFiltersData {
  search: string;
  status: string;
  priority: string;
  type: string;
  teamId: string;
  assigneeId: string;
  overdueOnly: boolean;
}

interface RequestFiltersProps {
  filters: RequestFiltersData;
  onFiltersChange: (filters: RequestFiltersData) => void;
  teams?: { id: string; name: string }[];
  assignees?: { id: string; name: string }[];
  className?: string;
}

export function RequestFilters({
  filters,
  onFiltersChange,
  teams = [],
  assignees = [],
  className,
}: RequestFiltersProps) {
  const [showFilters, setShowFilters] = React.useState(false);

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleFilterChange = (key: keyof RequestFiltersData, value: string | boolean) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      status: '',
      priority: '',
      type: '',
      teamId: '',
      assigneeId: '',
      overdueOnly: false,
    });
  };

  const activeFilterCount = [
    filters.status,
    filters.priority,
    filters.type,
    filters.teamId,
    filters.assigneeId,
    filters.overdueOnly,
  ].filter(Boolean).length;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search requests..."
            className="pl-8"
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(activeFilterCount > 0 && 'border-primary')}
        >
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {activeFilterCount}
            </span>
          )}
        </Button>
        {activeFilterCount > 0 && (
          <Button variant="ghost" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Status</label>
            <select
              className="flex h-9 w-[150px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All</option>
              <option value="new">New</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="verified">Verified</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Priority</label>
            <select
              className="flex h-9 w-[150px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
            >
              <option value="">All</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Type</label>
            <select
              className="flex h-9 w-[150px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="">All</option>
              <option value="corrective">Corrective</option>
              <option value="preventive">Preventive</option>
            </select>
          </div>

          {teams.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Team</label>
              <select
                className="flex h-9 w-[150px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
            </div>
          )}

          {assignees.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Assignee</label>
              <select
                className="flex h-9 w-[150px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={filters.assigneeId}
                onChange={(e) => handleFilterChange('assigneeId', e.target.value)}
              >
                <option value="">All</option>
                {assignees.map((assignee) => (
                  <option key={assignee.id} value={assignee.id}>
                    {assignee.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium">&nbsp;</label>
            <label className="flex items-center gap-2 h-9">
              <input
                type="checkbox"
                checked={filters.overdueOnly}
                onChange={(e) => handleFilterChange('overdueOnly', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm">Overdue only</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
