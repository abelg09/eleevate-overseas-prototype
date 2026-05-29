import { pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const shortlistsTable = pgTable("shortlists", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull(),
  universityId: text("university_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [unique().on(t.userId, t.universityId)]);

export const insertShortlistSchema = createInsertSchema(shortlistsTable).omit({ id: true, createdAt: true });
export type InsertShortlist = z.infer<typeof insertShortlistSchema>;
export type Shortlist = typeof shortlistsTable.$inferSelect;
