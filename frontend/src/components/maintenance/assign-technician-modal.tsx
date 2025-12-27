'use client';

import * as React from 'react';
import { X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/components/common/user-avatar';
import { cn } from '@/lib/utils';

interface Technician {
  id: string;
  name: string;
  avatar?: string;
  specialization?: string;
  activeTaskCount?: number;
}

interface AssignTechnicianModalProps {
  open: boolean;
  onClose: () => void;
  onAssign: (technicianId: string) => void;
  technicians: Technician[];
  currentAssigneeId?: string;
  isLoading?: boolean;
}

export function AssignTechnicianModal({
  open,
  onClose,
  onAssign,
  technicians,
  currentAssigneeId,
  isLoading = false,
}: AssignTechnicianModalProps) {
  const [search, setSearch] = React.useState('');
  const [selectedId, setSelectedId] = React.useState<string | null>(currentAssigneeId || null);

  const filteredTechnicians = technicians.filter((tech) =>
    tech.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAssign = () => {
    if (selectedId) {
      onAssign(selectedId);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-50 w-full max-w-md rounded-lg bg-background shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">Assign Technician</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search technicians..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Technician List */}
          <div className="max-h-[300px] overflow-y-auto space-y-1">
            {filteredTechnicians.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No technicians found
              </p>
            ) : (
              filteredTechnicians.map((tech) => (
                <button
                  key={tech.id}
                  type="button"
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
                    selectedId === tech.id
                      ? 'bg-primary/10 border border-primary'
                      : 'hover:bg-muted'
                  )}
                  onClick={() => setSelectedId(tech.id)}
                >
                  <UserAvatar name={tech.name} imageUrl={tech.avatar} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{tech.name}</div>
                    {tech.specialization && (
                      <div className="text-sm text-muted-foreground">
                        {tech.specialization}
                      </div>
                    )}
                  </div>
                  {tech.activeTaskCount !== undefined && (
                    <div className="text-sm text-muted-foreground">
                      {tech.activeTaskCount} active
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t p-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedId}
            isLoading={isLoading}
          >
            Assign
          </Button>
        </div>
      </div>
    </div>
  );
}
