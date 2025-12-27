export const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type Priority = typeof PRIORITY[keyof typeof PRIORITY];

export const PRIORITY_LABELS: Record<Priority, string> = {
  [PRIORITY.LOW]: 'Low',
  [PRIORITY.MEDIUM]: 'Medium',
  [PRIORITY.HIGH]: 'High',
  [PRIORITY.CRITICAL]: 'Critical',
};

export const PRIORITY_ORDER: Priority[] = [
  PRIORITY.CRITICAL,
  PRIORITY.HIGH,
  PRIORITY.MEDIUM,
  PRIORITY.LOW,
];

export const PRIORITY_COLORS: Record<Priority, { bg: string; text: string; dot: string }> = {
  [PRIORITY.LOW]: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    dot: 'bg-gray-400',
  },
  [PRIORITY.MEDIUM]: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
    dot: 'bg-yellow-400',
  },
  [PRIORITY.HIGH]: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    dot: 'bg-orange-500',
  },
  [PRIORITY.CRITICAL]: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    dot: 'bg-red-500',
  },
};

// SLA response times by priority (in hours)
export const PRIORITY_SLA: Record<Priority, { response: number; resolution: number }> = {
  [PRIORITY.LOW]: { response: 48, resolution: 168 }, // 2 days response, 1 week resolution
  [PRIORITY.MEDIUM]: { response: 24, resolution: 72 }, // 1 day response, 3 days resolution
  [PRIORITY.HIGH]: { response: 4, resolution: 24 }, // 4 hours response, 1 day resolution
  [PRIORITY.CRITICAL]: { response: 1, resolution: 8 }, // 1 hour response, 8 hours resolution
};
