import { pgTable, text, timestamp, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const jobTypeEnum = pgEnum("job_type", ["full-time", "part-time", "internship", "contract"]);
export const jobStatusEnum = pgEnum("job_status", ["active", "closed", "draft"]);
export const jobApplicationStatusEnum = pgEnum("job_application_status", ["applied", "reviewing", "shortlisted", "rejected", "hired"]);

export const jobListingsTable = pgTable("job_listings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  company: text("company").notNull(),
  description: text("description").notNull(),
  location: text("location"),
  country: text("country"),
  type: jobTypeEnum("type").notNull().default("full-time"),
  salary: text("salary"),
  skillsRequired: jsonb("skills_required").notNull().default([]),
  status: jobStatusEnum("status").notNull().default("active"),
  expiresAt: timestamp("expires_at"),
  logoUrl: text("logo_url"),
  companyWebsite: text("company_website"),
  postedById: text("posted_by_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const jobApplicationsTable = pgTable("job_applications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  jobId: text("job_id").notNull(),
  userId: text("user_id").notNull(),
  coverLetter: text("cover_letter"),
  resumeUrl: text("resume_url"),
  status: jobApplicationStatusEnum("status").notNull().default("applied"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertJobListingSchema = createInsertSchema(jobListingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertJobApplicationSchema = createInsertSchema(jobApplicationsTable).omit({ id: true, createdAt: true, updatedAt: true });

export type JobListing = typeof jobListingsTable.$inferSelect;
export type JobApplication = typeof jobApplicationsTable.$inferSelect;
export type InsertJobListing = z.infer<typeof insertJobListingSchema>;
