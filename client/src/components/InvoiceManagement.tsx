
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { FileText, Plus, CreditCard, Calendar, User, DollarSign } from 'lucide-react';
import type { Invoice, CreatePaymentInput, InvoiceFilter, Customer } from '../../../server/src/schema';

interface InvoiceManagementProps {
  onDataChanged: () => void;
}

export function InvoiceManagement({ onDataChanged }: InvoiceManagementProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<InvoiceFilter>({});
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [paymentFormData, setPaymentFormData] = useState<CreatePaymentInput>({
    invoice_id: 0,
    payment_date: new Date(),
    payment_method: 'cash',
    amount_paid: 0,
    notes: null
  });

  const loadInvoices = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getInvoices.query(filter);
      setInvoices(result);
    } catch (error) {
      console.error('Failed to load invoices:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  const loadCustomers = useCallback(async () => {
    try {
      const result = await trpc.getCustomers.query();
      setCustomers(result);
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleGenerateMonthlyInvoices = async () => {
    try {
      setIsSubmitting(true);
      await trpc.generateMonthlyInvoices.mutate();
      await loadInvoices();
      onDataChanged();
    } catch (error) {
      console.error('Failed to generate monthly invoices:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    setIsSubmitting(true);
    try {
      await trpc.createPayment.mutate(paymentFormData);
      setIsPaymentDialogOpen(false);
      setSelectedInvoice(null);
      setPaymentFormData({
        invoice_id: 0,
        payment_date: new Date(),
        payment_method: 'cash',
        amount_paid: 0,
        notes: null
      });
      await loadInvoices();
      onDataChanged();
    } catch (error) {
      console.error('Failed to record payment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPaymentDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentFormData({
      invoice_id: invoice.id,
      payment_date: new Date(),
      payment_method: 'cash',
      amount_paid: invoice.total_amount,
      notes: null
    });
    setIsPaymentDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'unpaid':
        return 'bg-yellow-100  text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCustomerName = (customerId: number) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.full_name : `Customer #${customerId}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Invoice Management 📄</span>
          </span>
          <div className="flex space-x-2">
            <Button onClick={handleGenerateMonthlyInvoices} disabled={isSubmitting}>
              <Plus className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Generating...' : 'Generate Monthly Invoices'}
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Manage invoices, record payments, and track billing status.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Select
            value={filter.status || 'all'}
            onValueChange={(value: string) => 
              setFilter((prev: InvoiceFilter) => ({
                ...prev,
                status: value === 'all' ? undefined : value as 'unpaid' | 'paid' | 'overdue'
              }))
            }
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filter.customer_id?.toString() || 'all'}
            onValueChange={(value: string) => 
              setFilter((prev: InvoiceFilter) => ({
                ...prev,
                customer_id: value === 'all' ? undefined : parseInt(value)
              }))
            }
          >
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by customer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Customers</SelectItem>
              {customers.map((customer: Customer) => (
                <SelectItem key={customer.id} value={customer.id.toString()}>
                  {customer.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Invoice List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
            <p className="text-gray-500 mb-4">
              {filter.status || filter.customer_id ? 'No invoices match your filters.' : 'Generate monthly invoices to get started.'}
            </p>
            {!filter.status && !filter.customer_id && (
              <Button onClick={handleGenerateMonthlyInvoices} disabled={isSubmitting}>
                <Plus className="h-4 w-4 mr-2" />
                Generate Monthly Invoices
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice: Invoice) => (
              <div key={invoice.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-lg">{invoice.invoice_number}</h3>
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4" />
                        <span>{getCustomerName(invoice.customer_id)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-semibold">Rp {invoice.total_amount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>Due: {invoice.due_date.toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>Issued: {invoice.issue_date.toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-2 col-span-2">
                        <span className="text-xs">
                          Service Period: {invoice.service_period_start.toLocaleDateString()} - {invoice.service_period_end.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium">Service Details: </span>
                      <span className="text-gray-600">{invoice.service_details}</span>
                    </div>
                  </div>
                  {invoice.status !== 'paid' && (
                    <div className="ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPaymentDialog(invoice)}
                        className="flex items-center space-x-2"
                      >
                        <CreditCard className="h-4 w-4" />
                        <span>Record Payment</span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Payment Dialog */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                Record a payment for invoice {selectedInvoice?.invoice_number}
              </DialogDescription>
            </DialogHeader>
            {selectedInvoice && (
              <>
                <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Invoice:</span>
                    <span className="font-medium">{selectedInvoice.invoice_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Customer:</span>
                    <span className="font-medium">{getCustomerName(selectedInvoice.customer_id)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Amount:</span>
                    <span className="font-bold text-green-600">Rp {selectedInvoice.total_amount.toLocaleString()}</span>
                  </div>
                </div>
                <Separator />
                <form onSubmit={handleRecordPayment} className="space-y-4">
                  <div>
                    <Label htmlFor="payment_date">Payment Date</Label>
                    <Input
                      id="payment_date"
                      type="date"
                      value={paymentFormData.payment_date.toISOString().split('T')[0]}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setPaymentFormData((prev: CreatePaymentInput) => ({
                          ...prev,
                          payment_date: new Date(e.target.value)
                        }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="payment_method">Payment Method</Label>
                    <Select
                      value={paymentFormData.payment_method}
                      onValueChange={(value: 'cash' | 'bank_transfer' | 'credit_card' | 'debit_card' | 'e_wallet') =>
                        setPaymentFormData((prev: CreatePaymentInput) => ({ ...prev, payment_method: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="debit_card">Debit Card</SelectItem>
                        <SelectItem value="e_wallet">E-Wallet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="amount_paid">Amount Paid (Rp)</Label>
                    <Input
                      id="amount_paid"
                      type="number"
                      value={paymentFormData.amount_paid}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setPaymentFormData((prev: CreatePaymentInput) => ({ ...prev, amount_paid: parseFloat(e.target.value) || 0 }))
                      }
                      min="0"
                      step="1000"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Input
                      id="notes"
                      value={paymentFormData.notes || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setPaymentFormData((prev: CreatePaymentInput) => ({
                          ...prev,
                          notes: e.target.value || null
                        }))
                      }
                      placeholder="Additional notes about the payment"
                    />
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Recording...' : 'Record Payment'}
                    </Button>
                  </DialogFooter>
                </form>
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
