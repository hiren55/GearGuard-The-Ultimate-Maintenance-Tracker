'use client';

import * as React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { KanbanCard, KanbanCardData } from './kanban-card';
import { RequestStatus } from '@/components/common/status-badge';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  id: RequestStatus;
  title: string;
  cards: KanbanCardData[];
  count: number;
  onCardClick?: (card: KanbanCardData) => void;
}

const columnColors: Partial<Record<RequestStatus, string>> = {
  new: 'border-t-gray-400',
  assigned: 'border-t-blue-400',
  in_progress: 'border-t-yellow-400',
  on_hold: 'border-t-orange-400',
  completed: 'border-t-green-400',
  verified: 'border-t-green-600',
  cancelled: 'border-t-gray-300',
};

export function KanbanColumn({
  id,
  title,
  cards,
  count,
  onCardClick,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col w-[300px] min-w-[300px] bg-muted/30 rounded-lg border-t-4',
        columnColors[id] || 'border-t-gray-400',
        isOver && 'ring-2 ring-primary ring-offset-2'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-medium">{title}</h3>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
          {count}
        </span>
      </div>

      {/* Cards */}
      <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[200px]">
          {cards.length === 0 ? (
            <div className="flex items-center justify-center h-[100px] text-sm text-muted-foreground">
              No items
            </div>
          ) : (
            cards.map((card) => (
              <KanbanCard
                key={card.id}
                card={card}
                onClick={() => onCardClick?.(card)}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}
