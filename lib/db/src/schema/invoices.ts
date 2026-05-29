import { pgTable, text, timestamp, integer, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const invoiceStatusEnum = pgEnum("invoice_status", ["draft", "sent", "paid", "overdue", "canceled"]);

export const invoicesTable = pgTable("invoices", {
  id: text("id").primaryKey().default("gen_random_uuid()"),
  consultantId: text("consultant_id").notNull(),
  clientName: text("client_name").notNull(),
  clientEmail: text("client_email"),
  lineItems: jsonb("line_items").notNull().default([]),
  subtotal: integer("subtotal").notNull(),
  taxAmount: integer("tax_amount").notNull().default(0),
  discountAmount: integer("discount_amount").notNull().default(0),
  total: integer("total").notNull(),
  currency: text("currency").notNull().default("USD"),
  status: invoiceStatusEnum("status").notNull().default("draft"),
  notes: text("notes"),
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertInvoiceSchema = createInsertSchema(invoicesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoicesTable.$inferSelect;
