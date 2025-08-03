
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { Plus, Edit, Trash2, Wifi, DollarSign } from 'lucide-react';
import type { ServicePackage, CreateServicePackageInput, UpdateServicePackageInput } from '../../../server/src/schema';

interface ServicePackageManagementProps {
  onDataChanged: () => void;
}

export function ServicePackageManagement({ onDataChanged }: ServicePackageManagementProps) {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreateServicePackageInput>({
    package_name: '',
    speed: '',
    monthly_price: 0,
    package_description: ''
  });

  const loadPackages = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getServicePackages.query();
      setPackages(result);
    } catch (error) {
      console.error('Failed to load service packages:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingPackage) {
        const updateData: UpdateServicePackageInput = {
          id: editingPackage.id,
          ...formData
        };
        await trpc.updateServicePackage.mutate(updateData);
        setEditingPackage(null);
      } else {
        await trpc.createServicePackage.mutate(formData);
        setIsCreateDialogOpen(false);
      }
      
      setFormData({
        package_name: '',
        speed: '',
        monthly_price: 0,
        package_description: ''
      });
      
      await loadPackages();
      onDataChanged();
    } catch (error) {
      console.error('Failed to save service package:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (pkg: ServicePackage) => {
    setEditingPackage(pkg);
    setFormData({
      package_name: pkg.package_name,
      speed: pkg.speed,
      monthly_price: pkg.monthly_price,
      package_description: pkg.package_description
    });
  };

  const handleDelete = async (packageId: number) => {
    try {
      await trpc.deleteServicePackage.mutate(packageId);
      await loadPackages();
      onDataChanged();
    } catch (error) {
      console.error('Failed to delete service package:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      package_name: '',
      speed: '',
      monthly_price: 0,
      package_description: ''
    });
    setEditingPackage(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <Wifi className="h-5 w-5" />
            <span>Service Package Management 📶</span>
          </span>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Package
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Service Package</DialogTitle>
                <DialogDescription>
                  Create a new internet service package for customers.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="package_name">Package Name</Label>
                  <Input
                    id="package_name"
                    value={formData.package_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateServicePackageInput) => ({ ...prev, package_name: e.target.value }))
                    }
                    placeholder="e.g., Basic Plan, Premium Plan"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="speed">Speed</Label>
                  <Input
                    id="speed"
                    value={formData.speed}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateServicePackageInput) => ({ ...prev, speed: e.target.value }))
                    }
                    placeholder="e.g., 10 Mbps, 20 Mbps"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="monthly_price">Monthly Price (Rp)</Label>
                  <Input
                    id="monthly_price"
                    type="number"
                    value={formData.monthly_price}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateServicePackageInput) => ({ ...prev, monthly_price: parseFloat(e.target.value) || 0 }))
                    }
                    placeholder="Enter monthly price"
                    min="0"
                    step="1000"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="package_description">Description</Label>
                  <Textarea
                    id="package_description"
                    value={formData.package_description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateServicePackageInput) => ({ ...prev, package_description: e.target.value }))
                    }
                    placeholder="Describe the package features and benefits"
                    required
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create Package'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
        <CardDescription>
          Manage internet service packages, pricing, and features.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse border rounded-lg p-4">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : packages.length === 0 ? (
          <div className="text-center py-8">
            <Wifi className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No service packages found</h3>
            <p className="text-gray-500 mb-4">
              Get started by creating your first internet service package.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Package
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg: ServicePackage) => (
              <Card key={pkg.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <span>{pkg.package_name}</span>
                    <div className="flex space-x-1">
                      <Dialog open={editingPackage?.id === pkg.id} onOpenChange={(open) => !open && setEditingPackage(null)}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(pkg)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>Edit Service Package</DialogTitle>
                            <DialogDescription>
                              Update service package information.
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                              <Label htmlFor="edit_package_name">Package Name</Label>
                              <Input
                                id="edit_package_name"
                                value={formData.package_name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setFormData((prev: CreateServicePackageInput) => ({ ...prev, package_name: e.target.value }))
                                }
                                placeholder="e.g., Basic Plan, Premium Plan"
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit_speed">Speed</Label>
                              <Input
                                id="edit_speed"
                                value={formData.speed}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setFormData((prev: CreateServicePackageInput) => ({ ...prev, speed: e.target.value }))
                                }
                                placeholder="e.g., 10 Mbps, 20 Mbps"
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit_monthly_price">Monthly Price (Rp)</Label>
                              <Input
                                id="edit_monthly_price"
                                type="number"
                                value={formData.monthly_price}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  setFormData((prev: CreateServicePackageInput) => ({ ...prev, monthly_price: parseFloat(e.target.value) || 0 }))
                                }
                                placeholder="Enter monthly price"
                                min="0"
                                step="1000"
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit_package_description">Description</Label>
                              <Textarea
                                id="edit_package_description"
                                value={formData.package_description}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                  setFormData((prev: CreateServicePackageInput) => ({ ...prev, package_description: e.target.value }))
                                }
                                placeholder="Describe the package features and benefits"
                                required
                              />
                            </div>
                            <DialogFooter>
                              <Button type="button" variant="outline" onClick={() => setEditingPackage(null)}>
                                Cancel
                              </Button>
                              <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Updating...' : 'Update Package'}
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
                            <AlertDialogTitle>Delete Service Package</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{pkg.package_name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(pkg.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardTitle>
                  <CardDescription className="flex items-center space-x-2">
                    <Wifi className="h-4 w-4" />
                    <span>{pkg.speed}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Monthly Price:</span>
                      <span className="text-xl font-bold text-green-600 flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        Rp {pkg.monthly_price.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Description:</p>
                      <p className="text-sm">{pkg.package_description}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">
                        Created: {pkg.created_at.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
