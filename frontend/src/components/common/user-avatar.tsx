'use client';

import * as React from 'react';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  name?: string;
  imageUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
};

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export function UserAvatar({
  name,
  imageUrl,
  size = 'md',
  showName = false,
  className,
}: UserAvatarProps) {
  const getInitials = (name: string) => {
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const avatar = (
    <div
      className={cn(
        'rounded-full flex items-center justify-center bg-muted text-muted-foreground font-medium',
        sizeClasses[size],
        className
      )}
      title={name}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name || 'User avatar'}
          className="w-full h-full rounded-full object-cover"
        />
      ) : name ? (
        getInitials(name)
      ) : (
        <User className={iconSizes[size]} />
      )}
    </div>
  );

  if (showName && name) {
    return (
      <div className="flex items-center gap-2">
        {avatar}
        <span className="text-sm">{name}</span>
      </div>
    );
  }

  return avatar;
}
