import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const loyaltyPointsTable = pgTable("loyalty_points", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  event: text("event").notNull(),
  points: integer("points").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLoyaltyPointSchema = createInsertSchema(loyaltyPointsTable).omit({ id: true, createdAt: true });
export type InsertLoyaltyPoint = z.infer<typeof insertLoyaltyPointSchema>;
export type LoyaltyPoint = typeof loyaltyPointsTable.$inferSelect;
