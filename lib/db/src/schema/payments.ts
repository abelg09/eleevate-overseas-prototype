import { pgTable, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const paymentTypeEnum = pgEnum("payment_type", ["tuition", "service", "subscription", "remittance"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "processing", "completed", "failed", "refunded"]);

export const paymentsTable = pgTable("payments", {
  id: text("id").primaryKey().default("gen_random_uuid()"),
  userId: text("user_id").notNull(),
  type: paymentTypeEnum("type").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  status: paymentStatusEnum("status").notNull().default("pending"),
  reference: text("reference"),
  description: text("description"),
  universityId: text("university_id"),
  receiptUrl: text("receipt_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;
