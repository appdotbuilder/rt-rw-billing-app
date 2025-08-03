
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createCustomerInputSchema,
  updateCustomerInputSchema,
  createServicePackageInputSchema,
  updateServicePackageInputSchema,
  createCustomerSubscriptionInputSchema,
  createInvoiceInputSchema,
  updateInvoiceStatusInputSchema,
  createPaymentInputSchema,
  customerFilterSchema,
  invoiceFilterSchema
} from './schema';

// Import handlers
import { createCustomer } from './handlers/create_customer';
import { getCustomers } from './handlers/get_customers';
import { getCustomerById } from './handlers/get_customer_by_id';
import { updateCustomer } from './handlers/update_customer';
import { deleteCustomer } from './handlers/delete_customer';
import { createServicePackage } from './handlers/create_service_package';
import { getServicePackages } from './handlers/get_service_packages';
import { getServicePackageById } from './handlers/get_service_package_by_id';
import { updateServicePackage } from './handlers/update_service_package';
import { deleteServicePackage } from './handlers/delete_service_package';
import { createCustomerSubscription } from './handlers/create_customer_subscription';
import { getCustomerSubscriptions } from './handlers/get_customer_subscriptions';
import { getActiveSubscriptionByCustomer } from './handlers/get_active_subscription_by_customer';
import { createInvoice } from './handlers/create_invoice';
import { getInvoices } from './handlers/get_invoices';
import { getInvoiceById } from './handlers/get_invoice_by_id';
import { updateInvoiceStatus } from './handlers/update_invoice_status';
import { generateMonthlyInvoices } from './handlers/generate_monthly_invoices';
import { createPayment } from './handlers/create_payment';
import { getPayments } from './handlers/get_payments';
import { getAdminStats } from './handlers/get_admin_stats';
import { getClientDashboard } from './handlers/get_client_dashboard';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Customer management
  createCustomer: publicProcedure
    .input(createCustomerInputSchema)
    .mutation(({ input }) => createCustomer(input)),
  
  getCustomers: publicProcedure
    .input(customerFilterSchema.optional())
    .query(({ input }) => getCustomers(input)),
  
  getCustomerById: publicProcedure
    .input(z.number())
    .query(({ input }) => getCustomerById(input)),
  
  updateCustomer: publicProcedure
    .input(updateCustomerInputSchema)
    .mutation(({ input }) => updateCustomer(input)),
  
  deleteCustomer: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteCustomer(input)),

  // Service package management
  createServicePackage: publicProcedure
    .input(createServicePackageInputSchema)
    .mutation(({ input }) => createServicePackage(input)),
  
  getServicePackages: publicProcedure
    .query(() => getServicePackages()),
  
  getServicePackageById: publicProcedure
    .input(z.number())
    .query(({ input }) => getServicePackageById(input)),
  
  updateServicePackage: publicProcedure
    .input(updateServicePackageInputSchema)
    .mutation(({ input }) => updateServicePackage(input)),
  
  deleteServicePackage: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteServicePackage(input)),

  // Customer subscription management
  createCustomerSubscription: publicProcedure
    .input(createCustomerSubscriptionInputSchema)
    .mutation(({ input }) => createCustomerSubscription(input)),
  
  getCustomerSubscriptions: publicProcedure
    .input(z.number().optional())
    .query(({ input }) => getCustomerSubscriptions(input)),
  
  getActiveSubscriptionByCustomer: publicProcedure
    .input(z.number())
    
    .query(({ input }) => getActiveSubscriptionByCustomer(input)),

  // Invoice management
  createInvoice: publicProcedure
    .input(createInvoiceInputSchema)
    .mutation(({ input }) => createInvoice(input)),
  
  getInvoices: publicProcedure
    .input(invoiceFilterSchema.optional())
    .query(({ input }) => getInvoices(input)),
  
  getInvoiceById: publicProcedure
    .input(z.number())
    .query(({ input }) => getInvoiceById(input)),
  
  updateInvoiceStatus: publicProcedure
    .input(updateInvoiceStatusInputSchema)
    .mutation(({ input }) => updateInvoiceStatus(input)),
  
  generateMonthlyInvoices: publicProcedure
    .mutation(() => generateMonthlyInvoices()),

  // Payment management
  createPayment: publicProcedure
    .input(createPaymentInputSchema)
    .mutation(({ input }) => createPayment(input)),
  
  getPayments: publicProcedure
    .input(z.number().optional())
    .query(({ input }) => getPayments(input)),

  // Dashboard endpoints
  getAdminStats: publicProcedure
    .query(() => getAdminStats()),
  
  getClientDashboard: publicProcedure
    .input(z.number())
    .query(({ input }) => getClientDashboard(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
