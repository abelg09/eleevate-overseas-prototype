import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { universitiesTable } from "@workspace/db";
import { eq, count, and, gte, lte, ilike } from "drizzle-orm";
import { z } from "zod/v4";
import { requireAdmin } from "../middlewares/requireAdmin";

const router = Router();

const listQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  country: z.string().optional(),
  search: z.string().optional(),
  minRanking: z.coerce.number().optional(),
  maxRanking: z.coerce.number().optional(),
});

const createSchema = z.object({
  name: z.string().min(1),
  country: z.string().min(1),
  city: z.string().min(1),
  ranking: z.number().int().positive().optional(),
  logoUrl: z.url().optional(),
  imageUrl: z.url().optional(),
  website: z.url().optional(),
  description: z.string().optional(),
  acceptanceRate: z.number().min(0).max(100).optional(),
  avgTuitionUsd: z.number().int().min(0).optional(),
  featured: z.boolean().optional(),
});

const updateSchema = createSchema.partial();

// GET /api/universities
router.get("/universities", async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = listQuerySchema.safeParse(req.query);
    if (!parse.success) {
      res.status(400).json({ error: "Invalid query params", details: parse.error.issues });
      return;
    }
    const { page, limit, country, search, minRanking, maxRanking } = parse.data;
    const offset = (page - 1) * limit;

    const conditions = [];
    if (country) conditions.push(eq(universitiesTable.country, country));
    if (search) conditions.push(ilike(universitiesTable.name, `%${search}%`));
    if (minRanking !== undefined) conditions.push(gte(universitiesTable.ranking, minRanking));
    if (maxRanking !== undefined) conditions.push(lte(universitiesTable.ranking, maxRanking));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const data = await db.select().from(universitiesTable).where(where).limit(limit).offset(offset);
    const [{ total }] = await db.select({ total: count() }).from(universitiesTable).where(where);

    res.json({ data, total: Number(total), page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/universities (admin)
router.post("/universities", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = createSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: "Validation error", details: parse.error.issues });
      return;
    }
    const [created] = await db.insert(universitiesTable).values({
      id: crypto.randomUUID(),
      ...parse.data,
    }).returning();
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/universities/featured — must come BEFORE /:id
router.get("/universities/featured", async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await db.select().from(universitiesTable)
      .where(eq(universitiesTable.featured, true))
      .limit(8);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/universities/:id
router.get("/universities/:id", async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const uni = await db.query.universitiesTable.findFirst({
      where: eq(universitiesTable.id, req.params.id),
    });
    if (!uni) {
      res.status(404).json({ error: "University not found" });
      return;
    }
    res.json(uni);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/universities/:id (admin)
router.patch("/universities/:id", requireAdmin, async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const parse = updateSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: "Validation error", details: parse.error.issues });
      return;
    }
    const [updated] = await db.update(universitiesTable)
      .set({ ...parse.data, updatedAt: new Date() })
      .where(eq(universitiesTable.id, req.params.id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "University not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/universities/:id (admin)
router.delete("/universities/:id", requireAdmin, async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const [deleted] = await db.delete(universitiesTable)
      .where(eq(universitiesTable.id, req.params.id))
      .returning();
    if (!deleted) {
      res.status(404).json({ error: "University not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
