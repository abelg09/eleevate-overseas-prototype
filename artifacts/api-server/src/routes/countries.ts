import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { countriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import { requireAdmin } from "../middlewares/requireAdmin";

const router = Router();

const createSchema = z.object({
  code: z.string().min(2).max(3).toUpperCase(),
  name: z.string().min(1),
  flagEmoji: z.string().optional(),
  continent: z.string().min(1),
  currency: z.string().optional(),
  visaInfo: z.string().optional(),
  avgCostOfLivingUsd: z.number().int().min(0).optional(),
  popularCities: z.array(z.string()).optional(),
  universityCount: z.number().int().min(0).optional(),
});

const updateSchema = createSchema.omit({ code: true }).partial();

// GET /api/countries
router.get("/countries", async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await db.select().from(countriesTable);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/countries (admin)
router.post("/countries", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = createSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: "Validation error", details: parse.error.issues });
      return;
    }
    const [created] = await db.insert(countriesTable).values(parse.data).returning();
    res.status(201).json(created);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/countries/:code
router.get("/countries/:code", async (req: Request<{ code: string }>, res: Response): Promise<void> => {
  try {
    const country = await db.query.countriesTable.findFirst({
      where: eq(countriesTable.code, req.params.code.toUpperCase()),
    });
    if (!country) {
      res.status(404).json({ error: "Country not found" });
      return;
    }
    res.json(country);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/countries/:code (admin)
router.patch("/countries/:code", requireAdmin, async (req: Request<{ code: string }>, res: Response): Promise<void> => {
  try {
    const parse = updateSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: "Validation error", details: parse.error.issues });
      return;
    }
    const [updated] = await db.update(countriesTable)
      .set(parse.data)
      .where(eq(countriesTable.code, req.params.code.toUpperCase()))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Country not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/countries/:code (admin)
router.delete("/countries/:code", requireAdmin, async (req: Request<{ code: string }>, res: Response): Promise<void> => {
  try {
    const [deleted] = await db.delete(countriesTable)
      .where(eq(countriesTable.code, req.params.code.toUpperCase()))
      .returning();
    if (!deleted) {
      res.status(404).json({ error: "Country not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
