'use client';

import * as React from 'react';
import { DataTable, Column } from '@/components/common/data-table';
import { StatusBadge, RequestStatus } from '@/components/common/status-badge';
import { PriorityIndicator, Priority } from '@/components/common/priority-indicator';
import { UserAvatar } from '@/components/common/user-avatar';
import { DateDisplay } from '@/components/common/date-display';
import { Button } from '@/components/ui/button';
import { Eye, Wrench, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RequestListItem {
  id: string;
  requestNumber: string;
  title: string;
  equipmentName: string;
  status: RequestStatus;
  priority: Priority;
  type: 'corrective' | 'preventive';
  assigneeName?: string;
  assigneeAvatar?: string;
  dueDate?: string;
  createdAt: string;
}

interface RequestListProps {
  requests: RequestListItem[];
  onView: (request: RequestListItem) => void;
  loading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  className?: string;
}

export function RequestList({
  requests,
  onView,
  loading = false,
  pagination,
  className,
}: RequestListProps) {
  const columns: Column<RequestListItem>[] = [
    {
      key: 'requestNumber',
      header: 'Request #',
      sortable: true,
      render: (item) => (
        <span className="font-mono text-sm">{item.requestNumber}</span>
      ),
    },
    {
      key: 'title',
      header: 'Title',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-2">
          {item.type === 'preventive' ? (
            <Calendar className="h-4 w-4 text-blue-500" />
          ) : (
            <Wrench className="h-4 w-4 text-orange-500" />
          )}
          <span className="truncate max-w-[200px]">{item.title}</span>
        </div>
      ),
    },
    {
      key: 'equipmentName',
      header: 'Equipment',
      sortable: true,
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (item) => <PriorityIndicator priority={item.priority} showLabel size="sm" />,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} size="sm" />,
    },
    {
      key: 'assigneeName',
      header: 'Assignee',
      render: (item) =>
        item.assigneeName ? (
          <UserAvatar
            name={item.assigneeName}
            imageUrl={item.assigneeAvatar}
            size="sm"
            showName
          />
        ) : (
          <span className="text-muted-foreground">Unassigned</span>
        ),
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      sortable: true,
      render: (item) =>
        item.dueDate ? (
          <DateDisplay date={item.dueDate} isDueDate />
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (item) => <DateDisplay date={item.createdAt} showRelative />,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-[50px]',
      render: (item) => (
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
      ),
    },
  ];

  return (
    <DataTable
      data={requests}
      columns={columns}
      keyExtractor={(item) => item.id}
      onRowClick={onView}
      sortable
      loading={loading}
      pagination={pagination}
      emptyMessage="No maintenance requests found"
      className={className}
    />
  );
}
