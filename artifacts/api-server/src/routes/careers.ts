import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { usersTable, mentorshipRequestsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireRole } from "../middlewares/requireRole";
import { z } from "zod/v4";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

async function getUserId(clerkId: string): Promise<string | null> {
  const u = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, clerkId) });
  return u?.id ?? null;
}

// Static career paths data
const CAREER_PATHS = [
  {
    id: "technology",
    field: "Technology & Engineering",
    icon: "💻",
    careers: [
      { title: "Software Engineer", salaryRange: "$80k–$180k", skills: ["JavaScript", "Python", "System Design"], demand: "Very High" },
      { title: "Data Scientist", salaryRange: "$90k–$160k", skills: ["Python", "Machine Learning", "Statistics"], demand: "High" },
      { title: "AI/ML Engineer", salaryRange: "$100k–$200k", skills: ["TensorFlow", "PyTorch", "Deep Learning"], demand: "Very High" },
      { title: "Cybersecurity Analyst", salaryRange: "$70k–$140k", skills: ["Network Security", "Penetration Testing", "SIEM"], demand: "High" },
      { title: "DevOps Engineer", salaryRange: "$85k–$160k", skills: ["Docker", "Kubernetes", "CI/CD"], demand: "High" },
    ],
    topCountries: ["USA", "Canada", "Germany", "Australia", "Netherlands"],
    topPrograms: ["MS Computer Science", "MS Data Science", "MEng Software Engineering"],
    avgTimeToJob: "3-6 months",
  },
  {
    id: "business",
    field: "Business & Management",
    icon: "📊",
    careers: [
      { title: "Management Consultant", salaryRange: "$70k–$150k", skills: ["Strategy", "Data Analysis", "Presentation"], demand: "High" },
      { title: "Product Manager", salaryRange: "$80k–$160k", skills: ["Agile", "User Research", "Roadmapping"], demand: "High" },
      { title: "Financial Analyst", salaryRange: "$60k–$130k", skills: ["Excel", "Financial Modeling", "Valuation"], demand: "Moderate" },
      { title: "Marketing Manager", salaryRange: "$55k–$120k", skills: ["Digital Marketing", "Analytics", "Copywriting"], demand: "Moderate" },
      { title: "Supply Chain Manager", salaryRange: "$65k–$130k", skills: ["Logistics", "ERP Systems", "Operations"], demand: "High" },
    ],
    topCountries: ["UK", "USA", "Singapore", "Netherlands", "Canada"],
    topPrograms: ["MBA", "MS Finance", "MS Marketing"],
    avgTimeToJob: "2-4 months",
  },
  {
    id: "healthcare",
    field: "Healthcare & Medicine",
    icon: "🏥",
    careers: [
      { title: "Clinical Research Coordinator", salaryRange: "$45k–$80k", skills: ["GCP", "Clinical Trials", "Data Management"], demand: "High" },
      { title: "Healthcare Administrator", salaryRange: "$55k–$110k", skills: ["Healthcare Policy", "Operations", "Compliance"], demand: "Moderate" },
      { title: "Medical Data Analyst", salaryRange: "$60k–$110k", skills: ["SQL", "Healthcare Analytics", "HIPAA"], demand: "High" },
      { title: "Public Health Specialist", salaryRange: "$50k–$90k", skills: ["Epidemiology", "Policy", "Research"], demand: "Moderate" },
      { title: "Biomedical Engineer", salaryRange: "$65k–$130k", skills: ["Medical Devices", "CAD", "FDA Regulations"], demand: "High" },
    ],
    topCountries: ["UK", "Canada", "Australia", "Germany", "USA"],
    topPrograms: ["MPH", "MS Biomedical Engineering", "MHA"],
    avgTimeToJob: "3-6 months",
  },
  {
    id: "arts",
    field: "Arts, Design & Media",
    icon: "🎨",
    careers: [
      { title: "UX/UI Designer", salaryRange: "$55k–$130k", skills: ["Figma", "User Research", "Prototyping"], demand: "High" },
      { title: "Content Strategist", salaryRange: "$50k–$100k", skills: ["SEO", "Copywriting", "CMS"], demand: "Moderate" },
      { title: "Graphic Designer", salaryRange: "$40k–$85k", skills: ["Adobe Suite", "Branding", "Typography"], demand: "Moderate" },
      { title: "Film & Media Producer", salaryRange: "$45k–$100k", skills: ["Video Production", "Editing", "Storytelling"], demand: "Moderate" },
      { title: "Digital Marketing Specialist", salaryRange: "$45k–$95k", skills: ["Social Media", "Analytics", "PPC"], demand: "High" },
    ],
    topCountries: ["UK", "USA", "France", "Netherlands", "Australia"],
    topPrograms: ["MA Design", "MFA", "MS Digital Marketing"],
    avgTimeToJob: "2-4 months",
  },
];

