import { pgTable, text, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const consultantsTable = pgTable("consultants", {
  id: text("id").primaryKey().default("gen_random_uuid()"),
  userId: text("user_id").notNull().unique(),
  agencyName: text("agency_name"),
  licenseNumber: text("license_number"),
  specializations: text("specializations").array(),
  countriesServed: text("countries_served").array(),
  yearsExperience: integer("years_experience"),
  bio: text("bio"),
  rating: real("rating"),
  totalClients: integer("total_clients").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertConsultantSchema = createInsertSchema(consultantsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertConsultant = z.infer<typeof insertConsultantSchema>;
export type Consultant = typeof consultantsTable.$inferSelect;
