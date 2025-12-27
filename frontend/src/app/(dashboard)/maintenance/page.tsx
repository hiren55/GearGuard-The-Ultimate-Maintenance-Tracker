'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ClipboardList, Plus, LayoutGrid, List, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { useAuth } from '@/hooks/use-auth';
import {
  useRequestList,
  useRequestsByStatus,
  useCreateRequest,
  useUpdateRequestStatus,
  useTeamList,
  useEquipmentList,
} from '@/hooks/queries';
import { RequestFilters, RequestFiltersData } from '@/components/maintenance/request-filters';
import { RequestList, RequestListItem } from '@/components/maintenance/request-list';
import { RequestForm, RequestFormData } from '@/components/maintenance/request-form';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { KanbanCardData } from '@/components/kanban/kanban-card';
import { EmptyState } from '@/components/common/empty-state';
import { LoadingState } from '@/components/common/loading-state';
import type { RequestFilters as ApiFilters, RequestStatus } from '@/types';

type ViewMode = 'list' | 'kanban' | 'calendar';

const STATUS_LABELS: Record<RequestStatus, string> = {
  new: 'New',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  on_hold: 'On Hold',
  completed: 'Completed',
  verified: 'Verified',
  cancelled: 'Cancelled',
};

// Valid transitions for status changes
const VALID_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  new: ['assigned', 'cancelled'],
  assigned: ['in_progress', 'on_hold', 'new', 'cancelled'],
  in_progress: ['on_hold', 'completed', 'assigned'],
  on_hold: ['in_progress', 'cancelled'],
  completed: ['verified', 'in_progress'],
  verified: [],
  cancelled: [],
};

