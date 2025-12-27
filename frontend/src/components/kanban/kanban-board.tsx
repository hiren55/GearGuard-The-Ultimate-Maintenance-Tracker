'use client';

import * as React from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { KanbanColumn } from './kanban-column';
import { KanbanCard, KanbanCardData } from './kanban-card';
import { RequestStatus } from '@/components/common/status-badge';
import { cn } from '@/lib/utils';

interface KanbanBoardProps {
  columns: {
    id: RequestStatus;
    title: string;
    cards: KanbanCardData[];
  }[];
  onCardMove: (cardId: string, fromStatus: RequestStatus, toStatus: RequestStatus) => void;
  onCardClick?: (card: KanbanCardData) => void;
  isDropAllowed?: (cardId: string, fromStatus: RequestStatus, toStatus: RequestStatus) => boolean;
  className?: string;
}

export function KanbanBoard({
  columns,
  onCardMove,
  onCardClick,
  isDropAllowed,
  className,
}: KanbanBoardProps) {
  const [activeCard, setActiveCard] = React.useState<KanbanCardData | null>(null);
  const [activeColumnId, setActiveColumnId] = React.useState<RequestStatus | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findCardById = (cardId: string): KanbanCardData | undefined => {
    for (const column of columns) {
      const card = column.cards.find((c) => c.id === cardId);
      if (card) return card;
    }
    return undefined;
  };

  const findColumnByCardId = (cardId: string): RequestStatus | undefined => {
    for (const column of columns) {
      const card = column.cards.find((c) => c.id === cardId);
      if (card) return column.id;
    }
    return undefined;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const card = findCardById(active.id as string);
    const columnId = findColumnByCardId(active.id as string);
    if (card) {
      setActiveCard(card);
      setActiveColumnId(columnId || null);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Visual feedback during drag can be handled here
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !activeCard || !activeColumnId) {
      setActiveCard(null);
      setActiveColumnId(null);
      return;
    }

    const overId = over.id as string;
    let targetColumnId: RequestStatus | undefined;

    // Check if dropped on a column
    const column = columns.find((c) => c.id === overId);
    if (column) {
      targetColumnId = column.id;
    } else {
      // Check if dropped on another card
      targetColumnId = findColumnByCardId(overId);
    }

    if (targetColumnId && targetColumnId !== activeColumnId) {
      // Check if drop is allowed
      if (isDropAllowed && !isDropAllowed(activeCard.id, activeColumnId, targetColumnId)) {
        setActiveCard(null);
        setActiveColumnId(null);
        return;
      }

      onCardMove(activeCard.id, activeColumnId, targetColumnId);
    }

    setActiveCard(null);
    setActiveColumnId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div
        className={cn(
          'flex gap-4 overflow-x-auto pb-4',
          className
        )}
      >
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            id={column.id}
            title={column.title}
            cards={column.cards}
            count={column.cards.length}
            onCardClick={onCardClick}
          />
        ))}
      </div>

      <DragOverlay>
        {activeCard ? (
          <KanbanCard card={activeCard} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
