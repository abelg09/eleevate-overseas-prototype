import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { usersTable, consultantsTable, brandingSettingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
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

const brandingSchema = z.object({
  agencyName: z.string().optional(),
  logoUrl: z.string().optional(),
  primaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  subdomain: z.string().regex(/^[a-z0-9-]{3,30}$/).optional(),
  tagline: z.string().max(200).optional(),
});

// GET /consultant/branding
router.get("/consultant/branding", requireAuth, requireRole("consultant"), async (req: Request, res: Response): Promise<void> => {
  try {
    const consultantId = await getConsultantId(req.clerkUserId!);
    if (!consultantId) { res.status(404).json({ error: "Consultant not found" }); return; }
    const settings = await db.query.brandingSettingsTable.findFirst({
      where: eq(brandingSettingsTable.consultantId, consultantId),
    });
    res.json(settings ?? { consultantId, primaryColor: "#2563eb", accentColor: "#8b5cf6" });
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// PUT /consultant/branding
router.put("/consultant/branding", requireAuth, requireRole("consultant"), async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = brandingSchema.safeParse(req.body);
    if (!parse.success) { res.status(400).json({ error: "Validation error", details: parse.error.issues }); return; }
    const consultantId = await getConsultantId(req.clerkUserId!);
    if (!consultantId) { res.status(404).json({ error: "Consultant not found" }); return; }
    const existing = await db.query.brandingSettingsTable.findFirst({
      where: eq(brandingSettingsTable.consultantId, consultantId),
    });
    let result;
    if (existing) {
      [result] = await db.update(brandingSettingsTable)
        .set({ ...parse.data, updatedAt: new Date() })
        .where(eq(brandingSettingsTable.consultantId, consultantId))
        .returning();
    } else {
      [result] = await db.insert(brandingSettingsTable)
        .values({ ...parse.data, consultantId })
        .returning();
    }
    res.json(result);
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

export default router;
