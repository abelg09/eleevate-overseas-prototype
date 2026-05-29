import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { usersTable, sopDocumentsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod/v4";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";

const router = Router();

async function getUserId(clerkUserId: string): Promise<string | null> {
  const user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, clerkUserId) });
  return user?.id ?? null;
}

const createSopSchema = z.object({
  type: z.enum(["sop", "lor", "resume"]).optional(),
  title: z.string().min(1),
  content: z.string().optional(),
  targetUniversity: z.string().optional(),
  targetProgram: z.string().optional(),
  aiPromptData: z.string().optional(),
});

const updateSopSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  status: z.enum(["draft", "review", "final"]).optional(),
  targetUniversity: z.string().optional(),
  targetProgram: z.string().optional(),
});

const generateSopSchema = z.object({
  programName: z.string().optional(),
  university: z.string().optional(),
  academicBackground: z.string().optional(),
  workExperience: z.string().optional(),
  whyThisProgram: z.string().optional(),
  careerGoals: z.string().optional(),
  type: z.enum(["sop", "lor", "resume"]).optional(),
});

// GET /consultant/sop
router.get("/consultant/sop", requireAuth, requireRole("consultant"), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = await getUserId(req.clerkUserId!);
    if (!userId) { res.status(404).json({ error: "User not found" }); return; }
    const docs = await db.select().from(sopDocumentsTable)
      .where(eq(sopDocumentsTable.userId, userId))
      .orderBy(desc(sopDocumentsTable.updatedAt));
    res.json({ data: docs, total: docs.length });
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// POST /consultant/sop
router.post("/consultant/sop", requireAuth, requireRole("consultant"), async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = createSopSchema.safeParse(req.body);
    if (!parse.success) { res.status(400).json({ error: "Validation error", details: parse.error.issues }); return; }
    const userId = await getUserId(req.clerkUserId!);
    if (!userId) { res.status(404).json({ error: "User not found" }); return; }
    const [doc] = await db.insert(sopDocumentsTable).values({
      ...parse.data,
      userId,
      content: parse.data.content ?? "",
    }).returning();
    res.status(201).json(doc);
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// GET /consultant/sop/:id
router.get("/consultant/sop/:id", requireAuth, requireRole("consultant"), async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const userId = await getUserId(req.clerkUserId!);
    if (!userId) { res.status(404).json({ error: "User not found" }); return; }
    const doc = await db.query.sopDocumentsTable.findFirst({
      where: and(eq(sopDocumentsTable.id, req.params.id), eq(sopDocumentsTable.userId, userId)),
    });
    if (!doc) { res.status(404).json({ error: "Document not found" }); return; }
    res.json(doc);
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// PATCH /consultant/sop/:id
router.patch("/consultant/sop/:id", requireAuth, requireRole("consultant"), async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const parse = updateSopSchema.safeParse(req.body);
    if (!parse.success) { res.status(400).json({ error: "Validation error", details: parse.error.issues }); return; }
    const userId = await getUserId(req.clerkUserId!);
    if (!userId) { res.status(404).json({ error: "User not found" }); return; }
    const [updated] = await db.update(sopDocumentsTable)
      .set({ ...parse.data, updatedAt: new Date() })
      .where(and(eq(sopDocumentsTable.id, req.params.id), eq(sopDocumentsTable.userId, userId)))
      .returning();
    if (!updated) { res.status(404).json({ error: "Document not found" }); return; }
    res.json(updated);
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// DELETE /consultant/sop/:id
router.delete("/consultant/sop/:id", requireAuth, requireRole("consultant"), async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const userId = await getUserId(req.clerkUserId!);
    if (!userId) { res.status(404).json({ error: "User not found" }); return; }
    const [deleted] = await db.delete(sopDocumentsTable)
      .where(and(eq(sopDocumentsTable.id, req.params.id), eq(sopDocumentsTable.userId, userId)))
      .returning();
    if (!deleted) { res.status(404).json({ error: "Document not found" }); return; }
    res.status(204).send();
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// POST /consultant/sop/:id/generate — AI draft generation
router.post("/consultant/sop/:id/generate", requireAuth, requireRole("consultant"), async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const parse = generateSopSchema.safeParse(req.body);
    if (!parse.success) { res.status(400).json({ error: "Validation error", details: parse.error.issues }); return; }
    const userId = await getUserId(req.clerkUserId!);
    if (!userId) { res.status(404).json({ error: "User not found" }); return; }
    const doc = await db.query.sopDocumentsTable.findFirst({
      where: and(eq(sopDocumentsTable.id, req.params.id), eq(sopDocumentsTable.userId, userId)),
    });
    if (!doc) { res.status(404).json({ error: "Document not found" }); return; }

    let generatedContent = "";
    try {
      let aiClient: Awaited<typeof import("@workspace/integrations-openai-ai-server")>["openai"];
      ({ openai: aiClient } = await import("@workspace/integrations-openai-ai-server"));
      const docType = parse.data.type ?? doc.type ?? "sop";
      let prompt = "";
      if (docType === "sop") {
        prompt = `Write a compelling Statement of Purpose for ${parse.data.programName ?? "the program"} at ${parse.data.university ?? "the university"}.
Academic background: ${parse.data.academicBackground ?? "Not provided"}
Work experience: ${parse.data.workExperience ?? "Not provided"}
Why this program: ${parse.data.whyThisProgram ?? "Not provided"}
Career goals: ${parse.data.careerGoals ?? "Not provided"}
Write a professional, personal, 600-800 word SOP. Start directly with content.`;
      } else if (docType === "lor") {
        prompt = `Write a strong Letter of Recommendation template for a student applying to ${parse.data.programName ?? "a graduate program"} at ${parse.data.university ?? "the university"}.
Student background: ${parse.data.academicBackground ?? "Strong academic record"}
Program: ${parse.data.programName ?? ""}
Write a professional 400-500 word LOR template for a professor to customise.`;
      } else {
        prompt = `Create a professional resume template for a student applying to ${parse.data.programName ?? "a graduate program"}.
Background: ${parse.data.academicBackground ?? ""}
Work experience: ${parse.data.workExperience ?? ""}
Format with sections: Summary, Education, Work Experience, Skills, Projects. Use markdown.`;
      }
      const completion = await aiClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1200,
      });
      generatedContent = completion.choices[0]?.message?.content ?? "";
    } catch {
      generatedContent = `[AI Generation Placeholder]\n\nDear Admissions Committee,\n\nI am writing to express my strong interest in the ${parse.data.programName ?? "program"} at ${parse.data.university ?? "your institution"}.\n\nWith my background in ${parse.data.academicBackground ?? "relevant field"}, I have developed the skills and perspective necessary to excel in this program.\n\n${parse.data.whyThisProgram ? `${parse.data.whyThisProgram}\n\n` : ""}My career goals include ${parse.data.careerGoals ?? "contributing meaningfully to my field"}.\n\nThank you for considering my application.\n\nSincerely,\n[Your Name]`;
    }

    const [updated] = await db.update(sopDocumentsTable)
      .set({ content: generatedContent, updatedAt: new Date() })
      .where(eq(sopDocumentsTable.id, req.params.id))
      .returning();
    res.json(updated);
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

// POST /consultant/chatbot — AI counselling chatbot
router.post("/consultant/chatbot", requireAuth, requireRole("consultant"), async (req: Request, res: Response): Promise<void> => {
  try {
    const { message } = req.body as { message?: string };
    if (!message) { res.status(400).json({ error: "message is required" }); return; }

    const KNOWLEDGE_BASE = `You are an AI counselling assistant for EleevateOverseas, an overseas education platform.
Help students with: university eligibility, visa requirements, application deadlines, English language test scores,
scholarship options, cost of living, program selection, and general overseas study guidance.
Be concise, accurate, and encouraging. Mention that for personalised advice they can book a session with a human consultant.`;

    let reply = "";
    try {
      let chatClient: Awaited<typeof import("@workspace/integrations-openai-ai-server")>["openai"];
      ({ openai: chatClient } = await import("@workspace/integrations-openai-ai-server"));
      const completion = await chatClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: KNOWLEDGE_BASE },
          { role: "user", content: message },
        ],
        max_tokens: 400,
      });
      reply = completion.choices[0]?.message?.content ?? "I'm here to help! Could you rephrase your question?";
    } catch {
      const msg = message.toLowerCase();
      if (msg.includes("ielts") || msg.includes("toefl")) {
        reply = "Most universities require IELTS 6.5+ (some 7.0+) for graduate programs, or TOEFL 90+. UK universities often require IELTS 6.5-7.5. Book a session with your consultant for test preparation guidance.";
      } else if (msg.includes("visa")) {
        reply = "Visa requirements vary by country. The UK requires a Student Visa (Tier 4), Canada requires a Study Permit, the USA requires an F-1 visa, and Australia requires a Student Visa (subclass 500). Your consultant can help with the application.";
      } else if (msg.includes("scholarship")) {
        reply = "There are many scholarships available including Chevening (UK), DAAD (Germany), Australia Awards, and university-specific scholarships. Check each university's financial aid page. Your consultant can help identify the best options.";
      } else if (msg.includes("deadline")) {
        reply = "Application deadlines vary by program and intake. September intakes typically have deadlines in January-March, while January intakes close in September-October. Always check the university's official website for exact dates.";
      } else {
        reply = "Thank you for your question! I can help with university eligibility, visa requirements, application deadlines, English test scores, scholarships, and program selection. For personalised advice, book a 1:1 session with one of our expert consultants.";
      }
    }
    res.json({ reply, timestamp: new Date().toISOString() });
  } catch (err) { console.error(err); res.status(500).json({ error: "Internal server error" }); }
});

export default router;
