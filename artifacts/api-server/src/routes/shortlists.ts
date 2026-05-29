import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { usersTable, studentsTable, shortlistsTable, universitiesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod/v4";
import { requireAuth } from "../middlewares/requireAuth";

// NOTE: openai is lazy-loaded inside the /ai-recommend handler only.
// Top-level imports of @workspace/integrations-openai-ai-server will throw at
// module-load time when OPENAI_API_KEY is absent, crashing the entire server.

const router = Router();

async function getUserId(clerkId: string): Promise<string | null> {
  const u = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, clerkId) });
  return u?.id ?? null;
}

// GET /api/students/me/shortlist — full university objects
router.get("/students/me/shortlist", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = await getUserId(req.clerkUserId!);
    if (!userId) { res.json([]); return; }

    const rows = await db
      .select({ university: universitiesTable })
      .from(shortlistsTable)
      .innerJoin(universitiesTable, eq(shortlistsTable.universityId, universitiesTable.id))
      .where(eq(shortlistsTable.userId, userId));

    res.json(rows.map(r => r.university));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/students/me/shortlist/ids
// IMPORTANT: Literal-path GET routes must come before parameterized GET /:id routes.
router.get("/students/me/shortlist/ids", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = await getUserId(req.clerkUserId!);
    if (!userId) { res.json([]); return; }
    const rows = await db
      .select({ universityId: shortlistsTable.universityId })
      .from(shortlistsTable)
      .where(eq(shortlistsTable.userId, userId));
    res.json(rows.map(r => r.universityId));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/students/me/shortlist/ai-recommend
// IMPORTANT: This MUST be declared BEFORE POST /:universityId so Express does not
// treat the literal segment "ai-recommend" as a :universityId parameter value.
router.post("/students/me/shortlist/ai-recommend", requireAuth, async (req: Request, res: Response): Promise<void> => {
  // Lazy-load openai so a missing API key only fails this route, not the entire server.
  let openai: Awaited<typeof import("@workspace/integrations-openai-ai-server")>["openai"];
  try {
    ({ openai } = await import("@workspace/integrations-openai-ai-server"));
  } catch (importErr) {
    console.warn("OpenAI integration unavailable:", importErr);
    res.status(503).json({ error: "AI shortlisting is not available — OpenAI integration not configured" });
    return;
  }

  try {
    const userId = await getUserId(req.clerkUserId!);
    if (!userId) { res.status(404).json({ error: "User not found" }); return; }

    const student = await db.query.studentsTable.findFirst({ where: eq(studentsTable.userId, userId) });
    const universities = await db.select().from(universitiesTable).limit(30);

    if (!universities.length) {
      res.json({ recommendations: [] });
      return;
    }

    const studentProfile = {
      studyLevel: student?.studyLevel ?? "postgraduate",
      budget: student?.budget ?? null,
      gpa: student?.gpa ?? null,
      ieltsScore: student?.ieltsScore ?? null,
      toeflScore: student?.toeflScore ?? null,
      greScore: student?.greScore ?? null,
      targetCountries: student?.targetCountries ?? [],
    };

    const uniList = universities.map(u => ({
      id: u.id,
      name: u.name,
      country: u.country,
      ranking: u.ranking,
      acceptanceRate: u.acceptanceRate,
      avgTuitionUsd: u.avgTuitionUsd,
    }));

    const prompt = `You are an overseas education advisor. Given a student profile, rank and score these universities by fit.

Student Profile:
${JSON.stringify(studentProfile, null, 2)}

Universities (up to 30):
${JSON.stringify(uniList, null, 2)}

Return a JSON array of objects with fields:
- universityId: string
- matchScore: number (0-100, higher is better)
- reasons: string[] (2-3 brief bullet points why this is a good fit)
- concern: string (one concern or challenge, if any)

Return ONLY valid JSON, no markdown, no explanation. Return up to 10 best matches sorted by matchScore descending.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    let parsed: { recommendations?: unknown[] } = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { recommendations: [] };
    }

    const recs = Array.isArray(parsed)
      ? parsed
      : Array.isArray((parsed as { recommendations?: unknown[] }).recommendations)
        ? (parsed as { recommendations: unknown[] }).recommendations
        : [];

    const enriched = (recs as Array<{ universityId: string; matchScore: number; reasons: string[]; concern?: string }>)
      .map(r => ({ ...r, university: universities.find(u => u.id === r.universityId) }))
      .filter(r => r.university);

    res.json({ recommendations: enriched });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI recommendation failed" });
  }
});

// POST /api/students/me/shortlist/:universityId — toggle bookmark
// IMPORTANT: Parameterized route MUST come AFTER all literal-path POST routes above.
router.post("/students/me/shortlist/:universityId", requireAuth, async (req: Request<{ universityId: string }>, res: Response): Promise<void> => {
  try {
    const userId = await getUserId(req.clerkUserId!);
    if (!userId) { res.status(404).json({ error: "User not found" }); return; }

    const existing = await db.query.shortlistsTable.findFirst({
      where: and(eq(shortlistsTable.userId, userId), eq(shortlistsTable.universityId, req.params.universityId)),
    });

    if (existing) {
      await db.delete(shortlistsTable).where(and(eq(shortlistsTable.userId, userId), eq(shortlistsTable.universityId, req.params.universityId)));
      res.json({ shortlisted: false });
    } else {
      await db.insert(shortlistsTable).values({ userId, universityId: req.params.universityId });
      res.json({ shortlisted: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
