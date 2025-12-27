export const USER_ROLE = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  TEAM_LEADER: 'team_leader',
  TECHNICIAN: 'technician',
  REQUESTER: 'requester',
} as const;

export type UserRole = typeof USER_ROLE[keyof typeof USER_ROLE];

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [USER_ROLE.ADMIN]: 'Administrator',
  [USER_ROLE.MANAGER]: 'Manager',
  [USER_ROLE.TEAM_LEADER]: 'Team Leader',
  [USER_ROLE.TECHNICIAN]: 'Technician',
  [USER_ROLE.REQUESTER]: 'Requester',
};

// Role hierarchy (higher index = more permissions)
export const ROLE_HIERARCHY: UserRole[] = [
  USER_ROLE.REQUESTER,
  USER_ROLE.TECHNICIAN,
  USER_ROLE.TEAM_LEADER,
  USER_ROLE.MANAGER,
  USER_ROLE.ADMIN,
];

// Navigation items by role
export const ROLE_NAVIGATION: Record<UserRole, string[]> = {
  [USER_ROLE.ADMIN]: [
    'Dashboard',
    'Equipment',
    'Maintenance',
    'Teams',
    'Calendar',
    'Reports',
    'Settings',
  ],
  [USER_ROLE.MANAGER]: [
    'Dashboard',
    'Equipment',
    'Maintenance',
    'Teams',
    'Calendar',
    'Reports',
  ],
  [USER_ROLE.TEAM_LEADER]: [
    'Dashboard',
    'Equipment',
    'Maintenance',
    'My Team',
    'Calendar',
  ],
  [USER_ROLE.TECHNICIAN]: [
    'My Tasks',
    'Equipment',
    'Calendar',
    'Profile',
  ],
  [USER_ROLE.REQUESTER]: [
    'My Equipment',
    'My Requests',
    'Create Request',
    'Profile',
  ],
};

// Permission checks
export const PERMISSIONS = {
  // Equipment
  CREATE_EQUIPMENT: [USER_ROLE.ADMIN, USER_ROLE.MANAGER],
  EDIT_EQUIPMENT: [USER_ROLE.ADMIN, USER_ROLE.MANAGER],
  DELETE_EQUIPMENT: [USER_ROLE.ADMIN],
  VIEW_ALL_EQUIPMENT: [USER_ROLE.ADMIN, USER_ROLE.MANAGER, USER_ROLE.TEAM_LEADER],

  // Maintenance Requests
  CREATE_REQUEST: [
    USER_ROLE.ADMIN,
    USER_ROLE.MANAGER,
    USER_ROLE.TEAM_LEADER,
    USER_ROLE.TECHNICIAN,
    USER_ROLE.REQUESTER,
  ],
  ASSIGN_REQUEST: [USER_ROLE.ADMIN, USER_ROLE.MANAGER, USER_ROLE.TEAM_LEADER],
  UPDATE_REQUEST_STATUS: [
    USER_ROLE.ADMIN,
    USER_ROLE.MANAGER,
    USER_ROLE.TEAM_LEADER,
    USER_ROLE.TECHNICIAN,
  ],
  VERIFY_REQUEST: [USER_ROLE.ADMIN, USER_ROLE.MANAGER, USER_ROLE.REQUESTER],
  APPROVE_SCRAP: [USER_ROLE.ADMIN, USER_ROLE.MANAGER],

  // Teams
  MANAGE_TEAMS: [USER_ROLE.ADMIN],
  VIEW_ALL_TEAMS: [USER_ROLE.ADMIN, USER_ROLE.MANAGER],
  MANAGE_TEAM_MEMBERS: [USER_ROLE.ADMIN, USER_ROLE.TEAM_LEADER],

  // Reports
  VIEW_REPORTS: [USER_ROLE.ADMIN, USER_ROLE.MANAGER],
  EXPORT_REPORTS: [USER_ROLE.ADMIN, USER_ROLE.MANAGER],

  // Settings
  SYSTEM_SETTINGS: [USER_ROLE.ADMIN],
} as const;
