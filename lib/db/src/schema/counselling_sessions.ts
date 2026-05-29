import { pgTable, text, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sessionStatusEnum = pgEnum("session_status", [
  "scheduled", "completed", "cancelled", "no_show"
]);

export const counsellingSessionsTable = pgTable("counselling_sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  consultantId: text("consultant_id").notNull(),
  studentName: text("student_name").notNull(),
  studentEmail: text("student_email").notNull(),
  title: text("title").notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(60),
  meetLink: text("meet_link"),
  preCallNotes: text("pre_call_notes"),
  postCallNotes: text("post_call_notes"),
  status: sessionStatusEnum("status").notNull().default("scheduled"),
  intakeForm: text("intake_form"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCounsellingSessionSchema = createInsertSchema(counsellingSessionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCounsellingSession = z.infer<typeof insertCounsellingSessionSchema>;
export type CounsellingSession = typeof counsellingSessionsTable.$inferSelect;
