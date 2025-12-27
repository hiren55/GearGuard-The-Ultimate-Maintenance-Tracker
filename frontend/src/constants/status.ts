// Request statuses
export const REQUEST_STATUS = {
  NEW: 'new',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  ON_HOLD: 'on_hold',
  COMPLETED: 'completed',
  VERIFIED: 'verified',
  CANCELLED: 'cancelled',
} as const;

export type RequestStatus = typeof REQUEST_STATUS[keyof typeof REQUEST_STATUS];

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  [REQUEST_STATUS.NEW]: 'New',
  [REQUEST_STATUS.ASSIGNED]: 'Assigned',
  [REQUEST_STATUS.IN_PROGRESS]: 'In Progress',
  [REQUEST_STATUS.ON_HOLD]: 'On Hold',
  [REQUEST_STATUS.COMPLETED]: 'Completed',
  [REQUEST_STATUS.VERIFIED]: 'Verified',
  [REQUEST_STATUS.CANCELLED]: 'Cancelled',
};

export const REQUEST_STATUS_ORDER: RequestStatus[] = [
  REQUEST_STATUS.NEW,
  REQUEST_STATUS.ASSIGNED,
  REQUEST_STATUS.IN_PROGRESS,
  REQUEST_STATUS.ON_HOLD,
  REQUEST_STATUS.COMPLETED,
  REQUEST_STATUS.VERIFIED,
  REQUEST_STATUS.CANCELLED,
];

// Equipment statuses
export const EQUIPMENT_STATUS = {
  ACTIVE: 'active',
  UNDER_MAINTENANCE: 'under_maintenance',
  SCRAPPED: 'scrapped',
} as const;

export type EquipmentStatus = typeof EQUIPMENT_STATUS[keyof typeof EQUIPMENT_STATUS];

export const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, string> = {
  [EQUIPMENT_STATUS.ACTIVE]: 'Active',
  [EQUIPMENT_STATUS.UNDER_MAINTENANCE]: 'Under Maintenance',
  [EQUIPMENT_STATUS.SCRAPPED]: 'Scrapped',
};

// Request types
export const REQUEST_TYPE = {
  CORRECTIVE: 'corrective',
  PREVENTIVE: 'preventive',
} as const;

export type RequestType = typeof REQUEST_TYPE[keyof typeof REQUEST_TYPE];

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  [REQUEST_TYPE.CORRECTIVE]: 'Corrective',
  [REQUEST_TYPE.PREVENTIVE]: 'Preventive',
};

// Valid status transitions
export const VALID_STATUS_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  [REQUEST_STATUS.NEW]: [REQUEST_STATUS.ASSIGNED, REQUEST_STATUS.CANCELLED],
  [REQUEST_STATUS.ASSIGNED]: [REQUEST_STATUS.IN_PROGRESS, REQUEST_STATUS.CANCELLED],
  [REQUEST_STATUS.IN_PROGRESS]: [
    REQUEST_STATUS.COMPLETED,
    REQUEST_STATUS.ON_HOLD,
    REQUEST_STATUS.CANCELLED,
  ],
  [REQUEST_STATUS.ON_HOLD]: [REQUEST_STATUS.IN_PROGRESS, REQUEST_STATUS.CANCELLED],
  [REQUEST_STATUS.COMPLETED]: [REQUEST_STATUS.VERIFIED],
  [REQUEST_STATUS.VERIFIED]: [],
  [REQUEST_STATUS.CANCELLED]: [],
};
