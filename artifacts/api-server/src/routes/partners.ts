import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { usersTable, consultantsTable, partnersTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod/v4";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";

const router = Router();

async function getConsultantId(clerkUserId: string): Promise<string | null> {
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, clerkUserId) });
  if (!user) return null;
  if (user.role === "admin") {
    // Admins use a shared "admin" sentinel so partners scoped to them remain separate
    return `admin:${user.id}`;
  }
  const consultant = await db.query.consultantsTable.findFirst({ where: eq(consultantsTable.userId, user.id) });
  return consultant?.id ?? null;
}

const createPartnerSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["bank", "nbfc", "university", "employer", "csp", "other"]).optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional(),
  website: z.string().optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  status: z.enum(["active", "inactive", "pending"]).optional(),
  notes: z.string().optional(),
  logoUrl: z.string().optional(),
  country: z.string().optional(),
});

const updatePartnerSchema = createPartnerSchema.partial();

// GET /api/partners — scoped to this consultant's partners only
router.get("/partners", requireAuth, requireRole("consultant", "admin"), async (req: Request, res: Response): Promise<void> => {
  try {
    const consultantId = await getConsultantId(req.clerkUserId!);
    if (!consultantId) { res.status(404).json({ error: "Consultant profile not found" }); return; }
    const partners = await db.select().from(partnersTable)
      .where(eq(partnersTable.consultantId, consultantId))
      .orderBy(desc(partnersTable.createdAt));
    res.json({ data: partners, total: partners.length });
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// POST /api/partners — creates partner owned by this consultant
router.post("/partners", requireAuth, requireRole("consultant", "admin"), async (req: Request, res: Response): Promise<void> => {
  try {
    const consultantId = await getConsultantId(req.clerkUserId!);
    if (!consultantId) { res.status(404).json({ error: "Consultant profile not found" }); return; }
    const parse = createPartnerSchema.safeParse(req.body);
    if (!parse.success) { res.status(400).json({ error: "Validation error", details: parse.error.issues }); return; }
    const [partner] = await db.insert(partnersTable).values({ ...parse.data, consultantId }).returning();
    res.status(201).json(partner);
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/partners/:id — ownership enforced
router.get("/partners/:id", requireAuth, requireRole("consultant", "admin"), async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const consultantId = await getConsultantId(req.clerkUserId!);
    if (!consultantId) { res.status(404).json({ error: "Consultant profile not found" }); return; }
    const partner = await db.query.partnersTable.findFirst({
      where: and(eq(partnersTable.id, req.params.id), eq(partnersTable.consultantId, consultantId)),
    });
    if (!partner) { res.status(404).json({ error: "Partner not found" }); return; }
    res.json(partner);
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// PATCH /api/partners/:id — ownership enforced
router.patch("/partners/:id", requireAuth, requireRole("consultant", "admin"), async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const consultantId = await getConsultantId(req.clerkUserId!);
    if (!consultantId) { res.status(404).json({ error: "Consultant profile not found" }); return; }
    const parse = updatePartnerSchema.safeParse(req.body);
    if (!parse.success) { res.status(400).json({ error: "Validation error", details: parse.error.issues }); return; }
    const [updated] = await db.update(partnersTable)
      .set({ ...parse.data, updatedAt: new Date() })
      .where(and(eq(partnersTable.id, req.params.id), eq(partnersTable.consultantId, consultantId)))
      .returning();
    if (!updated) { res.status(404).json({ error: "Partner not found" }); return; }
    res.json(updated);
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// DELETE /api/partners/:id — ownership enforced
router.delete("/partners/:id", requireAuth, requireRole("consultant", "admin"), async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const consultantId = await getConsultantId(req.clerkUserId!);
    if (!consultantId) { res.status(404).json({ error: "Consultant profile not found" }); return; }
    const [deleted] = await db.delete(partnersTable)
      .where(and(eq(partnersTable.id, req.params.id), eq(partnersTable.consultantId, consultantId)))
      .returning();
    if (!deleted) { res.status(404).json({ error: "Partner not found" }); return; }
    res.status(204).send();
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

export default router;
