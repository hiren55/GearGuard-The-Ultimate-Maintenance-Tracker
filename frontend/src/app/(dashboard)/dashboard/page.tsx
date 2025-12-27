'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import {
  Wrench,
  ClipboardList,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Plus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CardSpinner, FullPageSpinner } from '@/components/ui/spinner';
import { useAuth } from '@/hooks/use-auth';
import { getSupabaseClient } from '@/lib/supabase/client';

interface DashboardStats {
  equipment: {
    total: number;
    active: number;
    under_maintenance: number;
  };
  requests: {
    new: number;
    assigned: number;
    in_progress: number;
    on_hold: number;
    completed_today: number;
    overdue: number;
  };
  this_month: {
    created: number;
    completed: number;
  };
}

export default function DashboardPage() {
  const { user, isInitialized } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    // Wait for auth to complete before fetching stats
    if (!isInitialized) return;

    // Prevent double fetching
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const fetchStats = async () => {
      // Timeout promise to prevent infinite loading
      const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Dashboard data fetch timeout')), 10000);
      });

      try {
        const supabase = getSupabaseClient();

        // Try RPC first, fall back to manual queries
        const rpcPromise = supabase.rpc('get_dashboard_stats');
        const { data, error: rpcError } = await Promise.race([rpcPromise, timeout]) as Awaited<typeof rpcPromise>;

        if (!rpcError && data) {
          setStats(data as DashboardStats);
        } else {
          // Fallback: fetch basic counts manually
          console.log('RPC not available, using fallback queries');

          // Run all queries in parallel with a timeout
          const [equipmentTotal, equipmentActive, requestsNew, requestsInProgress] = await Promise.race([
            Promise.all([
              supabase.from('equipment').select('*', { count: 'exact', head: true }),
              supabase.from('equipment').select('*', { count: 'exact', head: true }).eq('status', 'active'),
              supabase.from('maintenance_requests').select('*', { count: 'exact', head: true }).eq('status', 'new'),
              supabase.from('maintenance_requests').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
            ]),
            timeout,
          ]);

          setStats({
            equipment: {
              total: equipmentTotal.count || 0,
              active: equipmentActive.count || 0,
              under_maintenance: 0,
            },
            requests: {
              new: requestsNew.count || 0,
              assigned: 0,
              in_progress: requestsInProgress.count || 0,
              on_hold: 0,
              completed_today: 0,
              overdue: 0,
            },
            this_month: {
              created: 0,
              completed: 0,
            },
          });
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err);
        setError('Could not load dashboard data');
        // Set empty stats so the page still renders
        setStats({
          equipment: { total: 0, active: 0, under_maintenance: 0 },
          requests: { new: 0, assigned: 0, in_progress: 0, on_hold: 0, completed_today: 0, overdue: 0 },
          this_month: { created: 0, completed: 0 },
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [isInitialized]);

  // The layout handles auth loading, so we can render immediately
  // Individual cards show their own loading states

  const statCards = [
    {
      title: 'Total Equipment',
      value: stats?.equipment.total ?? 0,
      icon: Wrench,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Active Equipment',
      value: stats?.equipment.active ?? 0,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Open Requests',
      value: (stats?.requests.new ?? 0) + (stats?.requests.in_progress ?? 0),
      icon: ClipboardList,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'Overdue',
      value: stats?.requests.overdue ?? 0,
      icon: AlertTriangle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
  ];

  const requestStats = [
    { label: 'New', value: stats?.requests.new ?? 0, color: 'bg-gray-500' },
    { label: 'Assigned', value: stats?.requests.assigned ?? 0, color: 'bg-blue-500' },
    { label: 'In Progress', value: stats?.requests.in_progress ?? 0, color: 'bg-yellow-500' },
    { label: 'On Hold', value: stats?.requests.on_hold ?? 0, color: 'bg-orange-500' },
    { label: 'Completed Today', value: stats?.requests.completed_today ?? 0, color: 'bg-green-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.full_name?.split(' ')[0] || 'User'}!
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening with your maintenance operations today.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              {isLoading ? (
                <CardSpinner />
              ) : (
                <div className="flex items-center gap-4">
                  <div className={`rounded-lg p-3 ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Request Stats and Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Request Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Request Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <CardSpinner />
            ) : (
              <div className="space-y-4">
                {requestStats.map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${item.color}`} />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <CardSpinner />
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-blue-500/10 p-2">
                      <ClipboardList className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium">Requests Created</p>
                      <p className="text-sm text-muted-foreground">New work orders</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold">{stats?.this_month.created ?? 0}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-green-500/10 p-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium">Requests Completed</p>
                      <p className="text-sm text-muted-foreground">Finished work</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold">{stats?.this_month.completed ?? 0}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-yellow-500/10 p-2">
                      <Clock className="h-5 w-5 text-yellow-500" />
                    </div>
                    <div>
                      <p className="font-medium">Completion Rate</p>
                      <p className="text-sm text-muted-foreground">Work efficiency</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold">
                    {stats?.this_month.created
                      ? Math.round((stats.this_month.completed / stats.this_month.created) * 100)
                      : 0}
                    %
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button asChild variant="outline">
              <Link href="/maintenance">
                <Plus className="mr-2 h-4 w-4" />
                New Request
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/equipment">
                <Wrench className="mr-2 h-4 w-4" />
                View Equipment
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/maintenance?status=overdue">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Overdue Requests
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/calendar">
                <Clock className="mr-2 h-4 w-4" />
                View Calendar
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error message */}
      {error && (
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="pt-6">
            <p className="text-sm text-yellow-600">
              Note: {error}. The database may still need to be set up.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
