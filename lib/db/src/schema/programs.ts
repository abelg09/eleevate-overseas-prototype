import { pgTable, text, integer, real, date, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const degreeEnum = pgEnum("degree", ["bachelor", "master", "phd", "diploma", "certificate", "mba"]);
export const durationUnitEnum = pgEnum("duration_unit", ["months", "years"]);

export const programsTable = pgTable("programs", {
  id: text("id").primaryKey().default("gen_random_uuid()"),
  universityId: text("university_id").notNull(),
  name: text("name").notNull(),
  degree: degreeEnum("degree").notNull(),
  field: text("field").notNull(),
  duration: integer("duration"),
  durationUnit: durationUnitEnum("duration_unit").default("years"),
  tuitionUsd: integer("tuition_usd"),
  applicationDeadline: date("application_deadline"),
  startDate: date("start_date"),
  ieltsRequirement: real("ielts_requirement"),
  toeflRequirement: real("toefl_requirement"),
  gpaRequirement: real("gpa_requirement"),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertProgramSchema = createInsertSchema(programsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertProgram = z.infer<typeof insertProgramSchema>;
export type Program = typeof programsTable.$inferSelect;
