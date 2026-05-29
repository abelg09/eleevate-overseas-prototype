import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { usersTable, consultantsTable, documentsTable, leadsTable } from "@workspace/db";
import { eq, and, desc, inArray } from "drizzle-orm";
import { z } from "zod/v4";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";

async function getConsultantClientUserIds(clerkUserId: string): Promise<string[]> {
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, clerkUserId) });
  if (!user) return [];
  const consultant = await db.query.consultantsTable.findFirst({ where: eq(consultantsTable.userId, user.id) });
  if (!consultant) return [];

  // Collect emails of all leads belonging to this consultant
  const leads = await db.select({ email: leadsTable.email }).from(leadsTable)
    .where(eq(leadsTable.consultantId, consultant.id));
  if (leads.length === 0) return [];

  const clientEmails = leads.map(l => l.email);
  // Resolve to platform user IDs (students who signed up with those emails)
  const clientUsers = await db.select({ id: usersTable.id }).from(usersTable)
    .where(inArray(usersTable.email, clientEmails));
  return clientUsers.map(u => u.id);
}

const router = Router();

const updateDocumentSchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "under_review"]).optional(),
  notes: z.string().max(1000).optional(),
});

const createDocumentSchema = z.object({
  applicationId: z.string().optional(),
  type: z.enum(["sop", "lor", "transcript", "passport", "financial_proof", "resume", "english_test", "other"]),
  name: z.string().min(1).max(255),
  url: z.string().min(1),
  notes: z.string().max(1000).optional(),
});

const listQuerySchema = z.object({
  applicationId: z.string().optional(),
  type: z.string().optional(),
});

async function getUserIdByClerkId(clerkId: string): Promise<string | null> {
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, clerkId) });
  return user?.id ?? null;
}

// ── Consultant Document Review Endpoints ──────────────────────────────────────

// GET /api/consultant/doc-review — scoped to this consultant's registered clients
router.get("/consultant/doc-review", requireAuth, requireRole("consultant"), async (req: Request, res: Response): Promise<void> => {
  try {
    const clientUserIds = await getConsultantClientUserIds(req.clerkUserId!);
    if (clientUserIds.length === 0) { res.json([]); return; }
    const docs = await db.select().from(documentsTable)
      .where(inArray(documentsTable.userId, clientUserIds))
      .orderBy(desc(documentsTable.createdAt));
    res.json(docs);
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// PATCH /api/consultant/doc-review/:id — consultant updates doc status/notes, ownership enforced
router.patch("/consultant/doc-review/:id", requireAuth, requireRole("consultant"), async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const parse = updateDocumentSchema.safeParse(req.body);
    if (!parse.success) { res.status(400).json({ error: "Validation error", details: parse.error.issues }); return; }
    // Verify the document belongs to one of this consultant's registered clients
    const clientUserIds = await getConsultantClientUserIds(req.clerkUserId!);
    const existing = await db.query.documentsTable.findFirst({ where: eq(documentsTable.id, req.params.id) });
    if (!existing) { res.status(404).json({ error: "Document not found" }); return; }
    if (!clientUserIds.includes(existing.userId)) { res.status(403).json({ error: "Forbidden" }); return; }
    const [updated] = await db.update(documentsTable).set(parse.data).where(eq(documentsTable.id, req.params.id)).returning();
    res.json(updated);
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// ── Student-scoped Document Endpoints ─────────────────────────────────────────

// GET /api/documents
router.get("/documents", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = listQuerySchema.safeParse(req.query);
    if (!parse.success) {
      res.status(400).json({ error: "Invalid query params", details: parse.error.issues });
      return;
    }
    const userId = await getUserIdByClerkId(req.clerkUserId!);
    if (!userId) {
      res.json([]);
      return;
    }

    const conditions = [eq(documentsTable.userId, userId)];
    if (parse.data.applicationId) conditions.push(eq(documentsTable.applicationId, parse.data.applicationId));
    if (parse.data.type) conditions.push(eq(documentsTable.type, parse.data.type as typeof documentsTable.type._.data));

    const data = await db.select().from(documentsTable).where(and(...conditions));
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/documents
router.post("/documents", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = createDocumentSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: "Validation error", details: parse.error.issues });
      return;
    }
    const userId = await getUserIdByClerkId(req.clerkUserId!);
    if (!userId) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const [doc] = await db.insert(documentsTable).values({
      id: crypto.randomUUID(),
      userId,
      applicationId: parse.data.applicationId ?? null,
      type: parse.data.type,
      name: parse.data.name,
      url: parse.data.url,
      status: "pending",
      notes: parse.data.notes ?? null,
    }).returning();

    res.status(201).json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/documents/:id — ownership enforced
router.get("/documents/:id", requireAuth, async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const userId = await getUserIdByClerkId(req.clerkUserId!);
    if (!userId) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const doc = await db.query.documentsTable.findFirst({
      where: eq(documentsTable.id, req.params.id),
    });
    if (!doc) {
      res.status(404).json({ error: "Document not found" });
      return;
    }
    if (doc.userId !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    res.json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/documents/:id — ownership enforced
router.patch("/documents/:id", requireAuth, async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const parse = updateDocumentSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: "Validation error", details: parse.error.issues });
      return;
    }
    const userId = await getUserIdByClerkId(req.clerkUserId!);
    if (!userId) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const existing = await db.query.documentsTable.findFirst({
      where: eq(documentsTable.id, req.params.id),
    });
    if (!existing) {
      res.status(404).json({ error: "Document not found" });
      return;
    }
    if (existing.userId !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const [updated] = await db.update(documentsTable)
      .set(parse.data)
      .where(eq(documentsTable.id, req.params.id))
      .returning();
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/documents/:id — ownership enforced
router.delete("/documents/:id", requireAuth, async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const userId = await getUserIdByClerkId(req.clerkUserId!);
    if (!userId) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const existing = await db.query.documentsTable.findFirst({
      where: eq(documentsTable.id, req.params.id),
    });
    if (!existing) {
      res.status(404).json({ error: "Document not found" });
      return;
    }
    // Ownership check: only the owning user can delete
    if (existing.userId !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    await db.delete(documentsTable).where(eq(documentsTable.id, req.params.id));
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
