import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { usersTable, consultantsTable, counsellingSessionsTable } from "@workspace/db";
import { eq, and, gte, desc } from "drizzle-orm";
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

function generateMeetLink(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const seg = (n: number) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `https://meet.google.com/${seg(3)}-${seg(4)}-${seg(3)}`;
}

const createSessionSchema = z.object({
  studentName: z.string().min(1),
  studentEmail: z.string().email(),
  title: z.string().min(1),
  scheduledAt: z.string(),
  durationMinutes: z.number().int().min(15).max(180).optional(),
  preCallNotes: z.string().optional(),
  intakeForm: z.string().optional(),
});

const updateSessionSchema = z.object({
  status: z.enum(["scheduled", "completed", "cancelled", "no_show"]).optional(),
  postCallNotes: z.string().optional(),
  preCallNotes: z.string().optional(),
  meetLink: z.string().optional(),
  scheduledAt: z.string().optional(),
});

// GET /consultant/sessions
router.get("/consultant/sessions", requireAuth, requireRole("consultant"), async (req: Request, res: Response): Promise<void> => {
  try {
    const consultantId = await getConsultantId(req.clerkUserId!);
    if (!consultantId) { res.status(404).json({ error: "Consultant not found" }); return; }
    const sessions = await db.select().from(counsellingSessionsTable)
      .where(eq(counsellingSessionsTable.consultantId, consultantId))
      .orderBy(desc(counsellingSessionsTable.scheduledAt));
    res.json({ data: sessions, total: sessions.length });
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// POST /consultant/sessions
router.post("/consultant/sessions", requireAuth, requireRole("consultant"), async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = createSessionSchema.safeParse(req.body);
    if (!parse.success) { res.status(400).json({ error: "Validation error", details: parse.error.issues }); return; }
    const consultantId = await getConsultantId(req.clerkUserId!);
    if (!consultantId) { res.status(404).json({ error: "Consultant not found" }); return; }
    const [session] = await db.insert(counsellingSessionsTable).values({
      ...parse.data,
      consultantId,
      scheduledAt: new Date(parse.data.scheduledAt),
      meetLink: generateMeetLink(),
    }).returning();
    res.status(201).json(session);
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /consultant/sessions/:id
router.get("/consultant/sessions/:id", requireAuth, requireRole("consultant"), async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const consultantId = await getConsultantId(req.clerkUserId!);
    if (!consultantId) { res.status(404).json({ error: "Consultant not found" }); return; }
    const session = await db.query.counsellingSessionsTable.findFirst({
      where: and(eq(counsellingSessionsTable.id, req.params.id), eq(counsellingSessionsTable.consultantId, consultantId)),
    });
    if (!session) { res.status(404).json({ error: "Session not found" }); return; }
    res.json(session);
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// PATCH /consultant/sessions/:id
router.patch("/consultant/sessions/:id", requireAuth, requireRole("consultant"), async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const parse = updateSessionSchema.safeParse(req.body);
    if (!parse.success) { res.status(400).json({ error: "Validation error", details: parse.error.issues }); return; }
    const consultantId = await getConsultantId(req.clerkUserId!);
    if (!consultantId) { res.status(404).json({ error: "Consultant not found" }); return; }
    const [updated] = await db.update(counsellingSessionsTable)
      .set({ ...parse.data, scheduledAt: parse.data.scheduledAt ? new Date(parse.data.scheduledAt) : undefined, updatedAt: new Date() })
      .where(and(eq(counsellingSessionsTable.id, req.params.id), eq(counsellingSessionsTable.consultantId, consultantId)))
      .returning();
    if (!updated) { res.status(404).json({ error: "Session not found" }); return; }
    res.json(updated);
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// DELETE /consultant/sessions/:id
router.delete("/consultant/sessions/:id", requireAuth, requireRole("consultant"), async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const consultantId = await getConsultantId(req.clerkUserId!);
    if (!consultantId) { res.status(404).json({ error: "Consultant not found" }); return; }
    const [deleted] = await db.delete(counsellingSessionsTable)
      .where(and(eq(counsellingSessionsTable.id, req.params.id), eq(counsellingSessionsTable.consultantId, consultantId)))
      .returning();
    if (!deleted) { res.status(404).json({ error: "Session not found" }); return; }
    res.status(204).send();
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

export default router;