const INTERNSHIP_LISTINGS = [
  { id: "int1", title: "Software Engineering Intern", company: "TechGlobal Ltd", location: "London, UK", type: "internship", duration: "6 months", stipend: "£2,000/month", skills: ["Python", "React", "AWS"], deadline: "2026-06-15" },
  { id: "int2", title: "Data Analytics Intern", company: "FinanceHub", location: "Toronto, Canada", type: "internship", duration: "4 months", stipend: "CAD $2,500/month", skills: ["SQL", "Excel", "Tableau"], deadline: "2026-05-30" },
  { id: "int3", title: "Marketing Strategy Intern", company: "GlobalReach Agency", location: "Amsterdam, Netherlands", type: "internship", duration: "6 months", stipend: "€1,800/month", skills: ["Marketing", "Analytics", "Content"], deadline: "2026-06-01" },
  { id: "int4", title: "UX Research Intern", company: "DesignFirst Studio", location: "Melbourne, Australia", type: "internship", duration: "3 months", stipend: "AUD $3,000/month", skills: ["Figma", "User Testing", "Research"], deadline: "2026-05-20" },
  { id: "int5", title: "Business Development Intern", company: "ConsultPro Singapore", location: "Singapore", type: "internship", duration: "6 months", stipend: "SGD $2,200/month", skills: ["Strategy", "Excel", "Communication"], deadline: "2026-06-30" },
];

const ALUMNI_MENTORS = [
  { id: "m1", name: "Dr. Priya Sharma", field: "Technology", currentRole: "Senior Software Engineer @ Google", location: "Mountain View, USA", university: "Carnegie Mellon University", graduationYear: 2019, expertise: ["Machine Learning", "System Design", "Career Transitions"] },
  { id: "m2", name: "James O'Brien", field: "Business", currentRole: "Management Consultant @ McKinsey", location: "London, UK", university: "London Business School", graduationYear: 2021, expertise: ["MBA Applications", "Consulting Careers", "UK Work Visa"] },
  { id: "m3", name: "Aiko Tanaka", field: "Healthcare", currentRole: "Public Health Researcher @ WHO", location: "Geneva, Switzerland", university: "University of Edinburgh", graduationYear: 2020, expertise: ["Public Health", "Research Methods", "European Life"] },
  { id: "m4", name: "Carlos Mendez", field: "Arts & Design", currentRole: "UX Lead @ Spotify", location: "Stockholm, Sweden", university: "Royal College of Art", graduationYear: 2018, expertise: ["UX Design", "Portfolio Building", "Nordic Countries"] },
  { id: "m5", name: "Fatima Al-Hassan", field: "Business", currentRole: "FinTech Founder", location: "Dubai, UAE", university: "University of Melbourne", graduationYear: 2017, expertise: ["Entrepreneurship", "FinTech", "Australia"] },
];

const mentorshipRequestSchema = z.object({
  mentorName: z.string().min(1),
  mentorEmail: z.string().email(),
  mentorField: z.string().optional(),
  message: z.string().min(10),
});

