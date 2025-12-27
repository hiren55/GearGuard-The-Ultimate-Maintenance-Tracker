'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import {
  useRequest,
  useRequestLogs,
  useUpdateRequestStatus,
  useAssignRequest,
  useAddWorkLog,
  useCompleteRequest,
  useAvailableTechnicians,
} from '@/hooks/queries';
import { RequestDetail, RequestDetailData } from '@/components/maintenance/request-detail';
import { RequestTimeline, TimelineEntry } from '@/components/maintenance/request-timeline';
import { AssignTechnicianModal } from '@/components/maintenance/assign-technician-modal';
import { WorkLogForm, WorkLogFormData } from '@/components/maintenance/work-log-form';
import { LoadingState } from '@/components/common/loading-state';
import { EmptyState } from '@/components/common/empty-state';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import type { RequestStatus } from '@/types';

export default function MaintenanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, hasRole } = useAuth();

  const requestId = params.id as string;

  const canAssign = hasRole('team_leader') || hasRole('manager');
  const canUpdateStatus = hasRole('technician') || hasRole('team_leader') || hasRole('manager');
  const canAddWorkLog = hasRole('technician') || hasRole('team_leader');
  const canVerify = hasRole('manager') || hasRole('requester');

  // State
  const [showAssignModal, setShowAssignModal] = React.useState(false);
  const [showWorkLogModal, setShowWorkLogModal] = React.useState(false);
  const [showCompleteModal, setShowCompleteModal] = React.useState(false);
  const [pendingStatus, setPendingStatus] = React.useState<RequestStatus | null>(null);
  const [cancelReason, setCancelReason] = React.useState('');

  // Queries
  const { data: request, isLoading, error } = useRequest(requestId);
  const { data: logs = [] } = useRequestLogs(requestId);
  const { data: technicians = [] } = useAvailableTechnicians(request?.assigned_team_id);

  // Mutations
  const updateStatusMutation = useUpdateRequestStatus();
  const assignMutation = useAssignRequest();
  const addWorkLogMutation = useAddWorkLog();
  const completeMutation = useCompleteRequest();

  // Transform API data to component format
  const requestDetail: RequestDetailData | null = React.useMemo(() => {
    if (!request) return null;
    return {
      id: request.id,
      requestNumber: request.request_number,
      title: request.title,
      description: request.description || '',
      equipmentId: request.equipment_id,
      equipmentName: request.equipment?.name || 'Unknown',
      equipmentSerialNumber: request.equipment?.serial_number || '',
      status: request.status,
      priority: request.priority,
      type: request.request_type,
      teamName: request.assigned_team?.name,
      assigneeName: request.assigned_to?.full_name,
      assigneeAvatar: request.assigned_to?.avatar_url,
      requesterName: request.requester?.full_name || 'Unknown',
      dueDate: request.due_date || undefined,
      createdAt: request.created_at,
      completedAt: request.completed_at || undefined,
      workNotes: request.work_notes || undefined,
      resolution: request.resolution_notes || undefined,
      laborHours: request.labor_hours || undefined,
    };
  }, [request]);

  // Transform logs to timeline entries
  const timelineEntries: TimelineEntry[] = React.useMemo(() => {
    return logs.map((log: any) => ({
      id: log.id,
      action: getActionLabel(log.action, log.field_changed, log.new_value),
      description: log.notes,
      userName: log.user?.full_name || 'System',
      userAvatar: log.user?.avatar_url,
      timestamp: log.created_at,
      type: getLogType(log.action),
    }));
  }, [logs]);

  // Transform technicians for modal
  const technicianOptions = React.useMemo(() => {
    return technicians.map((tech) => ({
      id: tech.id,
      name: tech.full_name,
      avatar: tech.avatar_url,
    }));
  }, [technicians]);

  // Handlers
  const handleBack = () => {
    router.push('/maintenance');
  };

  const handleAssign = () => {
    setShowAssignModal(true);
  };

  const handleAssignSubmit = async (technicianId: string) => {
    if (!user) return;
    await assignMutation.mutateAsync({
      id: requestId,
      assignedToId: technicianId,
      assignedById: user.id,
      teamId: request?.assigned_team_id,
    });
    setShowAssignModal(false);
  };

  const handleUpdateStatus = (status: RequestStatus) => {
    if (status === 'completed') {
      setShowCompleteModal(true);
    } else if (status === 'cancelled') {
      setPendingStatus('cancelled');
    } else {
      performStatusUpdate(status);
    }
  };

  const performStatusUpdate = async (status: RequestStatus, notes?: string) => {
    if (!user) return;
    await updateStatusMutation.mutateAsync({
      id: requestId,
      status,
      userId: user.id,
      notes,
    });
    setPendingStatus(null);
    setCancelReason('');
  };

  const handleAddWorkLog = () => {
    setShowWorkLogModal(true);
  };

  const handleWorkLogSubmit = async (data: WorkLogFormData) => {
    if (!user) return;
    await addWorkLogMutation.mutateAsync({
      requestId,
      userId: user.id,
      notes: data.notes,
      laborHours: data.laborHours,
      partsUsed: data.partsUsed,
    });
    setShowWorkLogModal(false);
  };

  const handleCompleteSubmit = async (data: WorkLogFormData) => {
    if (!user) return;
    await completeMutation.mutateAsync({
      id: requestId,
      userId: user.id,
      resolution: data.resolution || data.notes,
      laborHours: data.laborHours,
      partsUsed: data.partsUsed,
    });
    setShowCompleteModal(false);
  };

  const handleViewEquipment = () => {
    if (request?.equipment_id) {
      router.push(`/equipment/${request.equipment_id}`);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading request details..." />;
  }

  if (error || !requestDetail) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Maintenance
        </Button>
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={ClipboardList}
              title="Request not found"
              description={error?.message || 'The requested maintenance request could not be found.'}
              action={{ label: 'Go Back', onClick: handleBack }}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={handleBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Maintenance
      </Button>

      {/* Request Detail */}
      <RequestDetail
        request={requestDetail}
        onAssign={handleAssign}
        onUpdateStatus={handleUpdateStatus}
        onAddWorkLog={handleAddWorkLog}
        canAssign={canAssign}
        canUpdateStatus={canUpdateStatus || (canVerify && requestDetail.status === 'completed')}
        canAddWorkLog={canAddWorkLog}
      />

      {/* Tabs for Timeline and Equipment */}
      <Tabs defaultValue="timeline" className="w-full">
        <TabsList>
          <TabsTrigger value="timeline">Activity Timeline</TabsTrigger>
          <TabsTrigger value="equipment">Equipment Details</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Activity History</CardTitle>
            </CardHeader>
            <CardContent>
              <RequestTimeline entries={timelineEntries} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipment" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Equipment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium">{requestDetail.equipmentName}</p>
                <p className="text-sm text-muted-foreground">
                  Serial: {requestDetail.equipmentSerialNumber}
                </p>
              </div>
              <Button variant="outline" onClick={handleViewEquipment}>
                View Equipment Details
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assign Technician Modal */}
      <AssignTechnicianModal
        open={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onAssign={handleAssignSubmit}
        technicians={technicianOptions}
        currentAssigneeId={request?.assigned_to_id}
        isLoading={assignMutation.isPending}
      />

      {/* Work Log Modal */}
      <Modal
        open={showWorkLogModal}
        onClose={() => setShowWorkLogModal(false)}
        title="Add Work Log"
        description="Record the work performed on this request."
        size="lg"
      >
        <WorkLogForm
          onSubmit={handleWorkLogSubmit}
          onCancel={() => setShowWorkLogModal(false)}
          isLoading={addWorkLogMutation.isPending}
        />
      </Modal>

      {/* Complete Request Modal */}
      <Modal
        open={showCompleteModal}
        onClose={() => setShowCompleteModal(false)}
        title="Complete Request"
        description="Record the resolution and final details for this request."
        size="lg"
      >
        <WorkLogForm
          onSubmit={handleCompleteSubmit}
          onCancel={() => setShowCompleteModal(false)}
          isCompleting
          isLoading={completeMutation.isPending}
        />
      </Modal>

      {/* Cancel Confirmation */}
      <ConfirmDialog
        open={pendingStatus === 'cancelled'}
        onClose={() => {
          setPendingStatus(null);
          setCancelReason('');
        }}
        title="Cancel Request"
        description="Are you sure you want to cancel this request? This action cannot be undone."
        confirmLabel="Cancel Request"
        variant="destructive"
        onConfirm={() => performStatusUpdate('cancelled', cancelReason)}
        isLoading={updateStatusMutation.isPending}
      />
    </div>
  );
}

// Helper functions
function getActionLabel(action: string, field?: string, newValue?: string): string {
  switch (action) {
    case 'created':
      return 'Request created';
    case 'status_changed':
      return `Status changed to ${newValue?.replace('_', ' ')}`;
    case 'assigned':
      return 'Technician assigned';
    case 'note_added':
      return 'Work note added';
    case 'completed':
      return 'Request completed';
    default:
      return action.replace('_', ' ');
  }
}

function getLogType(action: string): TimelineEntry['type'] {
  switch (action) {
    case 'created':
      return 'created';
    case 'status_changed':
      return 'status_change';
    case 'assigned':
      return 'assignment';
    default:
      return 'note';
  }
}
