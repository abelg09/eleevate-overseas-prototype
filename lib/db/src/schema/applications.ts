import { pgTable, text, date, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const applicationStatusEnum = pgEnum("application_status", [
  "researching", "applied", "under_review", "conditional_offer",
  "unconditional_offer", "rejected", "accepted", "visa_applied",
  "visa_approved", "enrolled"
]);

export const applicationsTable = pgTable("applications", {
  id: text("id").primaryKey().default("gen_random_uuid()"),
  studentId: text("student_id").notNull(),
  programId: text("program_id").notNull(),
  status: applicationStatusEnum("status").notNull().default("researching"),
  notes: text("notes"),
  deadline: date("deadline"),
  appliedAt: timestamp("applied_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertApplicationSchema = createInsertSchema(applicationsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applicationsTable.$inferSelect;
