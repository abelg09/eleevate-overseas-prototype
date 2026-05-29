import { pgTable, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const loanStatusEnum = pgEnum("loan_status", ["submitted", "under_review", "approved", "rejected", "disbursed"]);

export const loanApplicationsTable = pgTable("loan_applications", {
  id: text("id").primaryKey().default("gen_random_uuid()"),
  userId: text("user_id").notNull(),
  lenderId: text("lender_id").notNull(),
  lenderName: text("lender_name").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("USD"),
  interestRate: text("interest_rate"),
  tenureMonths: integer("tenure_months"),
  universityName: text("university_name"),
  country: text("country"),
  status: loanStatusEnum("status").notNull().default("submitted"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertLoanApplicationSchema = createInsertSchema(loanApplicationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLoanApplication = z.infer<typeof insertLoanApplicationSchema>;
export type LoanApplication = typeof loanApplicationsTable.$inferSelect;
