import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { usersTable, consultantsTable, teamMembersTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod/v4";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";

const router = Router();

async function getConsultantId(clerkUserId: string): Promise<string | null> {
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, clerkUserId) });
  if (!user) return null;
  const consultant = await db.query.consultantsTable.findFirst({ where: eq(consultantsTable.userId, user.id) });
  return consultant?.id ?? null;
}

const inviteSchema = z.object({
  inviteEmail: z.string().email(),
  role: z.enum(["admin", "senior_counsellor", "junior_counsellor"]).optional(),
});

const updateMemberSchema = z.object({
  role: z.enum(["admin", "senior_counsellor", "junior_counsellor"]).optional(),
  status: z.enum(["pending", "active", "removed"]).optional(),
});

// GET /consultant/team
router.get("/consultant/team", requireAuth, requireRole("consultant"), async (req: Request, res: Response): Promise<void> => {
  try {
    const consultantId = await getConsultantId(req.clerkUserId!);
    if (!consultantId) { res.status(404).json({ error: "Consultant not found" }); return; }
    const members = await db.select().from(teamMembersTable)
      .where(eq(teamMembersTable.consultantId, consultantId))
      .orderBy(desc(teamMembersTable.createdAt));
    res.json({ data: members, total: members.length });
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// POST /consultant/team — invite member
router.post("/consultant/team", requireAuth, requireRole("consultant"), async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = inviteSchema.safeParse(req.body);
    if (!parse.success) { res.status(400).json({ error: "Validation error", details: parse.error.issues }); return; }
    const consultantId = await getConsultantId(req.clerkUserId!);
    if (!consultantId) { res.status(404).json({ error: "Consultant not found" }); return; }
    const [member] = await db.insert(teamMembersTable).values({
      consultantId,
      inviteEmail: parse.data.inviteEmail,
      role: parse.data.role ?? "junior_counsellor",
      status: "pending",
    }).returning();
    res.status(201).json(member);
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// PATCH /consultant/team/:id
router.patch("/consultant/team/:id", requireAuth, requireRole("consultant"), async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const parse = updateMemberSchema.safeParse(req.body);
    if (!parse.success) { res.status(400).json({ error: "Validation error", details: parse.error.issues }); return; }
    const consultantId = await getConsultantId(req.clerkUserId!);
    if (!consultantId) { res.status(404).json({ error: "Consultant not found" }); return; }
    const [updated] = await db.update(teamMembersTable)
      .set({ ...parse.data, updatedAt: new Date() })
      .where(and(eq(teamMembersTable.id, req.params.id), eq(teamMembersTable.consultantId, consultantId)))
      .returning();
    if (!updated) { res.status(404).json({ error: "Team member not found" }); return; }
    res.json(updated);
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// DELETE /consultant/team/:id
router.delete("/consultant/team/:id", requireAuth, requireRole("consultant"), async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const consultantId = await getConsultantId(req.clerkUserId!);
    if (!consultantId) { res.status(404).json({ error: "Consultant not found" }); return; }
    const [deleted] = await db.delete(teamMembersTable)
      .where(and(eq(teamMembersTable.id, req.params.id), eq(teamMembersTable.consultantId, consultantId)))
      .returning();
    if (!deleted) { res.status(404).json({ error: "Team member not found" }); return; }
    res.status(204).send();
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

export default router;
