import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { programsTable, universitiesTable } from "@workspace/db";
import { eq, count, and } from "drizzle-orm";
import { z } from "zod/v4";
import { requireAdmin } from "../middlewares/requireAdmin";

const router = Router();

const listQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  universityId: z.string().optional(),
  degree: z.string().optional(),
});

const degreeValues = ["bachelor", "master", "phd", "diploma", "certificate", "mba"] as const;
const durationUnitValues = ["months", "years"] as const;

const createSchema = z.object({
  universityId: z.string().min(1),
  name: z.string().min(1),
  degree: z.enum(degreeValues),
  field: z.string().min(1),
  duration: z.number().int().positive().optional(),
  durationUnit: z.enum(durationUnitValues).optional(),
  tuitionUsd: z.number().int().min(0).optional(),
  applicationDeadline: z.string().optional(),
  startDate: z.string().optional(),
  ieltsRequirement: z.number().min(0).max(9).optional(),
  toeflRequirement: z.number().min(0).max(120).optional(),
  gpaRequirement: z.number().min(0).max(4).optional(),
  description: z.string().optional(),
});

const updateSchema = createSchema.omit({ universityId: true }).partial();

type ProgramWithUniversity = Awaited<ReturnType<typeof db.query.programsTable.findFirst>> & {
  university?: Awaited<ReturnType<typeof db.query.universitiesTable.findFirst>>;
};

async function enrichWithUniversity(program: NonNullable<Awaited<ReturnType<typeof db.query.programsTable.findFirst>>>): Promise<ProgramWithUniversity> {
  const university = await db.query.universitiesTable.findFirst({
    where: eq(universitiesTable.id, program.universityId),
  });
  return { ...program, university };
}

// GET /api/programs
router.get("/programs", async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = listQuerySchema.safeParse(req.query);
    if (!parse.success) {
      res.status(400).json({ error: "Invalid query params", details: parse.error.issues });
      return;
    }
    const { page, limit, universityId, degree } = parse.data;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (universityId) conditions.push(eq(programsTable.universityId, universityId));
    if (degree) conditions.push(eq(programsTable.degree, degree as typeof programsTable.degree._.data));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const programs = await db.select().from(programsTable).where(where).limit(limit).offset(offset);
    const [{ total }] = await db.select({ total: count() }).from(programsTable).where(where);

    const data = await Promise.all(programs.map(enrichWithUniversity));
    res.json({ data, total: Number(total), page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/programs (admin)
router.post("/programs", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = createSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: "Validation error", details: parse.error.issues });
      return;
    }
    const [created] = await db.insert(programsTable).values({
      id: crypto.randomUUID(),
      ...parse.data,
    }).returning();
    const enriched = await enrichWithUniversity(created);
    res.status(201).json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/programs/:id
router.get("/programs/:id", async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const program = await db.query.programsTable.findFirst({
      where: eq(programsTable.id, req.params.id),
    });
    if (!program) {
      res.status(404).json({ error: "Program not found" });
      return;
    }
    const enriched = await enrichWithUniversity(program);
    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/programs/:id (admin)
router.patch("/programs/:id", requireAdmin, async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const parse = updateSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: "Validation error", details: parse.error.issues });
      return;
    }
    const [updated] = await db.update(programsTable)
      .set({ ...parse.data, updatedAt: new Date() })
      .where(eq(programsTable.id, req.params.id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Program not found" });
      return;
    }
    const enriched = await enrichWithUniversity(updated);
    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/programs/:id (admin)
router.delete("/programs/:id", requireAdmin, async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const [deleted] = await db.delete(programsTable)
      .where(eq(programsTable.id, req.params.id))
      .returning();
    if (!deleted) {
      res.status(404).json({ error: "Program not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
