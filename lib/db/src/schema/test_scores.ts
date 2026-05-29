import { pgTable, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const testScoresTable = pgTable("test_scores", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  studentId: text("student_id").notNull(),
  testType: text("test_type").notNull(),
  score: real("score").notNull(),
  takenAt: timestamp("taken_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTestScoreSchema = createInsertSchema(testScoresTable).omit({ id: true, createdAt: true });
export type InsertTestScore = z.infer<typeof insertTestScoreSchema>;
export type TestScore = typeof testScoresTable.$inferSelect;
