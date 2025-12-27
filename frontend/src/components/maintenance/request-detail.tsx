'use client';

import * as React from 'react';
import { Wrench, Calendar, Clock, User, Users, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge, RequestStatus } from '@/components/common/status-badge';
import { PriorityIndicator, Priority } from '@/components/common/priority-indicator';
import { UserAvatar } from '@/components/common/user-avatar';
import { DateDisplay } from '@/components/common/date-display';
import { cn } from '@/lib/utils';

export interface RequestDetailData {
  id: string;
  requestNumber: string;
  title: string;
  description: string;
  equipmentId: string;
  equipmentName: string;
  equipmentSerialNumber: string;
  status: RequestStatus;
  priority: Priority;
  type: 'corrective' | 'preventive';
  teamName?: string;
  assigneeName?: string;
  assigneeAvatar?: string;
  requesterName: string;
  dueDate?: string;
  createdAt: string;
  completedAt?: string;
  workNotes?: string;
  resolution?: string;
  laborHours?: number;
}

interface RequestDetailProps {
  request: RequestDetailData;
  onAssign?: () => void;
  onUpdateStatus?: (status: RequestStatus) => void;
  onAddWorkLog?: () => void;
  canAssign?: boolean;
  canUpdateStatus?: boolean;
  canAddWorkLog?: boolean;
  className?: string;
}

export function RequestDetail({
  request,
  onAssign,
  onUpdateStatus,
  onAddWorkLog,
  canAssign = false,
  canUpdateStatus = false,
  canAddWorkLog = false,
  className,
}: RequestDetailProps) {
  const getNextStatuses = (currentStatus: RequestStatus): RequestStatus[] => {
    switch (currentStatus) {
      case 'new':
        return ['assigned', 'cancelled'];
      case 'assigned':
        return ['in_progress', 'cancelled'];
      case 'in_progress':
        return ['completed', 'on_hold', 'cancelled'];
      case 'on_hold':
        return ['in_progress', 'cancelled'];
      case 'completed':
        return ['verified'];
      default:
        return [];
    }
  };

  const nextStatuses = getNextStatuses(request.status);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-sm text-muted-foreground font-mono">
              {request.requestNumber}
            </span>
            {request.type === 'preventive' ? (
              <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                <Calendar className="h-3 w-3" />
                Preventive
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                <Wrench className="h-3 w-3" />
                Corrective
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold">{request.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <StatusBadge status={request.status} size="lg" />
            <PriorityIndicator priority={request.priority} showLabel />
          </div>
        </div>
        <div className="flex gap-2">
          {canAssign && onAssign && request.status === 'new' && (
            <Button variant="outline" onClick={onAssign}>
              <User className="mr-2 h-4 w-4" />
              Assign
            </Button>
          )}
          {canAddWorkLog && onAddWorkLog && ['in_progress', 'on_hold'].includes(request.status) && (
            <Button variant="outline" onClick={onAddWorkLog}>
              <FileText className="mr-2 h-4 w-4" />
              Add Work Log
            </Button>
          )}
          {canUpdateStatus && nextStatuses.length > 0 && (
            <div className="flex gap-2">
              {nextStatuses.map((status) => (
                <Button
                  key={status}
                  variant={status === 'cancelled' ? 'destructive' : 'default'}
                  onClick={() => onUpdateStatus?.(status)}
                >
                  Mark as {status.replace('_', ' ')}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Equipment Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Equipment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="font-medium">{request.equipmentName}</span>
                <p className="text-sm text-muted-foreground">{request.equipmentSerialNumber}</p>
              </div>
              <Button variant="link" className="p-0 h-auto">
                View Equipment Details
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Assignment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {request.teamName && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Team:</span>
                <span className="text-sm">{request.teamName}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Technician:</span>
              {request.assigneeName ? (
                <UserAvatar
                  name={request.assigneeName}
                  imageUrl={request.assigneeAvatar}
                  size="sm"
                  showName
                />
              ) : (
                <span className="text-sm text-muted-foreground">Unassigned</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dates */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Created:</span>
              <DateDisplay date={request.createdAt} showTime />
            </div>
            {request.dueDate && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Due:</span>
                <DateDisplay date={request.dueDate} isDueDate />
              </div>
            )}
            {request.completedAt && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Completed:</span>
                <DateDisplay date={request.completedAt} showTime />
              </div>
            )}
            {request.laborHours !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Labor Hours:</span>
                <span className="text-sm">{request.laborHours}h</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Requester */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Requester
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UserAvatar name={request.requesterName} size="md" showName />
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap">{request.description}</p>
        </CardContent>
      </Card>

      {/* Work Notes */}
      {request.workNotes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Work Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{request.workNotes}</p>
          </CardContent>
        </Card>
      )}

      {/* Resolution */}
      {request.resolution && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resolution</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{request.resolution}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
