
import { 
  serial, 
  text, 
  pgTable, 
  timestamp, 
  numeric, 
  integer, 
  pgEnum,
  date
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const customerStatusEnum = pgEnum('customer_status', ['active', 'inactive']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'inactive', 'suspended']);
export const invoiceStatusEnum = pgEnum('invoice_status', ['unpaid', 'paid', 'overdue']);
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'bank_transfer', 'credit_card', 'debit_card', 'e_wallet']);

// Customers table
export const customersTable = pgTable('customers', {
  id: serial('id').primaryKey(),
  full_name: text('full_name').notNull(),
  full_address: text('full_address').notNull(),
  phone_number: text('phone_number').notNull(),
  email_address: text('email_address').notNull(),
  join_date: date('join_date').notNull(),
  status: customerStatusEnum('status').notNull().default('active'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Service packages table
export const servicePackagesTable = pgTable('service_packages', {
  id: serial('id').primaryKey(),
  package_name: text('package_name').notNull(),
  speed: text('speed').notNull(),
  monthly_price: numeric('monthly_price', { precision: 10, scale: 2 }).notNull(),
  package_description: text('package_description').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Customer subscriptions table
export const customerSubscriptionsTable = pgTable('customer_subscriptions', {
  id: serial('id').primaryKey(),
  customer_id: integer('customer_id').notNull().references(() => customersTable.id),
  package_id: integer('package_id').notNull().references(() => servicePackagesTable.id),
  start_date: date('start_date').notNull(),
  end_date: date('end_date'),
  status: subscriptionStatusEnum('status').notNull().default('active'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Invoices table
export const invoicesTable = pgTable('invoices', {
  id: serial('id').primaryKey(),
  invoice_number: text('invoice_number').notNull().unique(),
  customer_id: integer('customer_id').notNull().references(() => customersTable.id),
  subscription_id: integer('subscription_id').notNull().references(() => customerSubscriptionsTable.id),
  issue_date: date('issue_date').notNull(),
  due_date: date('due_date').notNull(),
  service_period_start: date('service_period_start').notNull(),
  service_period_end: date('service_period_end').notNull(),
  service_details: text('service_details').notNull(),
  total_amount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  status: invoiceStatusEnum('status').notNull().default('unpaid'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Payments table
export const paymentsTable = pgTable('payments', {
  id: serial('id').primaryKey(),
  invoice_id: integer('invoice_id').notNull().references(() => invoicesTable.id),
  payment_date: date('payment_date').notNull(),
  payment_method: paymentMethodEnum('payment_method').notNull(),
  amount_paid: numeric('amount_paid', { precision: 10, scale: 2 }).notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const customersRelations = relations(customersTable, ({ many }) => ({
  subscriptions: many(customerSubscriptionsTable),
  invoices: many(invoicesTable),
}));

export const servicePackagesRelations = relations(servicePackagesTable, ({ many }) => ({
  subscriptions: many(customerSubscriptionsTable),
}));

export const customerSubscriptionsRelations = relations(customerSubscriptionsTable, ({ one, many }) => ({
  customer: one(customersTable, {
    fields: [customerSubscriptionsTable.customer_id],
    references: [customersTable.id],
  }),
  servicePackage: one(servicePackagesTable, {
    fields: [customerSubscriptionsTable.package_id],
    references: [servicePackagesTable.id],
  }),
  invoices: many(invoicesTable),
}));

export const invoicesRelations = relations(invoicesTable, ({ one, many }) => ({
  customer: one(customersTable, {
    fields: [invoicesTable.customer_id],
    references: [customersTable.id],
  }),
  subscription: one(customerSubscriptionsTable, {
    fields: [invoicesTable.subscription_id],
    references: [customerSubscriptionsTable.id],
  }),
  payments: many(paymentsTable),
}));

export const paymentsRelations = relations(paymentsTable, ({ one }) => ({
  invoice: one(invoicesTable, {
    fields: [paymentsTable.invoice_id],
    references: [invoicesTable.id],
  }),
}));

// Export all tables for proper query building
export const tables = {
  customers: customersTable,
  servicePackages: servicePackagesTable,
  customerSubscriptions: customerSubscriptionsTable,
  invoices: invoicesTable,
  payments: paymentsTable,
};