export default function MaintenancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, hasRole } = useAuth();

  const canCreate = true; // All authenticated users can create
  const canChangeStatus = hasRole('technician') || hasRole('team_leader') || hasRole('manager');

  // State
  const [viewMode, setViewMode] = React.useState<ViewMode>('list');
  const [filters, setFilters] = React.useState<RequestFiltersData>({
    search: '',
    status: '',
    priority: '',
    type: '',
    teamId: '',
    assigneeId: '',
    overdueOnly: false,
  });
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(10);
  const [showCreateModal, setShowCreateModal] = React.useState(false);

  // Check if we should pre-fill equipment
  const prefilledEquipmentId = searchParams.get('equipment_id');

  // Convert component filters to API filters
  const apiFilters: ApiFilters = {
    search: filters.search || undefined,
    status: filters.status as RequestStatus | undefined,
    priority: filters.priority as 'low' | 'medium' | 'high' | 'critical' | undefined,
    request_type: filters.type as 'corrective' | 'preventive' | undefined,
    assigned_team_id: filters.teamId || undefined,
    assigned_to_id: filters.assigneeId || undefined,
    is_overdue: filters.overdueOnly || undefined,
  };

  // Queries
  const { data: requestsData, isLoading: isLoadingList } = useRequestList(apiFilters, { page, pageSize });
  const { data: requestsByStatus, isLoading: isLoadingKanban } = useRequestsByStatus();
  const { data: teams = [] } = useTeamList();
  const { data: equipmentData } = useEquipmentList({}, { page: 1, pageSize: 100 });

  // Mutations
  const createMutation = useCreateRequest();
  const updateStatusMutation = useUpdateRequestStatus();

  // Transform API data for list view
  const requestList: RequestListItem[] = React.useMemo(() => {
    if (!requestsData?.data) return [];
    return requestsData.data.map((req) => ({
      id: req.id,
      requestNumber: req.request_number,
      title: req.title,
      equipmentName: req.equipment?.name || 'Unknown',
      status: req.status,
      priority: req.priority,
      type: req.request_type,
      assigneeName: req.assigned_to?.full_name,
      assigneeAvatar: req.assigned_to?.avatar_url,
      dueDate: req.due_date || undefined,
      createdAt: req.created_at,
    }));
  }, [requestsData]);

  // Transform API data for Kanban view
  const kanbanColumns = React.useMemo(() => {
    if (!requestsByStatus) return [];
    const displayStatuses: RequestStatus[] = ['new', 'assigned', 'in_progress', 'on_hold', 'completed'];

    return displayStatuses.map((status) => ({
      id: status,
      title: STATUS_LABELS[status],
      cards: (requestsByStatus[status] || []).map((req): KanbanCardData => ({
        id: req.id,
        requestNumber: req.request_number,
        title: req.title,
        equipmentName: req.equipment?.name || 'Unknown',
        priority: req.priority,
        type: req.request_type,
        assigneeName: req.assigned_to?.full_name,
        assigneeAvatar: req.assigned_to?.avatar_url,
        dueDate: req.due_date || undefined,
      })),
    }));
  }, [requestsByStatus]);

  // Equipment options for form
  const equipmentOptions = React.useMemo(() => {
    if (!equipmentData?.data) return [];
    return equipmentData.data
      .filter((eq) => eq.status !== 'scrapped')
      .map((eq) => ({ id: eq.id, name: eq.name }));
  }, [equipmentData]);

  // Team options for form and filters
  const teamOptions = React.useMemo(() => {
    return teams.map((team) => ({ id: team.id, name: team.name }));
  }, [teams]);

  // Handlers
  const handleView = (request: RequestListItem | KanbanCardData) => {
    router.push(`/maintenance/${request.id}`);
  };

  const handleCreateSubmit = async (data: RequestFormData) => {
    if (!user) return;
    await createMutation.mutateAsync({
      data: {
        equipment_id: data.equipmentId,
        title: data.title,
        description: data.description,
        request_type: data.type,
        priority: data.priority,
        due_date: data.dueDate,
        assigned_team_id: data.teamId,
      },
      requesterId: user.id,
    });
    setShowCreateModal(false);
  };

  const handleCardMove = async (
    cardId: string,
    fromStatus: RequestStatus,
    toStatus: RequestStatus
  ) => {
    if (!user || !canChangeStatus) return;
    await updateStatusMutation.mutateAsync({
      id: cardId,
      status: toStatus,
      userId: user.id,
    });
  };

  const isDropAllowed = (
    _cardId: string,
    fromStatus: RequestStatus,
    toStatus: RequestStatus
  ): boolean => {
    return VALID_TRANSITIONS[fromStatus]?.includes(toStatus) || false;
  };

  const handleFiltersChange = (newFilters: RequestFiltersData) => {
    setFilters(newFilters);
    setPage(1);
  };

  // Open create modal if equipment_id is in URL
  React.useEffect(() => {
    if (prefilledEquipmentId && !showCreateModal) {
      setShowCreateModal(true);
    }
  }, [prefilledEquipmentId]);

  const isLoading = viewMode === 'list' ? isLoadingList : isLoadingKanban;
  const hasData = viewMode === 'list' ? requestList.length > 0 : kanbanColumns.some(col => col.cards.length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Maintenance Requests</h1>
          <p className="text-muted-foreground">
            Track and manage all maintenance work orders
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Button>
        )}
      </div>

      {/* Filters and View Toggle */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex-1">
              <RequestFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
                teams={teamOptions}
              />
            </div>

            {/* View Toggle */}
            <div className="flex rounded-lg border p-1">
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                title="List View"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('kanban')}
                title="Kanban View"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => router.push('/calendar')}
                title="Calendar View"
              >
                <Calendar className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {isLoading ? (
        <Card>
          <CardContent className="py-12">
            <LoadingState message="Loading requests..." />
          </CardContent>
        </Card>
      ) : !hasData ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={ClipboardList}
              title="No maintenance requests"
              description="Create your first maintenance request to get started."
              action={
                canCreate
                  ? { label: 'New Request', onClick: () => setShowCreateModal(true) }
                  : undefined
              }
            />
          </CardContent>
        </Card>
      ) : viewMode === 'list' ? (
        <Card>
          <CardContent className="p-0">
            <RequestList
              requests={requestList}
              onView={handleView}
              loading={isLoadingList}
              pagination={{
                page,
                pageSize,
                total: requestsData?.count || 0,
                onPageChange: setPage,
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="min-h-[500px]">
          <KanbanBoard
            columns={kanbanColumns}
            onCardMove={handleCardMove}
            onCardClick={handleView}
            isDropAllowed={isDropAllowed}
          />
        </div>
      )}

      {/* Create Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          // Remove equipment_id from URL if present
          if (prefilledEquipmentId) {
            router.replace('/maintenance');
          }
        }}
        title="New Maintenance Request"
        description="Create a new maintenance request for equipment."
        size="lg"
      >
        <RequestForm
          initialData={prefilledEquipmentId ? { equipmentId: prefilledEquipmentId } : undefined}
          equipmentOptions={equipmentOptions}
          teamOptions={teamOptions}
          onSubmit={handleCreateSubmit}
          onCancel={() => {
            setShowCreateModal(false);
            if (prefilledEquipmentId) {
              router.replace('/maintenance');
            }
          }}
          isLoading={createMutation.isPending}
        />
      </Modal>
    </div>
  );
}
