
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { Search, Plus, Edit, Trash2, Eye, User, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import type { Customer, CreateCustomerInput, UpdateCustomerInput, CustomerFilter } from '../../../server/src/schema';

interface CustomerManagementProps {
  onViewClient: (customerId: number) => void;
  onDataChanged: () => void;
}

export function CustomerManagement({ onViewClient, onDataChanged }: CustomerManagementProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<CustomerFilter>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreateCustomerInput>({
    full_name: '',
    full_address: '',
    phone_number: '',
    email_address: '',
    join_date: new Date(),
    status: 'active'
  });

  const loadCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      const filterData: CustomerFilter = {};
      if (filter.status) filterData.status = filter.status;
      if (searchTerm.trim()) filterData.search = searchTerm.trim();
      
      const result = await trpc.getCustomers.query(filterData);
      setCustomers(result);
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filter, searchTerm]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingCustomer) {
        const updateData: UpdateCustomerInput = {
          id: editingCustomer.id,
          ...formData
        };
        await trpc.updateCustomer.mutate(updateData);
        setEditingCustomer(null);
      } else {
        await trpc.createCustomer.mutate(formData);
        setIsCreateDialogOpen(false);
      }
      
      setFormData({
        full_name: '',
        full_address: '',
        phone_number: '',
        email_address: '',
        join_date: new Date(),
        status: 'active'
      });
      
      await loadCustomers();
      onDataChanged();
    } catch (error) {
      console.error('Failed to save customer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      full_name: customer.full_name,
      full_address: customer.full_address,
      phone_number: customer.phone_number,
      email_address: customer.email_address,
      join_date: customer.join_date,
      status: customer.status
    });
  };

  const handleDelete = async (customerId: number) => {
    try {
      await trpc.deleteCustomer.mutate(customerId);
      await loadCustomers();
      onDataChanged();
    } catch (error) {
      console.error('Failed to delete customer:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      full_address: '',
      phone_number: '',
      email_address: '',
      join_date: new Date(),
      status: 'active'
    });
    setEditingCustomer(null);
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Customer Management 👥</span>
          </span>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Customer</DialogTitle>
                <DialogDescription>
                  Create a new customer account in the system.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateCustomerInput) => ({ ...prev, full_name: e.target.value }))
                    }
                    placeholder="Enter customer's full name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email_address">Email Address</Label>
                  <Input
                    id="email_address"
                    type="email"
                    value={formData.email_address}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateCustomerInput) => ({ ...prev, email_address: e.target.value }))
                    }
                    placeholder="customer@example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    value={formData.phone_number}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateCustomerInput) => ({ ...prev, phone_number: e.target.value }))
                    }
                    placeholder="Enter phone number"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="full_address">Full Address</Label>
                  <Input
                    id="full_address"
                    value={formData.full_address}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateCustomerInput) => ({ ...prev, full_address: e.target.value }))
                    }
                    placeholder="Enter complete address"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="join_date">Join Date</Label>
                  <Input
                    id="join_date"
                    type="date"
                    value={formData.join_date.toISOString().split('T')[0]}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateCustomerInput) => ({
                        ...prev,
                        join_date: new Date(e.target.value)
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'active' | 'inactive') =>
                      setFormData((prev: CreateCustomerInput) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create Customer'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
        <CardDescription>
          Manage customer accounts, view details, and update information.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={filter.status || 'all'}
            onValueChange={(value: string) => 
              setFilter((prev: CustomerFilter) => ({
                ...prev,
                status: value === 'all' ? undefined : value as 'active' | 'inactive'
              }))
            }
          >
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Customer List */}
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
        ) : customers.length === 0 ? (
          <div className="text-center py-8">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || filter.status ? 'No customers match your filters.' : 'Get started by adding your first customer.'}
            </p>
            {!searchTerm && !filter.status && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {customers.map((customer: Customer) => (
              <div key={customer.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-lg">{customer.full_name}</h3>
                      <Badge className={getStatusColor(customer.status)}>
                        {customer.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4" />
                        <span>{customer.email_address}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4" />
                        <span>{customer.phone_number}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{customer.full_address}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4" />
                        <span>Joined: {customer.join_date.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewClient(customer.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Dialog open={editingCustomer?.id === customer.id} onOpenChange={(open) => !open && setEditingCustomer(null)}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(customer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Edit Customer</DialogTitle>
                          <DialogDescription>
                            Update customer information.
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                          <div>
                            <Label htmlFor="edit_full_name">Full Name</Label>
                            <Input
                              id="edit_full_name"
                              value={formData.full_name}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setFormData((prev: CreateCustomerInput) => ({ ...prev, full_name: e.target.value }))
                              }
                              placeholder="Enter customer's full name"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit_email_address">Email Address</Label>
                            <Input
                              id="edit_email_address"
                              type="email"
                              value={formData.email_address}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setFormData((prev: CreateCustomerInput) => ({ ...prev, email_address: e.target.value }))
                              }
                              placeholder="customer@example.com"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit_phone_number">Phone Number</Label>
                            <Input
                              id="edit_phone_number"
                              value={formData.phone_number}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setFormData((prev: CreateCustomerInput) => ({ ...prev, phone_number: e.target.value }))
                              }
                              placeholder="Enter phone number"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit_full_address">Full Address</Label>
                            <Input
                              id="edit_full_address"
                              value={formData.full_address}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setFormData((prev: CreateCustomerInput) => ({ ...prev, full_address: e.target.value }))
                              }
                              placeholder="Enter complete address"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit_join_date">Join Date</Label>
                            <Input
                              id="edit_join_date"
                              type="date"
                              value={formData.join_date.toISOString().split('T')[0]}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setFormData((prev: CreateCustomerInput) => ({
                                  ...prev,
                                  join_date: new Date(e.target.value)
                                }))
                              }
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="edit_status">Status</Label>
                            <Select
                              value={formData.status}
                              onValueChange={(value: 'active' | 'inactive') =>
                                setFormData((prev: CreateCustomerInput) => ({ ...prev, status: value }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setEditingCustomer(null)}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                              {isSubmitting ? 'Updating...' : 'Update Customer'}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Customer</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {customer.full_name}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(customer.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
