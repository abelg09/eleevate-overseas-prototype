import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { usersTable, psychometricSessionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

async function getUserId(clerkId: string): Promise<string | null> {
  const u = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, clerkId) });
  return u?.id ?? null;
}

// Static question bank
const PSYCHOMETRIC_QUESTIONS = [
  // Personality (10)
  { id: "p1", category: "personality", question: "When working on a project, you prefer to:", options: ["Work independently and manage your own time", "Collaborate closely with a team"] },
  { id: "p2", category: "personality", question: "In a new social situation, you typically:", options: ["Feel energized and enjoy meeting new people", "Prefer smaller groups or one-on-one conversations"] },
  { id: "p3", category: "personality", question: "When making decisions, you rely more on:", options: ["Logical analysis and data", "Gut feeling and personal values"] },
  { id: "p4", category: "personality", question: "You are most comfortable with:", options: ["Clear deadlines and structured plans", "Flexibility and adapting as you go"] },
  { id: "p5", category: "personality", question: "When faced with a problem, you first:", options: ["Break it into parts and analyze systematically", "Brainstorm creative solutions freely"] },
  // Aptitude (8)
  { id: "a1", category: "aptitude", question: "Which tasks do you find most enjoyable?", options: ["Analyzing data, solving equations, building systems", "Writing, communicating, storytelling"] },
  { id: "a2", category: "aptitude", question: "How do you best absorb new information?", options: ["Reading, research, and detailed study", "Hands-on practice and experimentation"] },
  { id: "a3", category: "aptitude", question: "When learning something new, you prefer:", options: ["Understanding the theory behind it first", "Jumping straight into practical application"] },
  { id: "a4", category: "aptitude", question: "Your strength is more in:", options: ["Numbers, logic, and precision", "Language, creativity, and expression"] },
  { id: "a5", category: "aptitude", question: "How do you approach long-term goals?", options: ["Set milestones and track progress rigorously", "Stay open and adjust the plan along the way"] },
  // Interest Inventory (7)
  { id: "i1", category: "interest", question: "Which field excites you most?", options: ["Technology & Engineering", "Business & Management", "Healthcare & Medicine", "Arts, Design & Media"] },
  { id: "i2", category: "interest", question: "Your dream work environment is:", options: ["A cutting-edge tech lab or startup", "A global corporate office", "A hospital or research clinic", "A creative studio or agency"] },
  { id: "i3", category: "interest", question: "Which activity sounds most fulfilling?", options: ["Building an app or machine", "Leading a business strategy", "Helping patients recover", "Creating art or content"] },
  { id: "i4", category: "interest", question: "What drives you most?", options: ["Innovation and problem-solving", "Leadership and profit", "Making people healthier", "Inspiring through creativity"] },
  { id: "i5", category: "interest", question: "Which subject did you enjoy most in school?", options: ["Mathematics / Computer Science", "Economics / Business", "Biology / Chemistry", "English / History / Arts"] },
];

const FIELD_MAP: Record<string, { field: string; countries: string[]; careers: string[] }> = {
  technology: { field: "Technology & Engineering", countries: ["Canada", "Germany", "USA", "Australia"], careers: ["Software Engineer", "Data Scientist", "AI/ML Engineer", "Cybersecurity Analyst"] },
  business: { field: "Business & Management", countries: ["UK", "USA", "Singapore", "Netherlands"], careers: ["Business Analyst", "Marketing Manager", "Finance Director", "Management Consultant"] },
  healthcare: { field: "Healthcare & Medicine", countries: ["UK", "Australia", "Canada", "Germany"], careers: ["Doctor", "Nurse Practitioner", "Medical Researcher", "Healthcare Administrator"] },
  arts: { field: "Arts, Design & Media", countries: ["UK", "France", "USA", "Netherlands"], careers: ["UX Designer", "Content Strategist", "Film Director", "Graphic Designer"] },
};

