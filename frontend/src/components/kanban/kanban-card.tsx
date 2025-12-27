'use client';

import * as React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, Wrench, Calendar as CalendarIcon, GripVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PriorityIndicator, Priority } from '@/components/common/priority-indicator';
import { UserAvatar } from '@/components/common/user-avatar';
import { DateDisplay } from '@/components/common/date-display';
import { cn } from '@/lib/utils';

export interface KanbanCardData {
  id: string;
  requestNumber: string;
  title: string;
  equipmentName: string;
  priority: Priority;
  type: 'corrective' | 'preventive';
  assigneeName?: string;
  assigneeAvatar?: string;
  dueDate?: string;
}

interface KanbanCardProps {
  card: KanbanCardData;
  onClick?: () => void;
  isDragging?: boolean;
}

export function KanbanCard({ card, onClick, isDragging = false }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dragging = isDragging || isSortableDragging;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'cursor-pointer transition-all hover:shadow-md hover:border-primary/50',
        dragging && 'opacity-50 shadow-lg rotate-2 scale-105'
      )}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          {/* Drag Handle */}
          <button
            className="cursor-grab active:cursor-grabbing p-0.5 -ml-1 text-muted-foreground hover:text-foreground"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground font-mono">
                {card.requestNumber}
              </span>
              <PriorityIndicator priority={card.priority} size="sm" />
              {card.type === 'preventive' ? (
                <CalendarIcon className="h-3.5 w-3.5 text-blue-500" />
              ) : (
                <Wrench className="h-3.5 w-3.5 text-orange-500" />
              )}
            </div>

            {/* Title */}
            <h4 className="text-sm font-medium truncate mb-2">{card.title}</h4>

            {/* Equipment */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
              <Wrench className="h-3 w-3" />
              <span className="truncate">{card.equipmentName}</span>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between">
              {card.dueDate ? (
                <div className="flex items-center gap-1 text-xs">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <DateDisplay date={card.dueDate} isDueDate showRelative />
                </div>
              ) : (
                <div />
              )}

              {card.assigneeName && (
                <UserAvatar
                  name={card.assigneeName}
                  imageUrl={card.assigneeAvatar}
                  size="sm"
                />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
