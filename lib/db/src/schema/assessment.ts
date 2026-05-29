import { pgTable, text, timestamp, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const psychometricSessionsTable = pgTable("psychometric_sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  answers: jsonb("answers").notNull().default({}),
  scores: jsonb("scores").notNull().default({}),
  fieldRecommendations: jsonb("field_recommendations").notNull().default([]),
  careerRecommendations: jsonb("career_recommendations").notNull().default([]),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const mentorshipStatusEnum = pgEnum("mentorship_status", ["pending", "accepted", "rejected"]);

export const mentorshipRequestsTable = pgTable("mentorship_requests", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  studentId: text("student_id").notNull(),
  mentorName: text("mentor_name").notNull(),
  mentorEmail: text("mentor_email").notNull(),
  mentorField: text("mentor_field"),
  message: text("message").notNull(),
  status: mentorshipStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPsychometricSessionSchema = createInsertSchema(psychometricSessionsTable).omit({ id: true, createdAt: true });
export const insertMentorshipRequestSchema = createInsertSchema(mentorshipRequestsTable).omit({ id: true, createdAt: true, updatedAt: true });

export type PsychometricSession = typeof psychometricSessionsTable.$inferSelect;
export type MentorshipRequest = typeof mentorshipRequestsTable.$inferSelect;
export type InsertPsychometricSession = z.infer<typeof insertPsychometricSessionSchema>;
