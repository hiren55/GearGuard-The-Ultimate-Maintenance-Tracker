'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Wrench, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { useAuth } from '@/hooks/use-auth';
import {
  useEquipmentList,
  useEquipmentCategories,
  useEquipmentLocations,
  useCreateEquipment,
  useDeleteEquipment,
} from '@/hooks/queries';
import { EquipmentFilters, EquipmentFiltersData } from '@/components/equipment/equipment-filters';
import { EquipmentList, EquipmentListItem } from '@/components/equipment/equipment-list';
import { EquipmentForm, EquipmentFormData } from '@/components/equipment/equipment-form';
import { EmptyState } from '@/components/common/empty-state';
import { LoadingState } from '@/components/common/loading-state';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import type { EquipmentFilters as ApiFilters } from '@/types';

export default function EquipmentPage() {
  const router = useRouter();
  const { user, hasRole } = useAuth();
  const canCreate = hasRole('manager');
  const canEdit = hasRole('manager');
  const canDelete = hasRole('admin');

  // State
  const [filters, setFilters] = React.useState<EquipmentFiltersData>({
    search: '',
    status: '',
    category: '',
    location: '',
  });
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(10);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [deleteEquipment, setDeleteEquipment] = React.useState<EquipmentListItem | null>(null);

  // Convert component filters to API filters
  const apiFilters: ApiFilters = {
    search: filters.search || undefined,
    status: (filters.status as 'active' | 'under_maintenance' | 'scrapped') || undefined,
    category: filters.category || undefined,
    location: filters.location || undefined,
  };

  // Queries
  const {
    data: equipmentData,
    isLoading,
    error,
  } = useEquipmentList(apiFilters, { page, pageSize });

  const { data: categories = [] } = useEquipmentCategories();
  const { data: locations = [] } = useEquipmentLocations();

  // Mutations
  const createMutation = useCreateEquipment();
  const deleteMutation = useDeleteEquipment();

  // Transform API data to component format
  const equipmentList: EquipmentListItem[] = React.useMemo(() => {
    if (!equipmentData?.data) return [];
    return equipmentData.data.map((item) => ({
      id: item.id,
      name: item.name,
      serialNumber: item.serial_number,
      category: item.category || '',
      location: item.location || '',
      status: item.status,
      ownerName: item.owner?.full_name || 'Unassigned',
      lastMaintenanceDate: item.last_maintenance_date || undefined,
    }));
  }, [equipmentData]);

  // Handlers
  const handleView = (equipment: EquipmentListItem) => {
    router.push(`/equipment/${equipment.id}`);
  };

  const handleEdit = (equipment: EquipmentListItem) => {
    router.push(`/equipment/${equipment.id}?edit=true`);
  };

  const handleDelete = (equipment: EquipmentListItem) => {
    setDeleteEquipment(equipment);
  };

  const handleRequestMaintenance = (equipment: EquipmentListItem) => {
    router.push(`/maintenance/new?equipment_id=${equipment.id}`);
  };

  const handleCreateSubmit = async (data: EquipmentFormData) => {
    if (!user) return;
    await createMutation.mutateAsync({
      data: {
        name: data.name,
        serial_number: data.serialNumber,
        category: data.category,
        location: data.location,
        description: data.description || undefined,
        ownership_type: data.ownershipType,
        // Set department_id or owner_id based on ownership type
        department_id: data.ownershipType === 'department' && data.ownerId ? data.ownerId : undefined,
        owner_id: data.ownershipType === 'employee' && data.ownerId ? data.ownerId : undefined,
        default_team_id: data.defaultTeamId || undefined,
        purchase_date: data.purchaseDate || undefined,
        warranty_expiry: data.warrantyExpiry || undefined,
      },
      userId: user.id,
    });
    setShowCreateModal(false);
  };

  const handleConfirmDelete = async () => {
    if (!deleteEquipment) return;
    await deleteMutation.mutateAsync(deleteEquipment.id);
    setDeleteEquipment(null);
  };

  const handleFiltersChange = (newFilters: EquipmentFiltersData) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  };

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [filters.search, filters.status, filters.category, filters.location]);

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Equipment</h1>
          <p className="text-muted-foreground">
            Manage and track all your equipment and assets
          </p>
        </div>
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Wrench}
              title="Error loading equipment"
              description={error.message}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Equipment</h1>
          <p className="text-muted-foreground">
            Manage and track all your equipment and assets
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Equipment
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <EquipmentFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            categories={categories}
            locations={locations}
          />
        </CardContent>
      </Card>

      {/* Equipment List */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <LoadingState message="Loading equipment..." />
          ) : equipmentList.length === 0 ? (
            <EmptyState
              icon={Wrench}
              title="No equipment yet"
              description="Start by adding your first piece of equipment to track."
              action={
                canCreate
                  ? { label: 'Add Equipment', onClick: () => setShowCreateModal(true) }
                  : undefined
              }
            />
          ) : (
            <EquipmentList
              equipment={equipmentList}
              onView={handleView}
              onEdit={canEdit ? handleEdit : undefined}
              onDelete={canDelete ? handleDelete : undefined}
              onRequestMaintenance={handleRequestMaintenance}
              loading={isLoading}
              pagination={{
                page,
                pageSize,
                total: equipmentData?.count || 0,
                onPageChange: setPage,
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Equipment"
        description="Enter the details for the new equipment."
        size="lg"
      >
        <EquipmentForm
          onSubmit={handleCreateSubmit}
          onCancel={() => setShowCreateModal(false)}
          isLoading={createMutation.isPending}
        />
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteEquipment}
        onClose={() => setDeleteEquipment(null)}
        title="Delete Equipment"
        description={`Are you sure you want to delete "${deleteEquipment?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
