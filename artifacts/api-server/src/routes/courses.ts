import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { usersTable, coursesTable, courseChaptersTable, courseEnrollmentsTable } from "@workspace/db";
import { eq, and, desc, asc, inArray } from "drizzle-orm";
import { z } from "zod/v4";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";

const router = Router();

async function getUserId(clerkId: string): Promise<string | null> {
  const u = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, clerkId) });
  return u?.id ?? null;
}

const createCourseSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(["student", "consultant"]).optional(),
  level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  examType: z.string().optional(),
  category: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  certificateEnabled: z.boolean().optional(),
  durationMinutes: z.number().int().positive().optional(),
  status: z.enum(["draft", "published"]).optional(),
});

const createChapterSchema = z.object({
  courseId: z.string(),
  title: z.string().min(1),
  videoUrl: z.string().optional(),
  content: z.string().optional(),
  quizQuestions: z.array(z.object({
    question: z.string(),
    options: z.array(z.string()),
    correctIndex: z.number(),
    explanation: z.string().optional(),
  })).optional(),
  orderIndex: z.number().int().optional(),
});

// GET /api/courses — list published courses
router.get("/courses", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, examType, level } = req.query as Record<string, string>;
    let query = db.select().from(coursesTable).where(eq(coursesTable.status, "published"));
    const all = await db.select().from(coursesTable).where(eq(coursesTable.status, "published"));
    const filtered = all.filter(c => {
      if (type && c.type !== type) return false;
      if (examType && c.examType !== examType) return false;
      if (level && c.level !== level) return false;
      return true;
    });
    res.json({ data: filtered, total: filtered.length });
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/courses/admin — all courses (consultant/admin) with own courses
router.get("/courses/admin", requireAuth, requireRole("consultant", "admin"), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = await getUserId(req.clerkUserId!);
    if (!userId) { res.status(404).json({ error: "User not found" }); return; }
    const courses = await db.select().from(coursesTable)
      .where(eq(coursesTable.createdById, userId))
      .orderBy(desc(coursesTable.createdAt));
    res.json({ data: courses, total: courses.length });
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// POST /api/courses — create course (consultant/admin)
router.post("/courses", requireAuth, requireRole("consultant", "admin"), async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = createCourseSchema.safeParse(req.body);
    if (!parse.success) { res.status(400).json({ error: "Validation error", details: parse.error.issues }); return; }
    const userId = await getUserId(req.clerkUserId!);
    if (!userId) { res.status(404).json({ error: "User not found" }); return; }
    const [course] = await db.insert(coursesTable).values({ ...parse.data, createdById: userId }).returning();
    res.status(201).json(course);
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/courses/my-enrollments — must be before /:id to avoid param capture
router.get("/courses/my-enrollments", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = await getUserId(req.clerkUserId!);
    if (!userId) { res.json({ enrollments: [], courses: [] }); return; }
    const enrollments = await db.select().from(courseEnrollmentsTable)
      .where(eq(courseEnrollmentsTable.userId, userId))
      .orderBy(desc(courseEnrollmentsTable.createdAt));
    const courseIds = enrollments.map(e => e.courseId);
    const courses = courseIds.length > 0
      ? await db.select().from(coursesTable).where(inArray(coursesTable.id, courseIds))
      : [];
    res.json({ enrollments, courses });
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/courses/:id — published courses visible to all; drafts only visible to creator or admin/consultant
router.get("/courses/:id", requireAuth, async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const course = await db.query.coursesTable.findFirst({ where: eq(coursesTable.id, req.params.id) });
    if (!course) { res.status(404).json({ error: "Course not found" }); return; }
    if (course.status !== "published") {
      const userId = await getUserId(req.clerkUserId!);
      const user = userId ? await db.query.usersTable.findFirst({ where: eq(usersTable.id, userId) }) : null;
      const isCreator = userId && course.createdById === userId;
      const isPrivileged = user?.role === "admin" || user?.role === "consultant";
      if (!isCreator && !isPrivileged) { res.status(403).json({ error: "Forbidden" }); return; }
    }
    const chapters = await db.select().from(courseChaptersTable)
      .where(eq(courseChaptersTable.courseId, req.params.id))
      .orderBy(asc(courseChaptersTable.orderIndex));
    res.json({ ...course, chapters });
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// PATCH /api/courses/:id — update (creator only)
router.patch("/courses/:id", requireAuth, requireRole("consultant", "admin"), async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const parse = createCourseSchema.partial().safeParse(req.body);
    if (!parse.success) { res.status(400).json({ error: "Validation error", details: parse.error.issues }); return; }
    const userId = await getUserId(req.clerkUserId!);
    const existing = await db.query.coursesTable.findFirst({ where: eq(coursesTable.id, req.params.id) });
    if (!existing || existing.createdById !== userId) { res.status(404).json({ error: "Course not found" }); return; }
    const [updated] = await db.update(coursesTable).set({ ...parse.data, updatedAt: new Date() }).where(eq(coursesTable.id, req.params.id)).returning();
    res.json(updated);
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// DELETE /api/courses/:id
router.delete("/courses/:id", requireAuth, requireRole("consultant", "admin"), async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const userId = await getUserId(req.clerkUserId!);
    const existing = await db.query.coursesTable.findFirst({ where: eq(coursesTable.id, req.params.id) });
    if (!existing || existing.createdById !== userId) { res.status(404).json({ error: "Course not found" }); return; }
    await db.delete(courseChaptersTable).where(eq(courseChaptersTable.courseId, req.params.id));
    await db.delete(coursesTable).where(eq(coursesTable.id, req.params.id));
    res.status(204).send();
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// POST /api/courses/:id/chapters
router.post("/courses/:id/chapters", requireAuth, requireRole("consultant", "admin"), async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const parse = createChapterSchema.safeParse({ ...req.body, courseId: req.params.id });
    if (!parse.success) { res.status(400).json({ error: "Validation error", details: parse.error.issues }); return; }
    const userId = await getUserId(req.clerkUserId!);
    const course = await db.query.coursesTable.findFirst({ where: eq(coursesTable.id, req.params.id) });
    if (!course || course.createdById !== userId) { res.status(404).json({ error: "Course not found" }); return; }
    const [chapter] = await db.insert(courseChaptersTable).values(parse.data).returning();
    res.status(201).json(chapter);
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// DELETE /api/courses/:id/chapters/:chapterId
router.delete("/courses/:id/chapters/:chapterId", requireAuth, requireRole("consultant", "admin"), async (req: Request<{ id: string; chapterId: string }>, res: Response): Promise<void> => {
  try {
    const userId = await getUserId(req.clerkUserId!);
    const course = await db.query.coursesTable.findFirst({ where: eq(coursesTable.id, req.params.id) });
    if (!course || course.createdById !== userId) { res.status(404).json({ error: "Course not found" }); return; }
    await db.delete(courseChaptersTable).where(and(eq(courseChaptersTable.id, req.params.chapterId), eq(courseChaptersTable.courseId, req.params.id)));
    res.status(204).send();
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/courses/:id/enrollment — get my enrollment
router.get("/courses/:id/enrollment", requireAuth, async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const userId = await getUserId(req.clerkUserId!);
    if (!userId) { res.json(null); return; }
    const enrollment = await db.query.courseEnrollmentsTable.findFirst({
      where: and(eq(courseEnrollmentsTable.courseId, req.params.id), eq(courseEnrollmentsTable.userId, userId)),
    });
    res.json(enrollment ?? null);
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// POST /api/courses/:id/enroll
router.post("/courses/:id/enroll", requireAuth, async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const userId = await getUserId(req.clerkUserId!);
    if (!userId) { res.status(404).json({ error: "User not found" }); return; }
    const existing = await db.query.courseEnrollmentsTable.findFirst({
      where: and(eq(courseEnrollmentsTable.courseId, req.params.id), eq(courseEnrollmentsTable.userId, userId)),
    });
    if (existing) { res.json(existing); return; }
    const [enrollment] = await db.insert(courseEnrollmentsTable).values({
      courseId: req.params.id, userId, completedChapterIds: [],
    }).returning();
    res.status(201).json(enrollment);
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// PATCH /api/courses/:id/enrollment — update progress
router.patch("/courses/:id/enrollment", requireAuth, async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const userId = await getUserId(req.clerkUserId!);
    if (!userId) { res.status(404).json({ error: "User not found" }); return; }
    const { completedChapterIds } = req.body as { completedChapterIds?: string[] };
    const enrollment = await db.query.courseEnrollmentsTable.findFirst({
      where: and(eq(courseEnrollmentsTable.courseId, req.params.id), eq(courseEnrollmentsTable.userId, userId)),
    });
    if (!enrollment) { res.status(404).json({ error: "Not enrolled" }); return; }

    const chapters = await db.select().from(courseChaptersTable).where(eq(courseChaptersTable.courseId, req.params.id));
    const allCompleted = chapters.length > 0 && completedChapterIds && completedChapterIds.length >= chapters.length;
    const completedAt = allCompleted ? new Date() : null;
    const certificateIssued = allCompleted;

    const [updated] = await db.update(courseEnrollmentsTable).set({
      completedChapterIds: completedChapterIds ?? enrollment.completedChapterIds,
      completedAt: completedAt ?? enrollment.completedAt,
      certificateIssued,
    }).where(and(eq(courseEnrollmentsTable.courseId, req.params.id), eq(courseEnrollmentsTable.userId, userId))).returning();
    res.json(updated);
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

export default router;
