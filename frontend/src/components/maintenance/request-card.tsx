'use client';

import * as React from 'react';
import { Clock, Wrench, Calendar as CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge, RequestStatus } from '@/components/common/status-badge';
import { PriorityIndicator, Priority } from '@/components/common/priority-indicator';
import { UserAvatar } from '@/components/common/user-avatar';
import { DateDisplay } from '@/components/common/date-display';
import { cn } from '@/lib/utils';

export interface RequestCardData {
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

interface RequestCardProps {
  request: RequestCardData;
  onClick?: () => void;
  draggable?: boolean;
  className?: string;
}

export function RequestCard({
  request,
  onClick,
  draggable = false,
  className,
}: RequestCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md hover:border-primary/50',
        draggable && 'cursor-grab active:cursor-grabbing',
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2 pt-3 px-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground font-mono">
                {request.requestNumber}
              </span>
              <PriorityIndicator priority={request.priority} size="sm" />
            </div>
            <CardTitle className="text-sm font-medium truncate">
              {request.title}
            </CardTitle>
          </div>
          {request.type === 'preventive' ? (
            <CalendarIcon className="h-4 w-4 text-blue-500 flex-shrink-0" />
          ) : (
            <Wrench className="h-4 w-4 text-orange-500 flex-shrink-0" />
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-3 px-3">
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Wrench className="h-3 w-3" />
            <span className="truncate">{request.equipmentName}</span>
          </div>

          {request.dueDate && (
            <div className="flex items-center gap-1 text-xs">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <DateDisplay
                date={request.dueDate}
                isDueDate
                showRelative
              />
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <StatusBadge status={request.status} size="sm" />
            {request.assigneeName && (
              <UserAvatar
                name={request.assigneeName}
                imageUrl={request.assigneeAvatar}
                size="sm"
              />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
