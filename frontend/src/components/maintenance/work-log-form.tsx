'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const workLogSchema = z.object({
  notes: z.string().min(1, 'Notes are required'),
  laborHours: z.number().min(0, 'Labor hours must be positive').optional(),
  partsUsed: z.string().optional(),
  resolution: z.string().optional(),
});

export type WorkLogFormData = z.infer<typeof workLogSchema>;

interface WorkLogFormProps {
  onSubmit: (data: WorkLogFormData) => Promise<void>;
  onCancel: () => void;
  isCompleting?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function WorkLogForm({
  onSubmit,
  onCancel,
  isCompleting = false,
  isLoading = false,
  className,
}: WorkLogFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WorkLogFormData>({
    resolver: zodResolver(workLogSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn('space-y-4', className)}>
      <div className="space-y-2">
        <Label htmlFor="notes">
          Work Notes <span className="text-destructive">*</span>
        </Label>
        <textarea
          id="notes"
          placeholder="Describe the work performed..."
          className={cn(
            'flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            errors.notes && 'border-destructive'
          )}
          {...register('notes')}
        />
        {errors.notes && (
          <p className="text-sm text-destructive">{errors.notes.message}</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="laborHours">Labor Hours</Label>
          <Input
            id="laborHours"
            type="number"
            step="0.5"
            min="0"
            placeholder="0"
            {...register('laborHours', { valueAsNumber: true })}
          />
          {errors.laborHours && (
            <p className="text-sm text-destructive">{errors.laborHours.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="partsUsed">Parts Used</Label>
          <Input
            id="partsUsed"
            placeholder="List any parts used..."
            {...register('partsUsed')}
          />
        </div>
      </div>

      {isCompleting && (
        <div className="space-y-2">
          <Label htmlFor="resolution">
            Resolution <span className="text-destructive">*</span>
          </Label>
          <textarea
            id="resolution"
            placeholder="Describe how the issue was resolved..."
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            {...register('resolution')}
          />
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          {isCompleting ? 'Complete & Submit' : 'Add Work Log'}
        </Button>
      </div>
    </form>
  );
}
