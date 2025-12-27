# GearGuard Frontend

A modern React/Next.js frontend for the GearGuard maintenance management system.

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase project (see `/supabase` folder)

### Installation

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Update .env.local with your Supabase credentials
# NEXT_PUBLIC_SUPABASE_URL=your-project-url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth pages (login, register)
│   │   ├── (dashboard)/       # Protected dashboard pages
│   │   ├── layout.tsx         # Root layout
│   │   └── providers.tsx      # React Query + other providers
│   ├── components/
│   │   ├── ui/                # Base UI components
│   │   ├── common/            # Shared components
│   │   ├── layout/            # Layout components
│   │   ├── equipment/         # Equipment-specific
│   │   ├── maintenance/       # Maintenance-specific
│   │   └── kanban/            # Kanban board
│   ├── hooks/                 # Custom React hooks
│   ├── lib/
│   │   ├── supabase/          # Supabase client config
│   │   └── utils.ts           # Utility functions
│   ├── stores/                # Zustand state stores
│   ├── types/                 # TypeScript types
│   ├── constants/             # App constants
│   └── styles/                # Global styles
├── public/                    # Static assets
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State | Zustand + React Query |
| Forms | React Hook Form + Zod |
| Backend | Supabase |
| UI Components | Radix UI primitives |
| Icons | Lucide React |

---

## Available Scripts

```bash
# Development
npm run dev          # Start dev server

# Build
npm run build        # Production build
npm run start        # Start production server

# Quality
npm run lint         # ESLint
npm run type-check   # TypeScript check
```

---

## Authentication

Authentication is handled via Supabase Auth:

- **Login**: `/login`
- **Register**: `/register`
- **Forgot Password**: `/forgot-password`

Protected routes automatically redirect to login.

### Auth Hook Usage

```tsx
import { useAuth } from '@/hooks/use-auth';

function MyComponent() {
  const { user, role, signOut, hasRole } = useAuth();

  // Check if user has minimum role
  if (hasRole('manager')) {
    // Show manager features
  }
}
```

---

## Components

### UI Components (`/components/ui`)

- `Button` - Primary button with variants and loading state
- `Input` - Form input with error state
- `Label` - Form label
- `Card` - Content container
- `Spinner` - Loading indicators

### Layout Components (`/components/layout`)

- `Sidebar` - Navigation sidebar
- `Header` - Page header
- `DashboardLayout` - Main dashboard wrapper

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |

---

## Pages Implemented

| Page | Route | Status |
|------|-------|--------|
| Login | `/login` | ✅ Complete |
| Register | `/register` | ✅ Complete |
| Forgot Password | `/forgot-password` | ✅ Complete |
| Dashboard | `/dashboard` | ✅ Complete |
| Equipment | `/equipment` | 📝 Placeholder |
| Maintenance | `/maintenance` | 📝 Placeholder |
| Teams | `/teams` | 📝 Placeholder |
| Calendar | `/calendar` | 📝 Placeholder |
| Settings | `/settings` | 📝 Placeholder |

---

## Next Steps

1. **Run Supabase migrations** (see `/supabase/README.md`)
2. **Create admin user** via Supabase dashboard
3. **Implement Equipment CRUD** - List, detail, create, edit
4. **Implement Maintenance Requests** - Full workflow
5. **Build Kanban Board** - Drag-and-drop status updates
6. **Add Calendar View** - Scheduled maintenance
7. **Add real-time updates** - Supabase subscriptions

---

## Development Tips

### Generate Types from Database

```bash
cd ../supabase
supabase gen types typescript --local > ../frontend/src/types/database.ts
```

### Add New UI Components

Consider using [shadcn/ui](https://ui.shadcn.com/) CLI:

```bash
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
```

---

## License

Private - GearGuard Maintenance System
