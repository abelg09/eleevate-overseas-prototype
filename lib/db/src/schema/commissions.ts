import { pgTable, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const commissionStatusEnum = pgEnum("commission_status", ["earned", "pending", "paid"]);

export const commissionsTable = pgTable("commissions", {
  id: text("id").primaryKey().default("gen_random_uuid()"),
  consultantId: text("consultant_id").notNull(),
  source: text("source").notNull(),
  description: text("description"),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  status: commissionStatusEnum("status").notNull().default("earned"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCommissionSchema = createInsertSchema(commissionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCommission = z.infer<typeof insertCommissionSchema>;
export type Commission = typeof commissionsTable.$inferSelect;
