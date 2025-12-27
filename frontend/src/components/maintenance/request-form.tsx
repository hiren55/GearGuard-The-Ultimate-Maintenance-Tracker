'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const requestSchema = z.object({
  equipmentId: z.string().min(1, 'Equipment is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['corrective', 'preventive']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  dueDate: z.string().optional(),
  teamId: z.string().optional(),
});

export type RequestFormData = z.infer<typeof requestSchema>;

interface RequestFormProps {
  initialData?: Partial<RequestFormData>;
  equipmentOptions?: { id: string; name: string }[];
  teamOptions?: { id: string; name: string }[];
  onSubmit: (data: RequestFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  className?: string;
}

export function RequestForm({
  initialData,
  equipmentOptions = [],
  teamOptions = [],
  onSubmit,
  onCancel,
  isLoading = false,
  className,
}: RequestFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      type: 'corrective',
      priority: 'medium',
      ...initialData,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn('space-y-4', className)}>
      <div className="space-y-2">
        <Label htmlFor="equipmentId">
          Equipment <span className="text-destructive">*</span>
        </Label>
        <select
          id="equipmentId"
          className={cn(
            'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            errors.equipmentId && 'border-destructive'
          )}
          {...register('equipmentId')}
        >
          <option value="">Select equipment</option>
          {equipmentOptions.map((eq) => (
            <option key={eq.id} value={eq.id}>
              {eq.name}
            </option>
          ))}
        </select>
        {errors.equipmentId && (
          <p className="text-sm text-destructive">{errors.equipmentId.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          placeholder="Brief description of the issue"
          error={!!errors.title}
          {...register('title')}
        />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">
          Description <span className="text-destructive">*</span>
        </Label>
        <textarea
          id="description"
          placeholder="Detailed description of the issue or work needed"
          className={cn(
            'flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            errors.description && 'border-destructive'
          )}
          {...register('description')}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Type</Label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="corrective"
                {...register('type')}
                className="h-4 w-4"
              />
              <span>Corrective</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="preventive"
                {...register('type')}
                className="h-4 w-4"
              />
              <span>Preventive</span>
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <select
            id="priority"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            {...register('priority')}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date</Label>
          <Input id="dueDate" type="date" {...register('dueDate')} />
        </div>

        {teamOptions.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="teamId">Assign Team</Label>
            <select
              id="teamId"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register('teamId')}
            >
              <option value="">Auto-assign (default team)</option>
              {teamOptions.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {initialData ? 'Update Request' : 'Create Request'}
        </Button>
      </div>
    </form>
  );
}
