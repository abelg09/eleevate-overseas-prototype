import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { usersTable, studentsTable, applicationsTable, documentsTable } from "@workspace/db";
import { eq, desc, count } from "drizzle-orm";
import { z } from "zod/v4";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";

const router = Router();

const updateStudentSchema = z.object({
  targetCountries: z.array(z.string()).optional(),
  studyLevel: z.enum(["undergraduate", "postgraduate", "phd", "diploma", "certificate"]).optional(),
  budget: z.number().positive().optional(),
  gpa: z.number().min(0).max(4).optional(),
  ieltsScore: z.number().min(0).max(9).optional(),
  toeflScore: z.number().min(0).max(120).optional(),
  greScore: z.number().min(0).max(340).optional(),
  gmatScore: z.number().min(0).max(800).optional(),
  preferredIntake: z.string().optional(),
  workExperience: z.number().min(0).optional(),
  nationality: z.string().optional(),
});

const listQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

async function getStudentByClerkId(clerkId: string) {
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, clerkId) });
  if (!user) return null;
  const student = await db.query.studentsTable.findFirst({ where: eq(studentsTable.userId, user.id) });
  return { user, student };
}

// GET /api/students/me — student only
router.get("/students/me", requireAuth, requireRole("student"), async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await getStudentByClerkId(req.clerkUserId!);
    if (!result?.student) {
      res.status(404).json({ error: "Student profile not found" });
      return;
    }
    res.json(result.student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/students/me — student only
router.put("/students/me", requireAuth, requireRole("student"), async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = updateStudentSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: "Validation error", details: parse.error.issues });
      return;
    }
    const result = await getStudentByClerkId(req.clerkUserId!);
    if (!result?.user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (!result.student) {
      const [created] = await db.insert(studentsTable).values({
        id: crypto.randomUUID(),
        userId: result.user.id,
        ...parse.data,
      }).returning();
      res.json(created);
      return;
    }

    const [updated] = await db.update(studentsTable)
      .set({ ...parse.data, updatedAt: new Date() })
      .where(eq(studentsTable.userId, result.user.id))
      .returning();
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/students/me/dashboard-summary — student only
router.get("/students/me/dashboard-summary", requireAuth, requireRole("student"), async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await getStudentByClerkId(req.clerkUserId!);
    if (!result?.user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const userId = result.user.id;
    const studentId = result.student?.id;

    let totalApplications = 0;
    let applicationsByStatus: { status: string; count: number }[] = [];
    let upcomingDeadlines = 0;

    if (studentId) {
      const apps = await db.select().from(applicationsTable)
        .where(eq(applicationsTable.studentId, studentId))
        .orderBy(desc(applicationsTable.updatedAt));

      totalApplications = apps.length;
      const statusCounts: Record<string, number> = {};
      const today = new Date();
      const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

      for (const app of apps) {
        statusCounts[app.status] = (statusCounts[app.status] ?? 0) + 1;
        if (app.deadline) {
          const dl = new Date(app.deadline);
          if (dl >= today && dl <= nextMonth) upcomingDeadlines++;
        }
      }
      applicationsByStatus = Object.entries(statusCounts).map(([status, cnt]) => ({ status, count: cnt }));
    }

    const docs = await db.select().from(documentsTable).where(eq(documentsTable.userId, userId));

    res.json({
      totalApplications,
      shortlistedUniversities: totalApplications,
      documentsUploaded: docs.length,
      upcomingDeadlines,
      applicationsByStatus,
      recentActivity: [
        { id: "1", type: "welcome", message: "Welcome to EleevateOverseas! Start by exploring universities.", timestamp: new Date().toISOString() },
      ],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/students — admin or consultant: list all student profiles
router.get("/students", requireAuth, requireRole("admin", "consultant"), async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = listQuerySchema.safeParse(req.query);
    if (!parse.success) {
      res.status(400).json({ error: "Invalid query params", details: parse.error.issues });
      return;
    }
    const { page, limit } = parse.data;
    const offset = (page - 1) * limit;
    const data = await db.select().from(studentsTable).limit(limit).offset(offset);
    const [{ total }] = await db.select({ total: count() }).from(studentsTable);
    res.json({ data, total: Number(total), page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/students/:id — admin or consultant: get specific student profile
router.get("/students/:id", requireAuth, requireRole("admin", "consultant"), async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const student = await db.query.studentsTable.findFirst({
      where: eq(studentsTable.id, req.params.id),
    });
    if (!student) {
      res.status(404).json({ error: "Student not found" });
      return;
    }
    res.json(student);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/students/:id — admin only
router.delete("/students/:id", requireAuth, requireRole("admin"), async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const [deleted] = await db.delete(studentsTable)
      .where(eq(studentsTable.id, req.params.id))
      .returning();
    if (!deleted) {
      res.status(404).json({ error: "Student not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
