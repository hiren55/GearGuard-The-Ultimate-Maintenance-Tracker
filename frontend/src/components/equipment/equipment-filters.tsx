'use client';

import * as React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface EquipmentFiltersData {
  search: string;
  status: string;
  category: string;
  location: string;
}

interface EquipmentFiltersProps {
  filters: EquipmentFiltersData;
  onFiltersChange: (filters: EquipmentFiltersData) => void;
  categories?: string[];
  locations?: string[];
  className?: string;
}

export function EquipmentFilters({
  filters,
  onFiltersChange,
  categories = [],
  locations = [],
  className,
}: EquipmentFiltersProps) {
  const [showFilters, setShowFilters] = React.useState(false);

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleFilterChange = (key: keyof EquipmentFiltersData, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      status: '',
      category: '',
      location: '',
    });
  };

  const hasActiveFilters =
    filters.status || filters.category || filters.location;

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search equipment..."
            className="pl-8"
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={cn(hasActiveFilters && 'border-primary')}
        >
          <Filter className="mr-2 h-4 w-4" />
          Filters
          {hasActiveFilters && (
            <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
              {[filters.status, filters.category, filters.location].filter(Boolean).length}
            </span>
          )}
        </Button>
        {hasActiveFilters && (
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
              className="flex h-9 w-[180px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="under_maintenance">Under Maintenance</option>
              <option value="scrapped">Scrapped</option>
            </select>
          </div>

          {categories.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Category</label>
              <select
                className="flex h-9 w-[180px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          )}

          {locations.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Location</label>
              <select
                className="flex h-9 w-[180px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
              >
                <option value="">All Locations</option>
                {locations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
