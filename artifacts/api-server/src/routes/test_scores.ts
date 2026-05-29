import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { usersTable, studentsTable, testScoresTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { z } from "zod/v4";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

async function getUserId(clerkId: string): Promise<string | null> {
  const u = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, clerkId) });
  return u?.id ?? null;
}

async function getStudentId(userId: string): Promise<string | null> {
  const s = await db.query.studentsTable.findFirst({ where: eq(studentsTable.userId, userId) });
  return s?.id ?? null;
}

const createScoreSchema = z.object({
  testType: z.enum(["ielts", "toefl", "gre", "gmat", "sat", "pte", "duolingo"]),
  score: z.number().positive(),
  takenAt: z.string().optional(),
  notes: z.string().max(500).optional(),
});

// GET /api/students/me/test-scores
router.get("/students/me/test-scores", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = await getUserId(req.clerkUserId!);
    if (!userId) { res.json([]); return; }
    const studentId = await getStudentId(userId);
    if (!studentId) { res.json([]); return; }

    const scores = await db.select().from(testScoresTable)
      .where(eq(testScoresTable.studentId, studentId))
      .orderBy(desc(testScoresTable.createdAt));

    res.json(scores);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/students/me/test-scores
router.post("/students/me/test-scores", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = createScoreSchema.safeParse(req.body);
    if (!parse.success) { res.status(400).json({ error: "Validation error", details: parse.error.issues }); return; }
    const userId = await getUserId(req.clerkUserId!);
    if (!userId) { res.status(404).json({ error: "User not found" }); return; }
    const studentId = await getStudentId(userId);
    if (!studentId) { res.status(404).json({ error: "Student profile not found" }); return; }

    const [score] = await db.insert(testScoresTable).values({
      studentId,
      testType: parse.data.testType,
      score: parse.data.score,
      takenAt: parse.data.takenAt ? new Date(parse.data.takenAt) : null,
      notes: parse.data.notes ?? null,
    }).returning();

    res.status(201).json(score);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/students/me/test-scores/:id
router.delete("/students/me/test-scores/:id", requireAuth, async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const userId = await getUserId(req.clerkUserId!);
    if (!userId) { res.status(404).json({ error: "User not found" }); return; }
    const studentId = await getStudentId(userId);
    if (!studentId) { res.status(404).json({ error: "Student not found" }); return; }

    const existing = await db.query.testScoresTable.findFirst({ where: eq(testScoresTable.id, req.params.id) });
    if (!existing) { res.status(404).json({ error: "Score not found" }); return; }
    if (existing.studentId !== studentId) { res.status(403).json({ error: "Forbidden" }); return; }

    await db.delete(testScoresTable).where(eq(testScoresTable.id, req.params.id));
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
