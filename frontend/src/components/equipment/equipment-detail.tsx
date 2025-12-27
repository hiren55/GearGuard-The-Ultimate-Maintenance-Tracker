'use client';

import * as React from 'react';
import { Wrench, MapPin, Calendar, User, Building, Tag, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge, EquipmentStatus } from '@/components/common/status-badge';
import { DateDisplay } from '@/components/common/date-display';
import { cn } from '@/lib/utils';

export interface EquipmentDetailData {
  id: string;
  name: string;
  serialNumber: string;
  category: string;
  location: string;
  status: EquipmentStatus;
  description?: string;
  ownershipType: 'department' | 'employee';
  ownerName: string;
  defaultTeamName?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  lastMaintenanceDate?: string;
  specifications?: Record<string, string>;
  imageUrl?: string;
}

interface EquipmentDetailProps {
  equipment: EquipmentDetailData;
  onEdit?: () => void;
  onRequestMaintenance?: () => void;
  className?: string;
}

export function EquipmentDetail({
  equipment,
  onEdit,
  onRequestMaintenance,
  className,
}: EquipmentDetailProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
            {equipment.imageUrl ? (
              <img
                src={equipment.imageUrl}
                alt={equipment.name}
                className="h-16 w-16 rounded-lg object-cover"
              />
            ) : (
              <Wrench className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{equipment.name}</h1>
              <StatusBadge status={equipment.status} />
            </div>
            <p className="text-muted-foreground">{equipment.serialNumber}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {onEdit && equipment.status !== 'scrapped' && (
            <Button variant="outline" onClick={onEdit}>
              Edit
            </Button>
          )}
          {onRequestMaintenance && equipment.status !== 'scrapped' && (
            <Button onClick={onRequestMaintenance}>
              <Wrench className="mr-2 h-4 w-4" />
              Request Maintenance
            </Button>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">General Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Category:</span>
              <span className="text-sm">{equipment.category}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Location:</span>
              <span className="text-sm">{equipment.location}</span>
            </div>
            {equipment.description && (
              <div>
                <span className="text-sm text-muted-foreground">Description:</span>
                <p className="text-sm mt-1">{equipment.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ownership</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              {equipment.ownershipType === 'department' ? (
                <Building className="h-4 w-4 text-muted-foreground" />
              ) : (
                <User className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-sm text-muted-foreground">
                {equipment.ownershipType === 'department' ? 'Department' : 'Employee'}:
              </span>
              <span className="text-sm">{equipment.ownerName}</span>
            </div>
            {equipment.defaultTeamName && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Default Team:</span>
                <span className="text-sm">{equipment.defaultTeamName}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {equipment.purchaseDate && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Purchase Date:</span>
                <DateDisplay date={equipment.purchaseDate} />
              </div>
            )}
            {equipment.warrantyExpiry && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Warranty Expiry:</span>
                <DateDisplay date={equipment.warrantyExpiry} isDueDate />
              </div>
            )}
            {equipment.lastMaintenanceDate && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Last Maintenance:</span>
                <DateDisplay date={equipment.lastMaintenanceDate} />
              </div>
            )}
          </CardContent>
        </Card>

        {equipment.specifications && Object.keys(equipment.specifications).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Specifications</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2">
                {Object.entries(equipment.specifications).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <dt className="text-sm text-muted-foreground">{key}:</dt>
                    <dd className="text-sm">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
