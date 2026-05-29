import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const documentTypeEnum = pgEnum("document_type", [
  "sop", "lor", "transcript", "passport", "financial_proof",
  "resume", "english_test", "other"
]);

export const documentStatusEnum = pgEnum("document_status", [
  "pending", "approved", "rejected", "under_review"
]);

export const documentsTable = pgTable("documents", {
  id: text("id").primaryKey().default("gen_random_uuid()"),
  userId: text("user_id").notNull(),
  applicationId: text("application_id"),
  type: documentTypeEnum("type").notNull(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  status: documentStatusEnum("status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDocumentSchema = createInsertSchema(documentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documentsTable.$inferSelect;
