import { pgTable, text, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const universitiesTable = pgTable("universities", {
  id: text("id").primaryKey().default("gen_random_uuid()"),
  name: text("name").notNull(),
  country: text("country").notNull(),
  city: text("city").notNull(),
  ranking: integer("ranking"),
  logoUrl: text("logo_url"),
  imageUrl: text("image_url"),
  website: text("website"),
  description: text("description"),
  acceptanceRate: real("acceptance_rate"),
  avgTuitionUsd: integer("avg_tuition_usd"),
  featured: boolean("featured").default(false),
  programCount: integer("program_count").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUniversitySchema = createInsertSchema(universitiesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUniversity = z.infer<typeof insertUniversitySchema>;
export type University = typeof universitiesTable.$inferSelect;
