import { pgTable, text, integer, boolean, timestamp, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const courseTypeEnum = pgEnum("course_type", ["student", "consultant"]);
export const courseLevelEnum = pgEnum("course_level", ["beginner", "intermediate", "advanced"]);
export const courseStatusEnum = pgEnum("course_status", ["draft", "published"]);

export const coursesTable = pgTable("courses", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description"),
  type: courseTypeEnum("type").notNull().default("student"),
  level: courseLevelEnum("level").notNull().default("beginner"),
  examType: text("exam_type"),
  category: text("category"),
  thumbnailUrl: text("thumbnail_url"),
  createdById: text("created_by_id").notNull(),
  status: courseStatusEnum("status").notNull().default("draft"),
  certificateEnabled: boolean("certificate_enabled").notNull().default(false),
  durationMinutes: integer("duration_minutes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const courseChaptersTable = pgTable("course_chapters", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  courseId: text("course_id").notNull(),
  title: text("title").notNull(),
  videoUrl: text("video_url"),
  content: text("content"),
  quizQuestions: jsonb("quiz_questions"),
  orderIndex: integer("order_index").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const courseEnrollmentsTable = pgTable("course_enrollments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  courseId: text("course_id").notNull(),
  userId: text("user_id").notNull(),
  completedChapterIds: jsonb("completed_chapter_ids").notNull().default([]),
  completedAt: timestamp("completed_at"),
  certificateIssued: boolean("certificate_issued").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCourseSchema = createInsertSchema(coursesTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertChapterSchema = createInsertSchema(courseChaptersTable).omit({ id: true, createdAt: true });
export const insertEnrollmentSchema = createInsertSchema(courseEnrollmentsTable).omit({ id: true, createdAt: true });

export type Course = typeof coursesTable.$inferSelect;
export type CourseChapter = typeof courseChaptersTable.$inferSelect;
export type CourseEnrollment = typeof courseEnrollmentsTable.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
