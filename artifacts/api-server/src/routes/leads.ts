import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { usersTable, consultantsTable, leadsTable, leadActivitiesTable } from "@workspace/db";
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

const createLeadSchema = z.object({
  studentName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  status: z.enum(["new", "contacted", "qualified", "active_client", "enrolled", "lost"]).optional(),
  source: z.enum(["website", "referral", "social_media", "event", "agency", "other"]).optional(),
  targetCountry: z.string().optional(),
  targetDegree: z.string().optional(),
  notes: z.string().optional(),
  followUpAt: z.string().optional(),
});

const updateLeadSchema = createLeadSchema.partial();

const addActivitySchema = z.object({
  type: z.string().min(1),
  message: z.string().min(1),
});

// GET /consultant/leads
router.get("/consultant/leads", requireAuth, requireRole("consultant"), async (req: Request, res: Response): Promise<void> => {
  try {
    const consultantId = await getConsultantId(req.clerkUserId!);
    if (!consultantId) { res.status(404).json({ error: "Consultant not found" }); return; }
    const leads = await db.select().from(leadsTable)
      .where(eq(leadsTable.consultantId, consultantId))
      .orderBy(desc(leadsTable.createdAt));
    res.json({ data: leads, total: leads.length });
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// POST /consultant/leads
router.post("/consultant/leads", requireAuth, requireRole("consultant"), async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = createLeadSchema.safeParse(req.body);
    if (!parse.success) { res.status(400).json({ error: "Validation error", details: parse.error.issues }); return; }
    const consultantId = await getConsultantId(req.clerkUserId!);
    if (!consultantId) { res.status(404).json({ error: "Consultant not found" }); return; }
    const [lead] = await db.insert(leadsTable).values({
      ...parse.data,
      consultantId,
      followUpAt: parse.data.followUpAt ? new Date(parse.data.followUpAt) : undefined,
    }).returning();
    await db.insert(leadActivitiesTable).values({
      leadId: lead.id,
      type: "created",
      message: `Lead created for ${lead.studentName}`,
    });
    res.status(201).json(lead);
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /consultant/leads/:id
router.get("/consultant/leads/:id", requireAuth, requireRole("consultant"), async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const consultantId = await getConsultantId(req.clerkUserId!);
    if (!consultantId) { res.status(404).json({ error: "Consultant not found" }); return; }
    const lead = await db.query.leadsTable.findFirst({
      where: and(eq(leadsTable.id, req.params.id), eq(leadsTable.consultantId, consultantId)),
    });
    if (!lead) { res.status(404).json({ error: "Lead not found" }); return; }
    const activities = await db.select().from(leadActivitiesTable)
      .where(eq(leadActivitiesTable.leadId, lead.id))
      .orderBy(desc(leadActivitiesTable.createdAt));
    res.json({ ...lead, activities });
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// PATCH /consultant/leads/:id
router.patch("/consultant/leads/:id", requireAuth, requireRole("consultant"), async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const parse = updateLeadSchema.safeParse(req.body);
    if (!parse.success) { res.status(400).json({ error: "Validation error", details: parse.error.issues }); return; }
    const consultantId = await getConsultantId(req.clerkUserId!);
    if (!consultantId) { res.status(404).json({ error: "Consultant not found" }); return; }
    const [updated] = await db.update(leadsTable)
      .set({ ...parse.data, followUpAt: parse.data.followUpAt ? new Date(parse.data.followUpAt) : undefined, updatedAt: new Date() })
      .where(and(eq(leadsTable.id, req.params.id), eq(leadsTable.consultantId, consultantId)))
      .returning();
    if (!updated) { res.status(404).json({ error: "Lead not found" }); return; }
    if (parse.data.status) {
      await db.insert(leadActivitiesTable).values({
        leadId: updated.id,
        type: "status_change",
        message: `Status changed to ${parse.data.status}`,
      });
    }
    res.json(updated);
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// DELETE /consultant/leads/:id
router.delete("/consultant/leads/:id", requireAuth, requireRole("consultant"), async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const consultantId = await getConsultantId(req.clerkUserId!);
    if (!consultantId) { res.status(404).json({ error: "Consultant not found" }); return; }
    // Verify ownership FIRST before touching any child rows
    const lead = await db.query.leadsTable.findFirst({
      where: and(eq(leadsTable.id, req.params.id), eq(leadsTable.consultantId, consultantId)),
    });
    if (!lead) { res.status(404).json({ error: "Lead not found" }); return; }
    // Now safe to delete child activities and then the lead
    await db.delete(leadActivitiesTable).where(eq(leadActivitiesTable.leadId, lead.id));
    await db.delete(leadsTable).where(eq(leadsTable.id, lead.id));
    res.status(204).send();
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// POST /consultant/leads/:id/activity
router.post("/consultant/leads/:id/activity", requireAuth, requireRole("consultant"), async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const parse = addActivitySchema.safeParse(req.body);
    if (!parse.success) { res.status(400).json({ error: "Validation error", details: parse.error.issues }); return; }
    const consultantId = await getConsultantId(req.clerkUserId!);
    if (!consultantId) { res.status(404).json({ error: "Consultant not found" }); return; }
    const lead = await db.query.leadsTable.findFirst({
      where: and(eq(leadsTable.id, req.params.id), eq(leadsTable.consultantId, consultantId)),
    });
    if (!lead) { res.status(404).json({ error: "Lead not found" }); return; }
    const [activity] = await db.insert(leadActivitiesTable).values({
      leadId: lead.id,
      ...parse.data,
    }).returning();
    res.status(201).json(activity);
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

export default router;
