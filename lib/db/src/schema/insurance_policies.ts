import { pgTable, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const insuranceTypeEnum = pgEnum("insurance_type", ["travel", "health", "study_abroad", "property"]);
export const insuranceStatusEnum = pgEnum("insurance_status", ["quoted", "active", "expired", "canceled"]);

export const insurancePoliciesTable = pgTable("insurance_policies", {
  id: text("id").primaryKey().default("gen_random_uuid()"),
  userId: text("user_id").notNull(),
  type: insuranceTypeEnum("type").notNull(),
  provider: text("provider").notNull(),
  productId: text("product_id").notNull(),
  productName: text("product_name").notNull(),
  premium: integer("premium").notNull(),
  currency: text("currency").notNull().default("USD"),
  status: insuranceStatusEnum("status").notNull().default("quoted"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  policyDocUrl: text("policy_doc_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertInsurancePolicySchema = createInsertSchema(insurancePoliciesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertInsurancePolicy = z.infer<typeof insertInsurancePolicySchema>;
export type InsurancePolicy = typeof insurancePoliciesTable.$inferSelect;
