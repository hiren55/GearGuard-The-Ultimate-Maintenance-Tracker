'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import {
  useCreateRequest,
  useTeamList,
  useEquipmentList,
} from '@/hooks/queries';
import { RequestForm, RequestFormData } from '@/components/maintenance/request-form';
import { LoadingState } from '@/components/common/loading-state';

export default function NewMaintenanceRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const prefilledEquipmentId = searchParams.get('equipment_id');
  const prefilledDueDate = searchParams.get('due_date');

  // Queries
  const { data: teams = [] } = useTeamList();
  const { data: equipmentData, isLoading } = useEquipmentList({}, { page: 1, pageSize: 100 });

  // Mutation
  const createMutation = useCreateRequest();

  // Equipment options for form
  const equipmentOptions = React.useMemo(() => {
    if (!equipmentData?.data) return [];
    return equipmentData.data
      .filter((eq) => eq.status !== 'scrapped')
      .map((eq) => ({ id: eq.id, name: eq.name }));
  }, [equipmentData]);

  // Team options for form
  const teamOptions = React.useMemo(() => {
    return teams.map((team) => ({ id: team.id, name: team.name }));
  }, [teams]);

  // Handlers
  const handleBack = () => {
    router.push('/maintenance');
  };

  const handleSubmit = async (data: RequestFormData) => {
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
    router.push('/maintenance');
  };

  if (isLoading) {
    return <LoadingState message="Loading form data..." />;
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={handleBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Maintenance
      </Button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">New Maintenance Request</h1>
        <p className="text-muted-foreground">
          Create a new maintenance request for equipment
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Request Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RequestForm
            initialData={{
              equipmentId: prefilledEquipmentId || undefined,
              dueDate: prefilledDueDate || undefined,
            }}
            equipmentOptions={equipmentOptions}
            teamOptions={teamOptions}
            onSubmit={handleSubmit}
            onCancel={handleBack}
            isLoading={createMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
