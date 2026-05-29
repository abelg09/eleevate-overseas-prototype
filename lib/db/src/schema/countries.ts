import { pgTable, text, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const countriesTable = pgTable("countries", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  flagEmoji: text("flag_emoji"),
  continent: text("continent").notNull(),
  currency: text("currency"),
  visaInfo: text("visa_info"),
  avgCostOfLivingUsd: integer("avg_cost_of_living_usd"),
  popularCities: text("popular_cities").array(),
  universityCount: integer("university_count").default(0),
});

export const insertCountrySchema = createInsertSchema(countriesTable);
export type InsertCountry = z.infer<typeof insertCountrySchema>;
export type Country = typeof countriesTable.$inferSelect;
