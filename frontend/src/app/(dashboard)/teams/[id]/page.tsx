'use client';

import * as React from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Users,
  User,
  Plus,
  Trash2,
  Briefcase,
  ClipboardList,
  Edit,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import {
  useTeam,
  useUpdateTeam,
  useTeamWorkload,
  useAddTeamMember,
  useRemoveTeamMember,
  useUserList,
} from '@/hooks/queries';
import { UserAvatar } from '@/components/common/user-avatar';
import { LoadingState } from '@/components/common/loading-state';
import { EmptyState } from '@/components/common/empty-state';
import { ConfirmDialog } from '@/components/common/confirm-dialog';

export default function TeamDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasRole } = useAuth();

  const teamId = params.id as string;
  const editMode = searchParams.get('edit') === 'true';

  const canEdit = hasRole('admin') || hasRole('manager');
  const canManageMembers = hasRole('admin') || hasRole('manager') || hasRole('team_leader');

  // State
  const [showEditModal, setShowEditModal] = React.useState(editMode);
  const [showAddMemberModal, setShowAddMemberModal] = React.useState(false);
  const [removeMember, setRemoveMember] = React.useState<{ id: string; name: string } | null>(null);
  const [selectedUserId, setSelectedUserId] = React.useState('');
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    specialization: '',
    leader_id: '',
  });

  // Queries
  const { data: team, isLoading, error } = useTeam(teamId);
  const { data: workload } = useTeamWorkload(teamId);
  const { data: allUsers = [] } = useUserList();

  // Mutations
  const updateMutation = useUpdateTeam();
  const addMemberMutation = useAddTeamMember();
  const removeMemberMutation = useRemoveTeamMember();

  // Initialize form when team loads
  React.useEffect(() => {
    if (team) {
      setFormData({
        name: team.name,
        description: team.description || '',
        specialization: team.specialization || '',
        leader_id: team.leader_id || '',
      });
    }
  }, [team]);

  // Get users who can be added as members (technicians not already in team)
  const availableUsers = React.useMemo(() => {
    if (!team || !allUsers) return [];
    const memberIds = team.members?.map((m) => m.user_id) || [];
    return allUsers.filter(
      (u) =>
        (u.role === 'technician' || u.role === 'team_leader') &&
        !memberIds.includes(u.id)
    );
  }, [team, allUsers]);

  // Get users who can be leaders
  const leaderOptions = React.useMemo(() => {
    return allUsers.filter((u) => u.role === 'team_leader' || u.role === 'manager');
  }, [allUsers]);

  // Handlers
  const handleBack = () => {
    router.push('/teams');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateMutation.mutateAsync({
      id: teamId,
      data: {
        name: formData.name,
        description: formData.description || undefined,
        specialization: formData.specialization || undefined,
        leader_id: formData.leader_id || undefined,
      },
    });
    setShowEditModal(false);
    router.replace(`/teams/${teamId}`);
  };

  const handleAddMember = async () => {
    if (!selectedUserId) return;
    await addMemberMutation.mutateAsync({
      teamId,
      userId: selectedUserId,
    });
    setShowAddMemberModal(false);
    setSelectedUserId('');
  };

  const handleRemoveMember = async () => {
    if (!removeMember) return;
    await removeMemberMutation.mutateAsync({
      teamId,
      userId: removeMember.id,
    });
    setRemoveMember(null);
  };

  if (isLoading) {
    return <LoadingState message="Loading team details..." />;
  }

  if (error || !team) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Teams
        </Button>
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Users}
              title="Team not found"
              description={error?.message || 'The requested team could not be found.'}
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
        Back to Teams
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{team.name}</h1>
            {team.specialization && (
              <p className="text-muted-foreground flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                {team.specialization}
              </p>
            )}
          </div>
        </div>
        {canEdit && (
          <Button variant="outline" onClick={() => setShowEditModal(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Team
          </Button>
        )}
      </div>

      {/* Stats */}
      {workload && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{workload.new}</div>
              <p className="text-sm text-muted-foreground">New Requests</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{workload.assigned}</div>
              <p className="text-sm text-muted-foreground">Assigned</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{workload.in_progress}</div>
              <p className="text-sm text-muted-foreground">In Progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{workload.completed_this_month}</div>
              <p className="text-sm text-muted-foreground">Completed This Month</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Description */}
      {team.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{team.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Team Leader & Members */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Leader */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Team Leader
            </CardTitle>
          </CardHeader>
          <CardContent>
            {team.leader ? (
              <div className="flex items-center gap-3">
                <UserAvatar
                  name={team.leader.full_name}
                  imageUrl={team.leader.avatar_url}
                  size="lg"
                />
                <div>
                  <p className="font-medium">{team.leader.full_name}</p>
                  {team.leader.email && (
                    <p className="text-sm text-muted-foreground">{team.leader.email}</p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No leader assigned</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() =>
                router.push(`/maintenance?team_id=${teamId}`)
              }
            >
              <ClipboardList className="mr-2 h-4 w-4" />
              View Team Requests
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Team Members */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Members ({team.members?.length || 0})
          </CardTitle>
          {canManageMembers && (
            <Button size="sm" onClick={() => setShowAddMemberModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Member
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {!team.members || team.members.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No team members yet
            </p>
          ) : (
            <div className="space-y-3">
              {team.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      name={member.user?.full_name || 'Unknown'}
                      imageUrl={member.user?.avatar_url}
                      size="md"
                    />
                    <div>
                      <p className="font-medium">
                        {member.user?.full_name}
                        {member.is_leader && (
                          <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            Leader
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {member.user?.email}
                      </p>
                    </div>
                  </div>
                  {canManageMembers && !member.is_leader && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() =>
                        setRemoveMember({
                          id: member.user_id,
                          name: member.user?.full_name || 'this member',
                        })
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Modal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          router.replace(`/teams/${teamId}`);
        }}
        title="Edit Team"
        description="Update team details."
        size="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Team Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="specialization">Specialization</Label>
            <Input
              id="specialization"
              value={formData.specialization}
              onChange={(e) =>
                setFormData({ ...formData, specialization: e.target.value })
              }
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
                setShowEditModal(false);
                router.replace(`/teams/${teamId}`);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={updateMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Member Modal */}
      <Modal
        open={showAddMemberModal}
        onClose={() => {
          setShowAddMemberModal(false);
          setSelectedUserId('');
        }}
        title="Add Team Member"
        description="Select a technician to add to this team."
        size="md"
      >
        <div className="space-y-4">
          {availableUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No available technicians to add.
            </p>
          ) : (
            <div className="max-h-[300px] overflow-y-auto space-y-1">
              {availableUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                    selectedUserId === user.id
                      ? 'bg-primary/10 border border-primary'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => setSelectedUserId(user.id)}
                >
                  <UserAvatar name={user.full_name} imageUrl={user.avatar_url} size="md" />
                  <div>
                    <p className="font-medium">{user.full_name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowAddMemberModal(false);
                setSelectedUserId('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={!selectedUserId}
              isLoading={addMemberMutation.isPending}
            >
              Add Member
            </Button>
          </div>
        </div>
      </Modal>

      {/* Remove Member Confirmation */}
      <ConfirmDialog
        open={!!removeMember}
        onClose={() => setRemoveMember(null)}
        title="Remove Team Member"
        description={`Are you sure you want to remove ${removeMember?.name} from this team?`}
        confirmLabel="Remove"
        variant="destructive"
        onConfirm={handleRemoveMember}
        isLoading={removeMemberMutation.isPending}
      />
    </div>
  );
}
