import { Wrench } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary text-primary-foreground flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground text-primary">
            <Wrench className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold">GearGuard</span>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight">
            Streamline Your Maintenance Operations
          </h1>
          <p className="text-lg text-primary-foreground/80">
            Track equipment, manage maintenance requests, and coordinate your maintenance
            teams all in one powerful platform.
          </p>
          <ul className="space-y-3 text-primary-foreground/80">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
              Equipment lifecycle management
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
              Preventive & corrective maintenance
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
              Visual Kanban workflow
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
              Team coordination & scheduling
            </li>
          </ul>
        </div>

        <p className="text-sm text-primary-foreground/60">
          © 2024 GearGuard. All rights reserved.
        </p>
      </div>

      {/* Right side - Auth form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