function scoreAnswers(answers: Record<string, number>) {
  let techScore = 0, bizScore = 0, healthScore = 0, artsScore = 0;

  // Interest questions drive field mapping
  if (answers["i1"] === 0) techScore += 3;
  else if (answers["i1"] === 1) bizScore += 3;
  else if (answers["i1"] === 2) healthScore += 3;
  else artsScore += 3;

  if (answers["i2"] === 0) techScore += 2;
  else if (answers["i2"] === 1) bizScore += 2;
  else if (answers["i2"] === 2) healthScore += 2;
  else artsScore += 2;

  if (answers["i3"] === 0) techScore += 2;
  else if (answers["i3"] === 1) bizScore += 2;
  else if (answers["i3"] === 2) healthScore += 2;
  else artsScore += 2;

  if (answers["i5"] === 0) techScore += 2;
  else if (answers["i5"] === 1) bizScore += 2;
  else if (answers["i5"] === 2) healthScore += 2;
  else artsScore += 2;

  // Aptitude signals
  if (answers["a1"] === 0) { techScore += 1; }
  else { bizScore += 1; artsScore += 1; }

  const scores = { technology: techScore, business: bizScore, healthcare: healthScore, arts: artsScore };
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);

  const recommendations = sorted.map(([key, score]) => ({
    ...FIELD_MAP[key],
    matchScore: Math.round((score / 10) * 100),
  }));

  const personalityInsights = {
    workStyle: answers["p1"] === 0 ? "Independent" : "Collaborative",
    socialStyle: answers["p2"] === 0 ? "Extroverted" : "Introverted",
    decisionStyle: answers["p3"] === 0 ? "Analytical" : "Intuitive",
    planningStyle: answers["p4"] === 0 ? "Structured" : "Flexible",
  };

  return { scores, fieldRecommendations: recommendations, personalityInsights };
}

// GET /api/assessment/questions
router.get("/assessment/questions", requireAuth, async (_req: Request, res: Response): Promise<void> => {
  res.json({ questions: PSYCHOMETRIC_QUESTIONS, total: PSYCHOMETRIC_QUESTIONS.length });
});

// GET /api/assessment/sessions — user's past sessions
router.get("/assessment/sessions", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = await getUserId(req.clerkUserId!);
    if (!userId) { res.json([]); return; }
    const sessions = await db.select().from(psychometricSessionsTable)
      .where(eq(psychometricSessionsTable.userId, userId))
      .orderBy(desc(psychometricSessionsTable.createdAt));
    res.json(sessions);
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// POST /api/assessment/sessions — submit assessment
router.post("/assessment/sessions", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { answers } = req.body as { answers?: Record<string, number> };
    if (!answers || typeof answers !== "object") { res.status(400).json({ error: "answers object required" }); return; }
    const userId = await getUserId(req.clerkUserId!);
    if (!userId) { res.status(404).json({ error: "User not found" }); return; }

    const { scores, fieldRecommendations, personalityInsights } = scoreAnswers(answers);
    const careers = fieldRecommendations[0]?.careers ?? [];

    const [session] = await db.insert(psychometricSessionsTable).values({
      userId,
      answers,
      scores,
      fieldRecommendations,
      careerRecommendations: careers.map(c => ({ career: c, field: fieldRecommendations[0]?.field })),
      completedAt: new Date(),
    }).returning();

    res.status(201).json({ ...session, personalityInsights });
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /api/assessment/sessions/:id
router.get("/assessment/sessions/:id", requireAuth, async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const userId = await getUserId(req.clerkUserId!);
    if (!userId) { res.status(404).json({ error: "User not found" }); return; }
    const session = await db.query.psychometricSessionsTable.findFirst({ where: eq(psychometricSessionsTable.id, req.params.id) });
    if (!session || session.userId !== userId) { res.status(404).json({ error: "Session not found" }); return; }
    res.json(session);
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

export default router;
