import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { usersTable, jobListingsTable, jobApplicationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod/v4";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";

const router = Router();

async function getUserId(clerkId: string): Promise<string | null> {
  const u = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, clerkId) });
  return u?.id ?? null;
}

const createJobSchema = z.object({
  title: z.string().min(1),
  company: z.string().min(1),
  description: z.string().min(10),
  location: z.string().optional(),
  country: z.string().optional(),
  type: z.enum(["full-time", "part-time", "internship", "contract"]).optional(),
  salary: z.string().optional(),
  skillsRequired: z.array(z.string()).optional(),
  expiresAt: z.string().optional(),
  logoUrl: z.string().optional(),
  companyWebsite: z.string().optional(),
  status: z.enum(["active", "closed", "draft"]).optional(),
});

const applySchema = z.object({
  coverLetter: z.string().optional(),
  resumeUrl: z.string().optional(),
});

// GET /api/jobs — list active jobs
router.get("/jobs", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, country, search } = req.query as Record<string, string>;
    const all = await db.select().from(jobListingsTable)
      .where(eq(jobListingsTable.status, "active"))
      .orderBy(desc(jobListingsTable.createdAt));
    const filtered = all.filter(j => {
      if (type && j.type !== type) return false;
      if (country && j.country?.toLowerCase() !== country.toLowerCase()) return false;
      if (search && !j.title.toLowerCase().includes(search.toLowerCase()) && !j.company.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    res.json({ data: filtered, total: filtered.length });
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// POST /api/jobs — post a job (consultant or admin only)
router.post("/jobs", requireAuth, requireRole("consultant", "admin"), async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = createJobSchema.safeParse(req.body);
    if (!parse.success) { res.status(400).json({ error: "Validation error", details: parse.error.issues }); return; }
    const userId = await getUserId(req.clerkUserId!);
    if (!userId) { res.status(404).json({ error: "User not found" }); return; }
    const expiresAt = parse.data.expiresAt ? new Date(parse.data.expiresAt) : undefined;
    const [job] = await db.insert(jobListingsTable).values({
      ...parse.data,
      skillsRequired: parse.data.skillsRequired ?? [],
      expiresAt,
      postedById: userId,
    }).returning();
    res.status(201).json(job);
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/jobs/:id
router.get("/jobs/:id", requireAuth, async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const job = await db.query.jobListingsTable.findFirst({ where: eq(jobListingsTable.id, req.params.id) });
    if (!job) { res.status(404).json({ error: "Job not found" }); return; }
    const applicationCount = await db.select().from(jobApplicationsTable).where(eq(jobApplicationsTable.jobId, req.params.id));
    res.json({ ...job, applicationCount: applicationCount.length });
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// PATCH /api/jobs/:id — update (poster only)
router.patch("/jobs/:id", requireAuth, async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const parse = createJobSchema.partial().safeParse(req.body);
    if (!parse.success) { res.status(400).json({ error: "Validation error", details: parse.error.issues }); return; }
    const userId = await getUserId(req.clerkUserId!);
    const job = await db.query.jobListingsTable.findFirst({ where: eq(jobListingsTable.id, req.params.id) });
    if (!job || job.postedById !== userId) { res.status(404).json({ error: "Job not found" }); return; }
    const expiresAt = parse.data.expiresAt ? new Date(parse.data.expiresAt) : undefined;
    const [updated] = await db.update(jobListingsTable).set({ ...parse.data, expiresAt, updatedAt: new Date() }).where(eq(jobListingsTable.id, req.params.id)).returning();
    res.json(updated);
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// DELETE /api/jobs/:id
router.delete("/jobs/:id", requireAuth, async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const userId = await getUserId(req.clerkUserId!);
    const job = await db.query.jobListingsTable.findFirst({ where: eq(jobListingsTable.id, req.params.id) });
    if (!job || job.postedById !== userId) { res.status(404).json({ error: "Job not found" }); return; }
    await db.delete(jobListingsTable).where(eq(jobListingsTable.id, req.params.id));
    res.status(204).send();
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// POST /api/jobs/:id/apply
router.post("/jobs/:id/apply", requireAuth, async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const parse = applySchema.safeParse(req.body);
    if (!parse.success) { res.status(400).json({ error: "Validation error", details: parse.error.issues }); return; }
    const userId = await getUserId(req.clerkUserId!);
    if (!userId) { res.status(404).json({ error: "User not found" }); return; }
    const existing = await db.query.jobApplicationsTable.findFirst({
      where: and(eq(jobApplicationsTable.jobId, req.params.id), eq(jobApplicationsTable.userId, userId)),
    });
    if (existing) { res.status(409).json({ error: "Already applied" }); return; }
    const [application] = await db.insert(jobApplicationsTable).values({
      jobId: req.params.id, userId, ...parse.data,
    }).returning();
    res.status(201).json(application);
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/jobs/my-applications
router.get("/my-job-applications", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = await getUserId(req.clerkUserId!);
    if (!userId) { res.json([]); return; }
    const applications = await db.select().from(jobApplicationsTable)
      .where(eq(jobApplicationsTable.userId, userId))
      .orderBy(desc(jobApplicationsTable.createdAt));
    res.json(applications);
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/jobs/:id/applications (poster views applicants)
router.get("/jobs/:id/applications", requireAuth, async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const userId = await getUserId(req.clerkUserId!);
    const job = await db.query.jobListingsTable.findFirst({ where: eq(jobListingsTable.id, req.params.id) });
    if (!job || job.postedById !== userId) { res.status(404).json({ error: "Job not found" }); return; }
    const applications = await db.select().from(jobApplicationsTable)
      .where(eq(jobApplicationsTable.jobId, req.params.id))
      .orderBy(desc(jobApplicationsTable.createdAt));
    res.json(applications);
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

const appStatusValues = ["applied", "reviewing", "shortlisted", "rejected", "hired"] as const;
type AppStatus = typeof appStatusValues[number];

// PATCH /api/jobs/:id/applications/:appId — update status (job owner only)
router.patch("/jobs/:id/applications/:appId", requireAuth, async (req: Request<{ id: string; appId: string }>, res: Response): Promise<void> => {
  try {
    const { status } = req.body as { status?: string };
    if (!status || !(appStatusValues as readonly string[]).includes(status)) {
      res.status(400).json({ error: "Invalid status", validValues: appStatusValues }); return;
    }
    const userId = await getUserId(req.clerkUserId!);
    if (!userId) { res.status(404).json({ error: "User not found" }); return; }
    // Verify the caller owns the job listing
    const job = await db.query.jobListingsTable.findFirst({ where: eq(jobListingsTable.id, req.params.id) });
    if (!job || job.postedById !== userId) { res.status(403).json({ error: "Forbidden" }); return; }
    // Scope update to applications for this specific job
    const [updated] = await db.update(jobApplicationsTable)
      .set({ status: status as AppStatus, updatedAt: new Date() })
      .where(and(eq(jobApplicationsTable.id, req.params.appId), eq(jobApplicationsTable.jobId, req.params.id)))
      .returning();
    if (!updated) { res.status(404).json({ error: "Application not found" }); return; }
    res.json(updated);
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

export default router;
