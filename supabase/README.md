# GearGuard - Supabase Backend

## Quick Start

### Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- [Docker](https://www.docker.com/) installed (for local development)
- Node.js 18+ (for frontend integration)

### 1. Create Supabase Project

**Option A: Cloud (Recommended for production)**
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and API keys

**Option B: Local Development**
```bash
# Start local Supabase
supabase start

# This will output your local credentials
```

### 2. Link to Your Project (Cloud only)

```bash
cd supabase
supabase link --project-ref YOUR_PROJECT_REF
```

### 3. Run Migrations

```bash
# Push migrations to your database
supabase db push

# Or run migrations explicitly
supabase migration up
```

### 4. Create Admin User

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User" → "Create New User"
3. Enter admin email and password
4. Note the user's UUID
5. Update the user's role:

```sql
UPDATE users SET role = 'admin' WHERE id = 'YOUR_ADMIN_UUID';
```

### 5. Run Seed Data (Optional)

```bash
# Edit seed.sql first to update user IDs
psql -h localhost -p 54322 -U postgres -d postgres -f seed.sql
```

---

## Migration Files

| Order | File | Description |
|-------|------|-------------|
| 1 | `20240101000001_create_enums.sql` | All enum types |
| 2 | `20240101000002_create_core_tables.sql` | Departments and Users |
| 3 | `20240101000003_create_teams_tables.sql` | Teams and memberships |
| 4 | `20240101000004_create_equipment_table.sql` | Equipment/assets |
| 5 | `20240101000005_create_requests_tables.sql` | Requests and logs |
| 6 | `20240101000006_create_supporting_tables.sql` | Schedules, notifications, files |
| 7 | `20240101000007_create_functions_triggers.sql` | Business logic |
| 8 | `20240101000008_create_rls_policies.sql` | Security policies |
| 9 | `20240101000009_create_views.sql` | Database views |

---

## Database Schema Overview

### Core Tables
- **users** - User profiles (linked to auth.users)
- **departments** - Organizational units
- **maintenance_teams** - Technician teams
- **team_members** - Team membership junction
- **equipment** - Assets requiring maintenance
- **maintenance_requests** - Work orders
- **maintenance_logs** - Audit trail

### Supporting Tables
- **preventive_schedules** - Recurring maintenance
- **notifications** - User notifications
- **file_attachments** - File metadata
- **audit_logs** - System audit trail

---

## Key Functions

| Function | Purpose |
|----------|---------|
| `get_my_role()` | Returns current user's role |
| `get_my_teams()` | Returns teams user belongs to |
| `is_team_member(team_id)` | Checks team membership |
| `is_team_leader(team_id)` | Checks if user leads team |
| `scrap_equipment(id, reason)` | Full scrap workflow |
| `get_dashboard_stats(team_id)` | Dashboard metrics |
| `create_notification(...)` | Create notification |

---

## Views

| View | Purpose |
|------|---------|
| `equipment_with_owner` | Equipment with resolved names |
| `requests_with_details` | Full request information |
| `team_members_full` | Members with user details |
| `request_timeline` | Audit logs for display |
| `open_requests` | Non-closed requests |
| `overdue_requests` | Past due requests |
| `team_workload` | Request counts by team |
| `technician_workload` | Request counts by technician |
| `upcoming_preventive` | Scheduled maintenance |

---

## Security (RLS)

Row Level Security is enabled on all tables. Key rules:

- **Users** can only read/update their own profile
- **Admins** have full access to everything
- **Managers** can access their department's data
- **Team Leaders** can access their team's requests
- **Technicians** can only see assigned requests
- **Requesters** can only see their own requests

---

## Environment Variables

For frontend integration:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Server-side only!
```

---

## Common Commands

```bash
# Start local Supabase
supabase start

# Stop local Supabase
supabase stop

# Reset database (destructive!)
supabase db reset

# Create new migration
supabase migration new my_migration_name

# View migration status
supabase migration list

# Generate TypeScript types
supabase gen types typescript --local > ../frontend/src/types/database.ts

# View logs
supabase logs

# Open Studio (local)
# Go to http://localhost:54323
```

---

## Troubleshooting

### "RLS policy violation"
- Check if user has correct role
- Verify the operation is allowed for that role
- Check if entity belongs to user's department/team

### "Foreign key violation"
- Ensure referenced records exist
- Check cascade rules

### "Trigger error"
- Check status transition rules
- Verify user is assigned to request
- Check equipment is not scrapped

---

## Next Steps

1. Set up frontend project (see `FRONTEND_STEPS.md`)
2. Configure Supabase client
3. Implement authentication flows
4. Build UI components
