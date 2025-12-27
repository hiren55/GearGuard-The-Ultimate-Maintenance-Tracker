export const ROUTES = {
  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',

  // Dashboard
  DASHBOARD: '/dashboard',

  // Equipment
  EQUIPMENT: '/equipment',
  EQUIPMENT_DETAIL: (id: string) => `/equipment/${id}`,
  EQUIPMENT_CREATE: '/equipment/new',
  EQUIPMENT_EDIT: (id: string) => `/equipment/${id}/edit`,

  // Maintenance
  MAINTENANCE: '/maintenance',
  MAINTENANCE_DETAIL: (id: string) => `/maintenance/${id}`,
  MAINTENANCE_CREATE: '/maintenance/new',

  // Teams
  TEAMS: '/teams',
  TEAM_DETAIL: (id: string) => `/teams/${id}`,

  // Calendar
  CALENDAR: '/calendar',

  // Reports
  REPORTS: '/reports',

  // Settings
  SETTINGS: '/settings',
} as const;

export const PUBLIC_ROUTES = [
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
];

export const PROTECTED_ROUTES = [
  ROUTES.DASHBOARD,
  ROUTES.EQUIPMENT,
  ROUTES.MAINTENANCE,
  ROUTES.TEAMS,
  ROUTES.CALENDAR,
  ROUTES.REPORTS,
  ROUTES.SETTINGS,
];
