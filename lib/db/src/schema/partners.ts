import { pgTable, text, real, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const partnerTypeEnum = pgEnum("partner_type", ["bank", "nbfc", "university", "employer", "csp", "other"]);
export const partnerStatusEnum = pgEnum("partner_status", ["active", "inactive", "pending"]);

export const partnersTable = pgTable("partners", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  consultantId: text("consultant_id").notNull(),
  name: text("name").notNull(),
  type: partnerTypeEnum("type").notNull().default("other"),
  contactName: text("contact_name"),
  contactEmail: text("contact_email"),
  website: text("website"),
  commissionRate: real("commission_rate"),
  status: partnerStatusEnum("status").notNull().default("pending"),
  notes: text("notes"),
  logoUrl: text("logo_url"),
  country: text("country"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertPartnerSchema = createInsertSchema(partnersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPartner = z.infer<typeof insertPartnerSchema>;
export type Partner = typeof partnersTable.$inferSelect;
