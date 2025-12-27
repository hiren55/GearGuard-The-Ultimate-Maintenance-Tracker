'use client';

import * as React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import {
  useEquipment,
  useEquipmentMaintenanceHistory,
  useUpdateEquipment,
  useScrapEquipment,
} from '@/hooks/queries';
import { EquipmentDetail, EquipmentDetailData } from '@/components/equipment/equipment-detail';
import { EquipmentForm, EquipmentFormData } from '@/components/equipment/equipment-form';
import { LoadingState } from '@/components/common/loading-state';
import { EmptyState } from '@/components/common/empty-state';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { StatusBadge } from '@/components/common/status-badge';
import { DateDisplay } from '@/components/common/date-display';

export default function EquipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasRole } = useAuth();

  const equipmentId = params.id as string;
  const editMode = searchParams.get('edit') === 'true';

  const canEdit = hasRole('manager');
  const canScrap = hasRole('admin');

  // State
  const [showEditModal, setShowEditModal] = React.useState(editMode);
  const [showScrapDialog, setShowScrapDialog] = React.useState(false);
  const [scrapReason, setScrapReason] = React.useState('');

  // Queries
  const { data: equipment, isLoading, error } = useEquipment(equipmentId);
  const { data: maintenanceHistory = [] } = useEquipmentMaintenanceHistory(equipmentId);

  // Mutations
  const updateMutation = useUpdateEquipment();
  const scrapMutation = useScrapEquipment();

  // Transform API data to component format
  const equipmentDetail: EquipmentDetailData | null = React.useMemo(() => {
    if (!equipment) return null;
    return {
      id: equipment.id,
      name: equipment.name,
      serialNumber: equipment.serial_number,
      category: equipment.category || '',
      location: equipment.location || '',
      status: equipment.status,
      description: equipment.description || undefined,
      ownershipType: equipment.department ? 'department' : 'employee',
      ownerName: equipment.owner?.full_name || equipment.department?.name || 'Unassigned',
      defaultTeamName: equipment.default_team?.name,
      purchaseDate: equipment.purchase_date || undefined,
      warrantyExpiry: equipment.warranty_expiry || undefined,
      lastMaintenanceDate: equipment.last_maintenance_date || undefined,
      specifications: equipment.specifications as Record<string, string> | undefined,
      imageUrl: equipment.image_url || undefined,
    };
  }, [equipment]);

  // Handlers
  const handleBack = () => {
    router.push('/equipment');
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleRequestMaintenance = () => {
    router.push(`/maintenance/new?equipment_id=${equipmentId}`);
  };

  const handleEditSubmit = async (data: EquipmentFormData) => {
    await updateMutation.mutateAsync({
      id: equipmentId,
      data: {
        name: data.name,
        serial_number: data.serialNumber,
        category: data.category,
        location: data.location,
        description: data.description,
        owner_id: data.ownerId,
        default_team_id: data.defaultTeamId,
        purchase_date: data.purchaseDate,
        warranty_expiry: data.warrantyExpiry,
      },
    });
    setShowEditModal(false);
    // Remove edit query param
    router.replace(`/equipment/${equipmentId}`);
  };

  const handleScrap = async () => {
    await scrapMutation.mutateAsync({
      id: equipmentId,
      reason: scrapReason,
    });
    setShowScrapDialog(false);
    setScrapReason('');
  };

  if (isLoading) {
    return <LoadingState message="Loading equipment details..." />;
  }

  if (error || !equipmentDetail) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Equipment
        </Button>
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Wrench}
              title="Equipment not found"
              description={error?.message || 'The requested equipment could not be found.'}
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
        Back to Equipment
      </Button>

      {/* Equipment Detail */}
      <EquipmentDetail
        equipment={equipmentDetail}
        onEdit={canEdit ? handleEdit : undefined}
        onRequestMaintenance={handleRequestMaintenance}
      />

      {/* Tabs for History */}
      <Tabs defaultValue="maintenance" className="w-full">
        <TabsList>
          <TabsTrigger value="maintenance">Maintenance History</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="maintenance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent Maintenance Requests</CardTitle>
            </CardHeader>
            <CardContent>
              {maintenanceHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No maintenance history for this equipment.
                </p>
              ) : (
                <div className="space-y-4">
                  {maintenanceHistory.map((request: any) => (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/maintenance/${request.id}`)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{request.title}</span>
                          <StatusBadge status={request.status} size="sm" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {request.request_number} - Requested by {request.requester?.full_name}
                        </p>
                      </div>
                      <DateDisplay date={request.created_at} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Equipment Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {equipmentDetail.status !== 'scrapped' && (
                <>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleRequestMaintenance}
                  >
                    <Wrench className="mr-2 h-4 w-4" />
                    Request Maintenance
                  </Button>

                  {canScrap && (
                    <Button
                      variant="destructive"
                      className="w-full justify-start"
                      onClick={() => setShowScrapDialog(true)}
                    >
                      Scrap Equipment
                    </Button>
                  )}
                </>
              )}

              {equipmentDetail.status === 'scrapped' && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  This equipment has been scrapped and cannot be modified.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      <Modal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          router.replace(`/equipment/${equipmentId}`);
        }}
        title="Edit Equipment"
        description="Update the equipment details."
        size="lg"
      >
        <EquipmentForm
          initialData={{
            name: equipmentDetail.name,
            serialNumber: equipmentDetail.serialNumber,
            category: equipmentDetail.category,
            location: equipmentDetail.location,
            description: equipmentDetail.description,
            ownershipType: equipmentDetail.ownershipType,
            ownerId: equipment?.owner_id || '',
            defaultTeamId: equipment?.default_team_id || undefined,
            purchaseDate: equipmentDetail.purchaseDate,
            warrantyExpiry: equipmentDetail.warrantyExpiry,
          }}
          onSubmit={handleEditSubmit}
          onCancel={() => {
            setShowEditModal(false);
            router.replace(`/equipment/${equipmentId}`);
          }}
          isLoading={updateMutation.isPending}
        />
      </Modal>

      {/* Scrap Confirmation */}
      <ConfirmDialog
        open={showScrapDialog}
        onClose={() => {
          setShowScrapDialog(false);
          setScrapReason('');
        }}
        title="Scrap Equipment"
        description="Are you sure you want to scrap this equipment? This action cannot be undone."
        confirmLabel="Scrap"
        variant="destructive"
        onConfirm={handleScrap}
        isLoading={scrapMutation.isPending}
      />
    </div>
  );
}
