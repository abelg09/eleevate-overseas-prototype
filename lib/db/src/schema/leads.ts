import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const leadStatusEnum = pgEnum("lead_status", [
  "new", "contacted", "qualified", "active_client", "enrolled", "lost"
]);

export const leadSourceEnum = pgEnum("lead_source", [
  "website", "referral", "social_media", "event", "agency", "other"
]);

export const leadsTable = pgTable("leads", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  consultantId: text("consultant_id").notNull(),
  studentName: text("student_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  status: leadStatusEnum("status").notNull().default("new"),
  source: leadSourceEnum("source").notNull().default("other"),
  targetCountry: text("target_country"),
  targetDegree: text("target_degree"),
  notes: text("notes"),
  followUpAt: timestamp("follow_up_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const leadActivitiesTable = pgTable("lead_activities", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  leadId: text("lead_id").notNull(),
  type: text("type").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLeadSchema = createInsertSchema(leadsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLeadActivitySchema = createInsertSchema(leadActivitiesTable).omit({ id: true, createdAt: true });
export type InsertLead = z.infer<typeof insertLeadSchema>;
export type InsertLeadActivity = z.infer<typeof insertLeadActivitySchema>;
export type Lead = typeof leadsTable.$inferSelect;
export type LeadActivity = typeof leadActivitiesTable.$inferSelect;
