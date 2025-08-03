
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { ArrowLeft, User, Wifi, FileText, CreditCard } from 'lucide-react';
import type { ClientDashboard as ClientDashboardType } from '../../../server/src/schema';

interface ClientDashboardProps {
  customerId: number | null;
  onBackToAdmin: () => void;
}

export function ClientDashboard({ customerId, onBackToAdmin }: ClientDashboardProps) {
  const [dashboardData, setDashboardData] = useState<ClientDashboardType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadDashboardData = useCallback(async () => {
    if (!customerId) return;
    
    try {
      setIsLoading(true);
      const data = await trpc.getClientDashboard.query(customerId);
      setDashboardData(data);
    } catch (error) {
      console.error('Failed to load client dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (!customerId) {
    return (
      <div className="text-center py-12">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center justify-center space-x-2">
              <User className="h-5 w-5" />
              <span>Select a Customer</span>
            </CardTitle>
            <CardDescription>
              Please select a customer from the admin dashboard to view their information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={onBackToAdmin} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBackToAdmin} disabled>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
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

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Customer Not Found</CardTitle>
            <CardDescription>
              Unable to load customer data. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={onBackToAdmin} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Admin Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'unpaid':
        return 'bg-red-100 text-red-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBackToAdmin}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {dashboardData.customer.full_name} 👤
            </h2>
            <p className="text-gray-600">{dashboardData.customer.email_address}</p>
          </div>
        </div>
        <Badge className={getStatusColor(dashboardData.customer.status)}>
          {dashboardData.customer.status.toUpperCase()}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Customer Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Full Name</p>
              <p className="text-lg">{dashboardData.customer.full_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Address</p>
              <p>{dashboardData.customer.full_address}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Phone</p>
              <p>{dashboardData.customer.phone_number}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p>{dashboardData.customer.email_address}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Join Date</p>
              <p>{dashboardData.customer.join_date.toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        {/* Active Subscription */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wifi className="h-5 w-5" />
              <span>Active Subscription</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.active_subscription && dashboardData.service_package ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Package</p>
                  <p className="text-lg font-semibold">{dashboardData.service_package.package_name} 📶</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Speed</p>
                  <p>{dashboardData.service_package.speed}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Monthly Price</p>
                  <p className="text-lg font-semibold text-green-600">
                    Rp {dashboardData.service_package.monthly_price.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Description</p>
                  <p className="text-sm text-gray-600">{dashboardData.service_package.package_description}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <Badge className={getStatusColor(dashboardData.active_subscription.status)}>
                    {dashboardData.active_subscription.status.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Start Date</p>
                  <p>{dashboardData.active_subscription.start_date.toLocaleDateString()}</p>
                </div>
                {dashboardData.active_subscription.end_date && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">End Date</p>
                    <p>{dashboardData.active_subscription.end_date.toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No active subscription found 🚫</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Recent Invoices</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.invoices.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.invoices.slice(0, 5).map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{invoice.invoice_number}</p>
                      <p className="text-sm text-gray-500">
                        Due: {invoice.due_date.toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        Period: {invoice.service_period_start.toLocaleDateString()} - {invoice.service_period_end.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">Rp {invoice.total_amount.toLocaleString()}</p>
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                ))}
                {dashboardData.invoices.length > 5 && (
                  <p className="text-sm text-gray-500 text-center">
                    And {dashboardData.invoices.length - 5} more invoices...
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No invoices found 📄</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Recent Payments</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dashboardData.payments.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.payments.slice(0, 5).map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium">Invoice #{payment.invoice_id}</p>
                      <p className="text-sm text-gray-500">
                        {payment.payment_date.toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500 capitalize">
                        {payment.payment_method.replace('_', ' ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        Rp {payment.amount_paid.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                {dashboardData.payments.length > 5 && (
                  <p className="text-sm text-gray-500 text-center">
                    And {dashboardData.payments.length - 5} more payments...
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No payments found 💳</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
