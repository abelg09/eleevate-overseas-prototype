import { pgTable, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const forexStatusEnum = pgEnum("forex_status", ["pending", "processing", "completed", "failed"]);

export const forexTransactionsTable = pgTable("forex_transactions", {
  id: text("id").primaryKey().default("gen_random_uuid()"),
  userId: text("user_id").notNull(),
  fromCurrency: text("from_currency").notNull(),
  toCurrency: text("to_currency").notNull(),
  fromAmount: integer("from_amount").notNull(),
  toAmount: integer("to_amount").notNull(),
  rate: text("rate").notNull(),
  status: forexStatusEnum("status").notNull().default("pending"),
  purpose: text("purpose"),
  recipientName: text("recipient_name"),
  recipientBank: text("recipient_bank"),
  recipientAccount: text("recipient_account"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertForexTransactionSchema = createInsertSchema(forexTransactionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertForexTransaction = z.infer<typeof insertForexTransactionSchema>;
export type ForexTransaction = typeof forexTransactionsTable.$inferSelect;
