
import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import { Users, DollarSign, FileText, TrendingUp } from 'lucide-react';
import { CustomerManagement } from './CustomerManagement';
import { ServicePackageManagement } from './ServicePackageManagement';
import { InvoiceManagement } from './InvoiceManagement';
import type { AdminStats } from '../../../server/src/schema';

interface AdminDashboardProps {
  onViewClient: (customerId: number) => void;
}

export function AdminDashboard({ onViewClient }: AdminDashboardProps) {
  const [stats, setStats] = useState<AdminStats>({
    total_active_customers: 0,
    total_unpaid_invoices: 0,
    estimated_monthly_revenue: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      setIsLoading(true);
      const adminStats = await trpc.getAdminStats.query();
      setStats(adminStats);
    } catch (error) {
      console.error('Failed to load admin stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const refreshStats = useCallback(() => {
    loadStats();
  }, [loadStats]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Active Customers</CardTitle>
            <Users className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_active_customers} 👥</div>
            <p className="text-xs opacity-90 mt-1">
              Registered customers with active status
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Unpaid Invoices</CardTitle>
            <FileText className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_unpaid_invoices} 📄</div>
            <p className="text-xs opacity-90 mt-1">
              Invoices pending payment
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium opacity-90">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 opacity-90" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {stats.estimated_monthly_revenue.toLocaleString()} 💰</div>
            <p className="text-xs opacity-90 mt-1">
              Estimated monthly revenue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="customers" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="customers" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Customers</span>
          </TabsTrigger>
          <TabsTrigger value="packages" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Packages</span>
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4" />
            <span>Invoices</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customers">
          <CustomerManagement onViewClient={onViewClient} onDataChanged={refreshStats} />
        </TabsContent>

        <TabsContent value="packages">
          <ServicePackageManagement onDataChanged={refreshStats} />
        </TabsContent>

        <TabsContent value="invoices">
          <InvoiceManagement onDataChanged={refreshStats} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
