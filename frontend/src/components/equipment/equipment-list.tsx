'use client';

import * as React from 'react';
import { DataTable, Column } from '@/components/common/data-table';
import { StatusBadge } from '@/components/common/status-badge';
import { DateDisplay } from '@/components/common/date-display';
import { Button } from '@/components/ui/button';
import { Wrench, Eye, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EquipmentListItem {
  id: string;
  name: string;
  serialNumber: string;
  category: string;
  location: string;
  status: 'active' | 'under_maintenance' | 'scrapped';
  ownerName: string;
  lastMaintenanceDate?: string;
}

interface EquipmentListProps {
  equipment: EquipmentListItem[];
  onView: (equipment: EquipmentListItem) => void;
  onEdit?: (equipment: EquipmentListItem) => void;
  onDelete?: (equipment: EquipmentListItem) => void;
  onRequestMaintenance?: (equipment: EquipmentListItem) => void;
  loading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  className?: string;
}

export function EquipmentList({
  equipment,
  onView,
  onEdit,
  onDelete,
  onRequestMaintenance,
  loading = false,
  pagination,
  className,
}: EquipmentListProps) {
  const columns: Column<EquipmentListItem>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (item) => (
        <div>
          <div className="font-medium">{item.name}</div>
          <div className="text-sm text-muted-foreground">{item.serialNumber}</div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
    },
    {
      key: 'location',
      header: 'Location',
      sortable: true,
    },
    {
      key: 'ownerName',
      header: 'Owner',
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} size="sm" />,
    },
    {
      key: 'lastMaintenanceDate',
      header: 'Last Maintenance',
      render: (item) =>
        item.lastMaintenanceDate ? (
          <DateDisplay date={item.lastMaintenanceDate} />
        ) : (
          <span className="text-muted-foreground">Never</span>
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'w-[120px]',
      render: (item) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              onView(item);
            }}
            title="View"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {onEdit && item.status !== 'scrapped' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onRequestMaintenance && item.status !== 'scrapped' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                onRequestMaintenance(item);
              }}
              title="Request Maintenance"
            >
              <Wrench className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item);
              }}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <DataTable
      data={equipment}
      columns={columns}
      keyExtractor={(item) => item.id}
      onRowClick={onView}
      sortable
      loading={loading}
      pagination={pagination}
      emptyMessage="No equipment found"
      className={className}
    />
  );
}
