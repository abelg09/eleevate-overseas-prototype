import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const brandingSettingsTable = pgTable("branding_settings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  consultantId: text("consultant_id").notNull().unique(),
  agencyName: text("agency_name"),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").default("#2563eb"),
  accentColor: text("accent_color").default("#8b5cf6"),
  subdomain: text("subdomain"),
  tagline: text("tagline"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBrandingSettingsSchema = createInsertSchema(brandingSettingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBrandingSettings = z.infer<typeof insertBrandingSettingsSchema>;
export type BrandingSettings = typeof brandingSettingsTable.$inferSelect;
