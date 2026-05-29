import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { usersTable, studentsTable, applicationsTable, programsTable, universitiesTable } from "@workspace/db";
import { eq, count, and, desc } from "drizzle-orm";
import { z } from "zod/v4";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";

const router = Router();

const createApplicationSchema = z.object({
  programId: z.string().min(1),
  notes: z.string().optional(),
  deadline: z.string().optional(),
});

const updateApplicationSchema = z.object({
  status: z.enum(["researching", "applied", "under_review", "conditional_offer", "unconditional_offer", "rejected", "accepted", "visa_applied", "visa_approved", "enrolled"]).optional(),
  notes: z.string().optional(),
  deadline: z.string().optional(),
});

const listQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.string().optional(),
});

type ProgramRow = NonNullable<Awaited<ReturnType<typeof db.query.programsTable.findFirst>>>;
type UniversityRow = NonNullable<Awaited<ReturnType<typeof db.query.universitiesTable.findFirst>>>;
type ApplicationRow = typeof applicationsTable.$inferSelect;
type EnrichedApplication = ApplicationRow & { program: (ProgramRow & { university: UniversityRow | undefined }) | null };

async function enrichApplication(app: ApplicationRow): Promise<EnrichedApplication> {
  const program = await db.query.programsTable.findFirst({ where: eq(programsTable.id, app.programId) });
  if (program) {
    const university = await db.query.universitiesTable.findFirst({ where: eq(universitiesTable.id, program.universityId) });
    return { ...app, program: { ...program, university } };
  }
  return { ...app, program: null };
}

async function getStudentId(clerkId: string): Promise<string | null> {
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, clerkId) });
  if (!user) return null;
  const student = await db.query.studentsTable.findFirst({ where: eq(studentsTable.userId, user.id) });
  return student?.id ?? null;
}

async function getOrCreateStudentId(clerkId: string): Promise<string | null> {
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, clerkId) });
  if (!user) return null;
  let student = await db.query.studentsTable.findFirst({ where: eq(studentsTable.userId, user.id) });
  if (!student) {
    const [created] = await db.insert(studentsTable).values({ id: crypto.randomUUID(), userId: user.id }).returning();
    student = created;
  }
  return student.id;
}

// GET /api/applications — student only
router.get("/applications", requireAuth, requireRole("student"), async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = listQuerySchema.safeParse(req.query);
    if (!parse.success) {
      res.status(400).json({ error: "Invalid query params", details: parse.error.issues });
      return;
    }
    const { page, limit, status } = parse.data;
    const offset = (page - 1) * limit;

    const studentId = await getStudentId(req.clerkUserId!);
    if (!studentId) {
      res.json({ data: [], total: 0, page, limit });
      return;
    }

    const conditions = [eq(applicationsTable.studentId, studentId)];
    if (status) conditions.push(eq(applicationsTable.status, status as typeof applicationsTable.status._.data));

    const apps = await db.select().from(applicationsTable)
      .where(and(...conditions))
      .orderBy(desc(applicationsTable.updatedAt))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db.select({ total: count() }).from(applicationsTable).where(and(...conditions));
    const data = await Promise.all(apps.map(enrichApplication));
    res.json({ data, total: Number(total), page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/applications — student only
router.post("/applications", requireAuth, requireRole("student"), async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = createApplicationSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: "Validation error", details: parse.error.issues });
      return;
    }
    const { programId, notes, deadline } = parse.data;

    // Verify program exists
    const program = await db.query.programsTable.findFirst({ where: eq(programsTable.id, programId) });
    if (!program) {
      res.status(404).json({ error: "Program not found" });
      return;
    }

    const studentId = await getOrCreateStudentId(req.clerkUserId!);
    if (!studentId) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const [app] = await db.insert(applicationsTable).values({
      id: crypto.randomUUID(),
      studentId,
      programId,
      status: "researching",
      notes: notes ?? null,
      deadline: deadline ?? null,
    }).returning();

    const enriched = await enrichApplication(app);
    res.status(201).json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/applications/recent — student only, must come BEFORE /:id
router.get("/applications/recent", requireAuth, requireRole("student"), async (req: Request, res: Response): Promise<void> => {
  try {
    const studentId = await getStudentId(req.clerkUserId!);
    if (!studentId) {
      res.json([]);
      return;
    }
    const apps = await db.select().from(applicationsTable)
      .where(eq(applicationsTable.studentId, studentId))
      .orderBy(desc(applicationsTable.updatedAt))
      .limit(5);
    const data = await Promise.all(apps.map(enrichApplication));
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/applications/:id — student only, ownership enforced
router.get("/applications/:id", requireAuth, requireRole("student"), async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const studentId = await getStudentId(req.clerkUserId!);
    const app = await db.query.applicationsTable.findFirst({
      where: eq(applicationsTable.id, req.params.id),
    });
    if (!app) {
      res.status(404).json({ error: "Application not found" });
      return;
    }
    // Ownership check: only the owning student can see this application
    if (app.studentId !== studentId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const enriched = await enrichApplication(app);
    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/applications/:id — student only, ownership enforced
router.patch("/applications/:id", requireAuth, requireRole("student"), async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const parse = updateApplicationSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: "Validation error", details: parse.error.issues });
      return;
    }

    const studentId = await getStudentId(req.clerkUserId!);
    const existing = await db.query.applicationsTable.findFirst({
      where: eq(applicationsTable.id, req.params.id),
    });
    if (!existing) {
      res.status(404).json({ error: "Application not found" });
      return;
    }
    // Ownership check
    if (existing.studentId !== studentId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    const [updated] = await db.update(applicationsTable)
      .set({ ...parse.data, updatedAt: new Date() })
      .where(eq(applicationsTable.id, req.params.id))
      .returning();

    const enriched = await enrichApplication(updated);
    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/applications/:id — student only, ownership enforced
router.delete("/applications/:id", requireAuth, requireRole("student"), async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const studentId = await getStudentId(req.clerkUserId!);
    if (!studentId) {
      res.status(404).json({ error: "Student profile not found" });
      return;
    }
    const existing = await db.query.applicationsTable.findFirst({
      where: eq(applicationsTable.id, req.params.id),
    });
    if (!existing) {
      res.status(404).json({ error: "Application not found" });
      return;
    }
    if (existing.studentId !== studentId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    await db.delete(applicationsTable).where(eq(applicationsTable.id, req.params.id));
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

