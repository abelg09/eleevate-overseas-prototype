import { pgTable, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const orderStatusEnum = pgEnum("order_status", ["pending", "paid", "in_delivery", "completed", "refunded", "canceled"]);

export const serviceOrdersTable = pgTable("service_orders", {
  id: text("id").primaryKey().default("gen_random_uuid()"),
  userId: text("user_id").notNull(),
  serviceId: text("service_id").notNull(),
  serviceName: text("service_name").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  status: orderStatusEnum("status").notNull().default("pending"),
  paymentRef: text("payment_ref"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertServiceOrderSchema = createInsertSchema(serviceOrdersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertServiceOrder = z.infer<typeof insertServiceOrderSchema>;
export type ServiceOrder = typeof serviceOrdersTable.$inferSelect;