// GET /api/careers/paths
router.get("/careers/paths", requireAuth, (_req: Request, res: Response): void => {
  res.json({ data: CAREER_PATHS, total: CAREER_PATHS.length });
});

// GET /api/careers/paths/:id
router.get("/careers/paths/:id", requireAuth, (req: Request<{ id: string }>, res: Response): void => {
  const path = CAREER_PATHS.find(p => p.id === req.params.id);
  if (!path) { res.status(404).json({ error: "Career path not found" }); return; }
  res.json(path);
});

// GET /api/careers/internships
router.get("/careers/internships", requireAuth, (_req: Request, res: Response): void => {
  res.json({ data: INTERNSHIP_LISTINGS, total: INTERNSHIP_LISTINGS.length });
});

// GET /api/careers/mentors
router.get("/careers/mentors", requireAuth, (_req: Request, res: Response): void => {
  res.json({ data: ALUMNI_MENTORS, total: ALUMNI_MENTORS.length });
});

// POST /api/careers/mentorship-requests
router.post("/careers/mentorship-requests", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = mentorshipRequestSchema.safeParse(req.body);
    if (!parse.success) { res.status(400).json({ error: "Validation error", details: parse.error.issues }); return; }
    const userId = await getUserId(req.clerkUserId!);
    if (!userId) { res.status(404).json({ error: "User not found" }); return; }
    const [request] = await db.insert(mentorshipRequestsTable).values({ ...parse.data, studentId: userId }).returning();
    res.status(201).json(request);
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/careers/mentorship-requests
router.get("/careers/mentorship-requests", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = await getUserId(req.clerkUserId!);
    if (!userId) { res.json([]); return; }
    const requests = await db.select().from(mentorshipRequestsTable)
      .where(eq(mentorshipRequestsTable.studentId, userId))
      .orderBy(desc(mentorshipRequestsTable.createdAt));
    res.json(requests);
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

const mentorshipStatusValues = ["pending", "accepted", "rejected"] as const;
type MentorshipStatus = typeof mentorshipStatusValues[number];

// PATCH /api/careers/mentorship-requests/:id/cancel — student cancels their own request
router.patch("/careers/mentorship-requests/:id/cancel", requireAuth, async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const userId = await getUserId(req.clerkUserId!);
    if (!userId) { res.status(404).json({ error: "User not found" }); return; }
    const existing = await db.query.mentorshipRequestsTable.findFirst({ where: eq(mentorshipRequestsTable.id, req.params.id) });
    if (!existing) { res.status(404).json({ error: "Request not found" }); return; }
    // Only the owning student may cancel their own request
    if (existing.studentId !== userId) { res.status(403).json({ error: "Forbidden: you can only cancel your own mentorship requests" }); return; }
    if (existing.status !== "pending") { res.status(409).json({ error: "Only pending requests may be cancelled" }); return; }
    const [updated] = await db.update(mentorshipRequestsTable)
      .set({ status: "rejected" as MentorshipStatus, updatedAt: new Date() })
      .where(eq(mentorshipRequestsTable.id, req.params.id))
      .returning();
    res.json(updated);
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// PATCH /api/careers/mentorship-requests/:id/status — consultant or admin accepts/rejects
router.patch("/careers/mentorship-requests/:id/status", requireAuth, requireRole("consultant", "admin"), async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const { status } = req.body as { status?: string };
    if (!status || !["accepted", "rejected"].includes(status)) {
      res.status(400).json({ error: "Invalid status; must be 'accepted' or 'rejected'" }); return;
    }
    const existing = await db.query.mentorshipRequestsTable.findFirst({ where: eq(mentorshipRequestsTable.id, req.params.id) });
    if (!existing) { res.status(404).json({ error: "Request not found" }); return; }
    const [updated] = await db.update(mentorshipRequestsTable)
      .set({ status: status as MentorshipStatus, updatedAt: new Date() })
      .where(eq(mentorshipRequestsTable.id, req.params.id))
      .returning();
    res.json(updated);
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

export default router;
