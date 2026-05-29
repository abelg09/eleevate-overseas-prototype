import { pgTable, text, real, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const studyLevelEnum = pgEnum("study_level", [
  "undergraduate", "postgraduate", "phd", "diploma", "certificate"
]);

export const studentsTable = pgTable("students", {
  id: text("id").primaryKey().default("gen_random_uuid()"),
  userId: text("user_id").notNull().unique(),
  targetCountries: text("target_countries").array(),
  studyLevel: studyLevelEnum("study_level"),
  budget: real("budget"),
  gpa: real("gpa"),
  ieltsScore: real("ielts_score"),
  toeflScore: real("toefl_score"),
  greScore: real("gre_score"),
  gmatScore: real("gmat_score"),
  preferredIntake: text("preferred_intake"),
  workExperience: integer("work_experience"),
  nationality: text("nationality"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertStudentSchema = createInsertSchema(studentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof studentsTable.$inferSelect;
