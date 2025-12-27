'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Users, Plus, User, Briefcase, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import {
  useTeamList,
  useCreateTeam,
  useDeleteTeam,
  useUserList,
} from '@/hooks/queries';
import { UserAvatar } from '@/components/common/user-avatar';
import { EmptyState } from '@/components/common/empty-state';
import { LoadingState } from '@/components/common/loading-state';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import type { MaintenanceTeam } from '@/types';

export default function TeamsPage() {
  const router = useRouter();
  const { hasRole } = useAuth();
  const canCreate = hasRole('admin') || hasRole('manager');
  const canEdit = hasRole('admin') || hasRole('manager');
  const canDelete = hasRole('admin');

  // State
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [deleteTeam, setDeleteTeam] = React.useState<MaintenanceTeam | null>(null);
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    specialization: '',
    leader_id: '',
  });

  // Queries
  const { data: teams = [], isLoading, error } = useTeamList();
  const { data: users = [] } = useUserList();

  // Mutations
  const createMutation = useCreateTeam();
  const deleteMutation = useDeleteTeam();

  // Get users who can be leaders (team_leader role)
  const leaderOptions = React.useMemo(() => {
    return users.filter((u) => u.role === 'team_leader' || u.role === 'manager');
  }, [users]);

  // Handlers
  const handleViewTeam = (team: MaintenanceTeam) => {
    router.push(`/teams/${team.id}`);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMutation.mutateAsync({
      name: formData.name,
      description: formData.description || undefined,
      specialization: formData.specialization || undefined,
      leader_id: formData.leader_id || undefined,
    });
    setShowCreateModal(false);
    setFormData({ name: '', description: '', specialization: '', leader_id: '' });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTeam) return;
    await deleteMutation.mutateAsync(deleteTeam.id);
    setDeleteTeam(null);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Maintenance Teams</h1>
          <p className="text-muted-foreground">
            Manage your maintenance teams and team members
          </p>
        </div>
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Users}
              title="Error loading teams"
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
          <h1 className="text-2xl font-bold">Maintenance Teams</h1>
          <p className="text-muted-foreground">
            Manage your maintenance teams and team members
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Team
          </Button>
        )}
      </div>

      {/* Teams Grid */}
      {isLoading ? (
        <LoadingState message="Loading teams..." />
      ) : teams.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Users}
              title="No teams yet"
              description="Create your first maintenance team to get started."
              action={
                canCreate
                  ? { label: 'Create Team', onClick: () => setShowCreateModal(true) }
                  : undefined
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card
              key={team.id}
              className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all"
              onClick={() => handleViewTeam(team)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{team.name}</CardTitle>
                      {team.specialization && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {team.specialization}
                        </p>
                      )}
                    </div>
                  </div>
                  {(canEdit || canDelete) && (
                    <div className="flex gap-1">
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/teams/${team.id}?edit=true`);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTeam(team);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {team.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {team.description}
                  </p>
                )}

                {/* Leader */}
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Leader:</span>
                  {team.leader ? (
                    <UserAvatar
                      name={team.leader.full_name}
                      imageUrl={team.leader.avatar_url}
                      size="sm"
                      showName
                    />
                  ) : (
                    <span className="text-sm text-muted-foreground">Not assigned</span>
                  )}
                </div>

                {/* View details link */}
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewTeam(team);
                  }}
                >
                  View team details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        open={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setFormData({ name: '', description: '', specialization: '', leader_id: '' });
        }}
        title="Create Team"
        description="Add a new maintenance team."
        size="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Team Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="e.g., HVAC Team"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialization">Specialization</Label>
            <Input
              id="specialization"
              placeholder="e.g., Heating & Cooling Systems"
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="leader_id">Team Leader</Label>
            <select
              id="leader_id"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={formData.leader_id}
              onChange={(e) => setFormData({ ...formData, leader_id: e.target.value })}
            >
              <option value="">Select team leader</option>
              {leaderOptions.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              placeholder="Brief description of the team's responsibilities"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                setFormData({ name: '', description: '', specialization: '', leader_id: '' });
              }}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Create Team
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTeam}
        onClose={() => setDeleteTeam(null)}
        title="Delete Team"
        description={`Are you sure you want to delete "${deleteTeam?.name}"? Team members will be unassigned. This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleConfirmDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
