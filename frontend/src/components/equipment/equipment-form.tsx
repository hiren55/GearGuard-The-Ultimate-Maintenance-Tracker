'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useDepartmentList, useUserList } from '@/hooks/queries';

const equipmentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  serialNumber: z.string().min(1, 'Serial number is required'),
  category: z.string().min(1, 'Category is required'),
  location: z.string().min(1, 'Location is required'),
  description: z.string().optional(),
  ownershipType: z.enum(['department', 'employee']),
  ownerId: z.string().min(1, 'Owner is required'),
  defaultTeamId: z.string().optional(),
  purchaseDate: z.string().optional(),
  warrantyExpiry: z.string().optional(),
});

export type EquipmentFormData = z.infer<typeof equipmentSchema>;

interface EquipmentFormProps {
  initialData?: Partial<EquipmentFormData>;
  onSubmit: (data: EquipmentFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  className?: string;
}

export function EquipmentForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  className,
}: EquipmentFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentSchema),
    defaultValues: {
      ownershipType: 'department',
      ...initialData,
    },
  });

  const ownershipType = watch('ownershipType');

  // Fetch departments and users for the dropdown
  const { data: departments = [], isLoading: loadingDepartments } = useDepartmentList();
  const { data: users = [], isLoading: loadingUsers } = useUserList();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn('space-y-4', className)}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">
            Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="Equipment name"
            error={!!errors.name}
            {...register('name')}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="serialNumber">
            Serial Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="serialNumber"
            placeholder="Serial number"
            error={!!errors.serialNumber}
            {...register('serialNumber')}
          />
          {errors.serialNumber && (
            <p className="text-sm text-destructive">{errors.serialNumber.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">
            Category <span className="text-destructive">*</span>
          </Label>
          <Input
            id="category"
            placeholder="Equipment category"
            error={!!errors.category}
            {...register('category')}
          />
          {errors.category && (
            <p className="text-sm text-destructive">{errors.category.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">
            Location <span className="text-destructive">*</span>
          </Label>
          <Input
            id="location"
            placeholder="Equipment location"
            error={!!errors.location}
            {...register('location')}
          />
          {errors.location && (
            <p className="text-sm text-destructive">{errors.location.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          placeholder="Equipment description"
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          {...register('description')}
        />
      </div>

      <div className="space-y-2">
        <Label>Ownership Type</Label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="department"
              {...register('ownershipType')}
              className="h-4 w-4"
            />
            <span>Department</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              value="employee"
              {...register('ownershipType')}
              className="h-4 w-4"
            />
            <span>Employee</span>
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ownerId">
          {ownershipType === 'department' ? 'Department' : 'Employee'}{' '}
          <span className="text-destructive">*</span>
        </Label>
        <select
          id="ownerId"
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            errors.ownerId && "border-destructive"
          )}
          disabled={ownershipType === 'department' ? loadingDepartments : loadingUsers}
          {...register('ownerId')}
        >
          <option value="">
            {ownershipType === 'department'
              ? (loadingDepartments ? 'Loading departments...' : 'Select a department')
              : (loadingUsers ? 'Loading employees...' : 'Select an employee')
            }
          </option>
          {ownershipType === 'department'
            ? departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))
            : users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name || user.email}
                </option>
              ))
          }
        </select>
        {errors.ownerId && (
          <p className="text-sm text-destructive">{errors.ownerId.message}</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="purchaseDate">Purchase Date</Label>
          <Input
            id="purchaseDate"
            type="date"
            {...register('purchaseDate')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="warrantyExpiry">Warranty Expiry</Label>
          <Input
            id="warrantyExpiry"
            type="date"
            {...register('warrantyExpiry')}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {initialData ? 'Update Equipment' : 'Create Equipment'}
        </Button>
      </div>
    </form>
  );
}
