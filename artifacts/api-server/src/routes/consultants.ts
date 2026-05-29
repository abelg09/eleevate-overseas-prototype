import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { usersTable, consultantsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import { z } from "zod/v4";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";

const router = Router();

const updateConsultantSchema = z.object({
  agencyName: z.string().optional(),
  licenseNumber: z.string().optional(),
  specializations: z.array(z.string()).optional(),
  countriesServed: z.array(z.string()).optional(),
  yearsExperience: z.number().min(0).max(50).optional(),
  bio: z.string().max(2000).optional(),
});

async function getConsultantByClerkId(clerkId: string) {
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, clerkId) });
  if (!user) return null;
  const consultant = await db.query.consultantsTable.findFirst({ where: eq(consultantsTable.userId, user.id) });
  return { user, consultant };
}

// GET /api/consultants — public: list consultants
router.get("/consultants", async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const data = await db.select().from(consultantsTable).limit(limit).offset(offset);
    const [{ total }] = await db.select({ total: count() }).from(consultantsTable);
    res.json({ data, total: Number(total), page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/consultants/me — consultant only
router.get("/consultants/me", requireAuth, requireRole("consultant"), async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await getConsultantByClerkId(req.clerkUserId!);
    if (!result?.consultant) {
      res.status(404).json({ error: "Consultant profile not found" });
      return;
    }
    res.json(result.consultant);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/consultants/me — consultant only
router.put("/consultants/me", requireAuth, requireRole("consultant"), async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = updateConsultantSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: "Validation error", details: parse.error.issues });
      return;
    }
    const result = await getConsultantByClerkId(req.clerkUserId!);
    if (!result?.user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (!result.consultant) {
      const [created] = await db.insert(consultantsTable).values({
        id: crypto.randomUUID(),
        userId: result.user.id,
        ...parse.data,
      }).returning();
      res.json(created);
      return;
    }

    const [updated] = await db.update(consultantsTable)
      .set({ ...parse.data, updatedAt: new Date() })
      .where(eq(consultantsTable.userId, result.user.id))
      .returning();
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/consultants/me/pipeline-summary — consultant only
router.get("/consultants/me/pipeline-summary", requireAuth, requireRole("consultant"), async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await getConsultantByClerkId(req.clerkUserId!);
    if (!result?.user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({
      totalClients: result.consultant?.totalClients ?? 0,
      activeApplications: 0,
      newLeadsToday: 0,
      pendingDocumentReviews: 0,
      offerReceived: 0,
      enrolledThisYear: 0,
      recentActivity: [
        { id: "1", type: "welcome", message: "Welcome! Start by adding your first client.", timestamp: new Date().toISOString() },
      ],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/consultants/:id — public: get consultant by ID
router.get("/consultants/:id", async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const consultant = await db.query.consultantsTable.findFirst({
      where: eq(consultantsTable.id, req.params.id),
    });
    if (!consultant) {
      res.status(404).json({ error: "Consultant not found" });
      return;
    }
    res.json(consultant);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/consultants/:id — admin or self
router.patch("/consultants/:id", requireAuth, async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const parse = updateConsultantSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: "Validation error", details: parse.error.issues });
      return;
    }
    const callerResult = await getConsultantByClerkId(req.clerkUserId!);
    if (!callerResult?.user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const callerUser = callerResult.user;

    const target = await db.query.consultantsTable.findFirst({
      where: eq(consultantsTable.id, req.params.id),
    });
    if (!target) {
      res.status(404).json({ error: "Consultant not found" });
      return;
    }

    // Allow if admin or if the consultant is editing their own profile
    const isSelf = target.userId === callerUser.id;
    const isAdmin = callerUser.role === "admin";
    if (!isSelf && !isAdmin) {
      res.status(403).json({ error: "Forbidden: must be admin or the consultant themselves" });
      return;
    }

    const [updated] = await db.update(consultantsTable)
      .set({ ...parse.data, updatedAt: new Date() })
      .where(eq(consultantsTable.id, req.params.id))
      .returning();
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/consultants/:id — admin only
router.delete("/consultants/:id", requireAuth, requireRole("admin"), async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const [deleted] = await db.delete(consultantsTable)
      .where(eq(consultantsTable.id, req.params.id))
      .returning();
    if (!deleted) {
      res.status(404).json({ error: "Consultant not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
