import { pgTable, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sopTypeEnum = pgEnum("sop_type", ["sop", "lor", "resume"]);
export const sopStatusEnum = pgEnum("sop_status", ["draft", "review", "final"]);

export const sopDocumentsTable = pgTable("sop_documents", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  consultantId: text("consultant_id"),
  type: sopTypeEnum("type").notNull().default("sop"),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  targetUniversity: text("target_university"),
  targetProgram: text("target_program"),
  version: integer("version").notNull().default(1),
  status: sopStatusEnum("status").notNull().default("draft"),
  aiPromptData: text("ai_prompt_data"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertSopDocumentSchema = createInsertSchema(sopDocumentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSopDocument = z.infer<typeof insertSopDocumentSchema>;
export type SopDocument = typeof sopDocumentsTable.$inferSelect;
