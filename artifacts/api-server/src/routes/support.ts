import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { usersTable, supportTicketsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { z } from "zod/v4";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

async function getUserId(clerkId: string): Promise<string | null> {
  const u = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, clerkId) });
  return u?.id ?? null;
}

const createTicketSchema = z.object({
  subject: z.string().min(3).max(255),
  body: z.string().min(10).max(5000),
});

const updateTicketSchema = z.object({
  status: z.enum(["open", "in_progress", "resolved", "closed"]).optional(),
});

// GET /api/support/tickets
router.get("/support/tickets", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = await getUserId(req.clerkUserId!);
    if (!userId) { res.json([]); return; }
    const tickets = await db.select().from(supportTicketsTable)
      .where(eq(supportTicketsTable.userId, userId))
      .orderBy(desc(supportTicketsTable.createdAt));
    res.json(tickets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/support/tickets
router.post("/support/tickets", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = createTicketSchema.safeParse(req.body);
    if (!parse.success) { res.status(400).json({ error: "Validation error", details: parse.error.issues }); return; }
    const userId = await getUserId(req.clerkUserId!);
    if (!userId) { res.status(404).json({ error: "User not found" }); return; }

    const [ticket] = await db.insert(supportTicketsTable).values({
      userId,
      subject: parse.data.subject,
      body: parse.data.body,
      status: "open",
    }).returning();

    res.status(201).json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/support/tickets/:id
router.get("/support/tickets/:id", requireAuth, async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const userId = await getUserId(req.clerkUserId!);
    if (!userId) { res.status(404).json({ error: "User not found" }); return; }
    const ticket = await db.query.supportTicketsTable.findFirst({ where: eq(supportTicketsTable.id, req.params.id) });
    if (!ticket) { res.status(404).json({ error: "Ticket not found" }); return; }
    if (ticket.userId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }
    res.json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/support/tickets/:id
router.patch("/support/tickets/:id", requireAuth, async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const parse = updateTicketSchema.safeParse(req.body);
    if (!parse.success) { res.status(400).json({ error: "Validation error", details: parse.error.issues }); return; }
    const userId = await getUserId(req.clerkUserId!);
    if (!userId) { res.status(404).json({ error: "User not found" }); return; }
    const existing = await db.query.supportTicketsTable.findFirst({ where: eq(supportTicketsTable.id, req.params.id) });
    if (!existing) { res.status(404).json({ error: "Ticket not found" }); return; }
    if (existing.userId !== userId) { res.status(403).json({ error: "Forbidden" }); return; }
    const [updated] = await db.update(supportTicketsTable).set({ ...parse.data, updatedAt: new Date() }).where(eq(supportTicketsTable.id, req.params.id)).returning();
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
