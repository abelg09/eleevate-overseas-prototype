import { pgTable, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const teamRoleEnum = pgEnum("team_role", ["admin", "senior_counsellor", "junior_counsellor"]);
export const teamMemberStatusEnum = pgEnum("team_member_status", ["pending", "active", "removed"]);

export const teamMembersTable = pgTable("team_members", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  consultantId: text("consultant_id").notNull(),
  inviteEmail: text("invite_email").notNull(),
  memberUserId: text("member_user_id"),
  role: teamRoleEnum("role").notNull().default("junior_counsellor"),
  status: teamMemberStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertTeamMemberSchema = createInsertSchema(teamMembersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type TeamMember = typeof teamMembersTable.$inferSelect;
