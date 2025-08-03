
import { z } from 'zod';

// Customer schema
export const customerSchema = z.object({
  id: z.number(),
  full_name: z.string(),
  full_address: z.string(),
  phone_number: z.string(),
  email_address: z.string().email(),
  join_date: z.coerce.date(),
  status: z.enum(['active', 'inactive']),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Customer = z.infer<typeof customerSchema>;

// Input schema for creating customers
export const createCustomerInputSchema = z.object({
  full_name: z.string().min(1),
  full_address: z.string().min(1),
  phone_number: z.string().min(1),
  email_address: z.string().email(),
  join_date: z.coerce.date(),
  status: z.enum(['active', 'inactive']).default('active')
});

export type CreateCustomerInput = z.infer<typeof createCustomerInputSchema>;

// Input schema for updating customers
export const updateCustomerInputSchema = z.object({
  id: z.number(),
  full_name: z.string().min(1).optional(),
  full_address: z.string().min(1).optional(),
  phone_number: z.string().min(1).optional(),
  email_address: z.string().email().optional(),
  join_date: z.coerce.date().optional(),
  status: z.enum(['active', 'inactive']).optional()
});

export type UpdateCustomerInput = z.infer<typeof updateCustomerInputSchema>;

// Service Package schema
export const servicePackageSchema = z.object({
  id: z.number(),
  package_name: z.string(),
  speed: z.string(),
  monthly_price: z.number(),
  package_description: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type ServicePackage = z.infer<typeof servicePackageSchema>;

// Input schema for creating service packages
export const createServicePackageInputSchema = z.object({
  package_name: z.string().min(1),
  speed: z.string().min(1),
  monthly_price: z.number().positive(),
  package_description: z.string().min(1)
});

export type CreateServicePackageInput = z.infer<typeof createServicePackageInputSchema>;

// Input schema for updating service packages
export const updateServicePackageInputSchema = z.object({
  id: z.number(),
  package_name: z.string().min(1).optional(),
  speed: z.string().min(1).optional(),
  monthly_price: z.number().positive().optional(),
  package_description: z.string().min(1).optional()
});

export type UpdateServicePackageInput = z.infer<typeof updateServicePackageInputSchema>;

// Customer Subscription schema
export const customerSubscriptionSchema = z.object({
  id: z.number(),
  customer_id: z.number(),
  package_id: z.number(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date().nullable(),
  status: z.enum(['active', 'inactive', 'suspended']),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type CustomerSubscription = z.infer<typeof customerSubscriptionSchema>;

// Input schema for creating customer subscriptions
export const createCustomerSubscriptionInputSchema = z.object({
  customer_id: z.number(),
  package_id: z.number(),
  start_date: z.coerce.date(),
  end_date: z.coerce.date().nullable().optional(),
  status: z.enum(['active', 'inactive', 'suspended']).default('active')
});

export type CreateCustomerSubscriptionInput = z.infer<typeof createCustomerSubscriptionInputSchema>;

// Invoice schema
export const invoiceSchema = z.object({
  id: z.number(),
  invoice_number: z.string(),
  customer_id: z.number(),
  subscription_id: z.number(),
  issue_date: z.coerce.date(),
  due_date: z.coerce.date(),
  service_period_start: z.coerce.date(),
  service_period_end: z.coerce.date(),
  service_details: z.string(),
  total_amount: z.number(),
  status: z.enum(['unpaid', 'paid', 'overdue']),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Invoice = z.infer<typeof invoiceSchema>;

// Input schema for creating invoices
export const createInvoiceInputSchema = z.object({
  customer_id: z.number(),
  subscription_id: z.number(),
  issue_date: z.coerce.date(),
  due_date: z.coerce.date(),
  service_period_start: z.coerce.date(),
  service_period_end: z.coerce.date(),
  service_details: z.string(),
  total_amount: z.number().positive()
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceInputSchema>;

// Input schema for updating invoice status
export const updateInvoiceStatusInputSchema = z.object({
  id: z.number(),
  status: z.enum(['unpaid', 'paid', 'overdue'])
});

export type UpdateInvoiceStatusInput = z.infer<typeof updateInvoiceStatusInputSchema>;

// Payment schema
export const paymentSchema = z.object({
  id: z.number(),
  invoice_id: z.number(),
  payment_date: z.coerce.date(),
  payment_method: z.enum(['cash', 'bank_transfer', 'credit_card', 'debit_card', 'e_wallet']),
  amount_paid: z.number(),
  notes: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Payment = z.infer<typeof paymentSchema>;

// Input schema for creating payments
export const createPaymentInputSchema = z.object({
  invoice_id: z.number(),
  payment_date: z.coerce.date(),
  payment_method: z.enum(['cash', 'bank_transfer', 'credit_card', 'debit_card', 'e_wallet']),
  amount_paid: z.number().positive(),
  notes: z.string().nullable().optional()
});

export type CreatePaymentInput = z.infer<typeof createPaymentInputSchema>;

// Admin dashboard statistics schema
export const adminStatsSchema = z.object({
  total_active_customers: z.number(),
  total_unpaid_invoices: z.number(),
  estimated_monthly_revenue: z.number()
});

export type AdminStats = z.infer<typeof adminStatsSchema>;

// Client dashboard data schema
export const clientDashboardSchema = z.object({
  customer: customerSchema,
  active_subscription: customerSubscriptionSchema.nullable(),
  service_package: servicePackageSchema.nullable(),
  invoices: z.array(invoiceSchema),
  payments: z.array(paymentSchema)
});

export type ClientDashboard = z.infer<typeof clientDashboardSchema>;

// Query parameters for filtering
export const customerFilterSchema = z.object({
  status: z.enum(['active', 'inactive']).optional(),
  search: z.string().optional()
});

export type CustomerFilter = z.infer<typeof customerFilterSchema>;

export const invoiceFilterSchema = z.object({
  status: z.enum(['unpaid', 'paid', 'overdue']).optional(),
  customer_id: z.number().optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional()
});

export type InvoiceFilter = z.infer<typeof invoiceFilterSchema>;
