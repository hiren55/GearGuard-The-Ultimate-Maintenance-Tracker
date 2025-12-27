'use client';

import * as React from 'react';
import { Wrench, MapPin, Calendar, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge, EquipmentStatus } from '@/components/common/status-badge';
import { cn } from '@/lib/utils';

export interface EquipmentCardData {
  id: string;
  name: string;
  serialNumber: string;
  category: string;
  location: string;
  status: EquipmentStatus;
  lastMaintenanceDate?: string;
  imageUrl?: string;
}

interface EquipmentCardProps {
  equipment: EquipmentCardData;
  onClick?: () => void;
  onRequestMaintenance?: () => void;
  className?: string;
}

export function EquipmentCard({
  equipment,
  onClick,
  onRequestMaintenance,
  className,
}: EquipmentCardProps) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all hover:shadow-md hover:border-primary/50',
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              {equipment.imageUrl ? (
                <img
                  src={equipment.imageUrl}
                  alt={equipment.name}
                  className="h-10 w-10 rounded-lg object-cover"
                />
              ) : (
                <Wrench className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <CardTitle className="text-base">{equipment.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{equipment.serialNumber}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{equipment.category}</span>
            <StatusBadge status={equipment.status} size="sm" />
          </div>

          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>{equipment.location}</span>
          </div>

          {equipment.lastMaintenanceDate && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>Last maintenance: {equipment.lastMaintenanceDate}</span>
            </div>
          )}

          {onRequestMaintenance && equipment.status !== 'scrapped' && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2"
              onClick={(e) => {
                e.stopPropagation();
                onRequestMaintenance();
              }}
            >
              <Wrench className="mr-2 h-3.5 w-3.5" />
              Request Maintenance
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
