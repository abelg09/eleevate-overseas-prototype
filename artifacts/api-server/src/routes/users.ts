import { Router, type Request, type Response } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { db } from "@workspace/db";
import { usersTable, studentsTable, consultantsTable } from "@workspace/db";
import { eq, count, ilike } from "drizzle-orm";
import { z } from "zod/v4";
import { requireAuth } from "../middlewares/requireAuth";
import { requireAdmin } from "../middlewares/requireAdmin";

const router = Router();

const updateMeSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  avatarUrl: z.url().optional(),
});

const adminUpdateUserSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(["student", "consultant", "partner", "admin"]).optional(),
  avatarUrl: z.url().optional(),
});

const onboardingSchema = z.object({
  role: z.enum(["student", "consultant", "partner", "admin"]).default("student"),
  firstName: z.string().min(1).optional(),
  lastName: z.string().optional(),
  targetCountries: z.array(z.string()).optional(),
  studyLevel: z.enum(["undergraduate", "postgraduate", "phd", "diploma", "certificate"]).optional(),
  agencyName: z.string().optional(),
  specializations: z.array(z.string()).optional(),
});

const listUsersQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  role: z.string().optional(),
});

async function getOrCreateUser(clerkId: string, req: Request) {
  let user = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, clerkId) });
  if (!user) {
    const auth = getAuth(req);
    const claims = auth?.sessionClaims as Record<string, unknown> | undefined;
    const email = (claims?.["email"] as string) ?? `${clerkId}@clerk.local`;
    const firstName = (claims?.["firstName"] as string) ?? null;
    const lastName = (claims?.["lastName"] as string) ?? null;
    const [created] = await db.insert(usersTable).values({
      id: crypto.randomUUID(),
      clerkId,
      email,
      firstName,
      lastName,
      role: "student",
      onboardingComplete: false,
    }).returning();
    user = created;
  }
  return user;
}

// GET /api/users/me
router.get("/users/me", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const clerkId = req.clerkUserId!;
    const user = await getOrCreateUser(clerkId, req);
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /api/users/me
router.put("/users/me", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const clerkId = req.clerkUserId!;
    const parse = updateMeSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: "Validation error", details: parse.error.issues });
      return;
    }
    const { firstName, lastName, avatarUrl } = parse.data;
    const [updated] = await db.update(usersTable)
      .set({ firstName, lastName, avatarUrl, updatedAt: new Date() })
      .where(eq(usersTable.clerkId, clerkId))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/users/onboarding
router.post("/users/onboarding", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const clerkId = req.clerkUserId!;
    const parse = onboardingSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: "Validation error", details: parse.error.issues });
      return;
    }
    const { role, firstName, lastName, targetCountries, studyLevel, agencyName, specializations } = parse.data;

    const user = await getOrCreateUser(clerkId, req);

    const [updated] = await db.update(usersTable)
      .set({ role, firstName, lastName, onboardingComplete: true, updatedAt: new Date() })
      .where(eq(usersTable.clerkId, clerkId))
      .returning();

    // Write role to Clerk public metadata so it's available in JWT claims
    try {
      await clerkClient.users.updateUserMetadata(clerkId, {
        publicMetadata: { role },
      });
    } catch (clerkErr) {
      console.warn("Failed to write role to Clerk metadata (non-fatal):", clerkErr);
    }

    if (role === "student") {
      const existing = await db.query.studentsTable.findFirst({ where: eq(studentsTable.userId, user.id) });
      if (!existing) {
        await db.insert(studentsTable).values({
          id: crypto.randomUUID(),
          userId: user.id,
          targetCountries: targetCountries ?? [],
          studyLevel: studyLevel ?? "postgraduate",
        });
      }
    } else if (role === "consultant") {
      const existing = await db.query.consultantsTable.findFirst({ where: eq(consultantsTable.userId, user.id) });
      if (!existing) {
        await db.insert(consultantsTable).values({
          id: crypto.randomUUID(),
          userId: user.id,
          agencyName: agencyName ?? null,
          specializations: specializations ?? [],
        });
      }
    }

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/users — admin: list all users
router.get("/users", requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = listUsersQuerySchema.safeParse(req.query);
    if (!parse.success) {
      res.status(400).json({ error: "Invalid query params", details: parse.error.issues });
      return;
    }
    const { page, limit, role } = parse.data;
    const offset = (page - 1) * limit;

    let query = db.select().from(usersTable);
    let countQuery = db.select({ total: count() }).from(usersTable);

    if (role) {
      const whereClause = eq(usersTable.role, role as typeof usersTable.role._.data);
      query = query.where(whereClause) as typeof query;
      countQuery = countQuery.where(whereClause) as typeof countQuery;
    }

    const data = await query.limit(limit).offset(offset);
    const [{ total }] = await countQuery;

    res.json({ data, total: Number(total), page, limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/users/:id — admin: get user by DB id
router.get("/users/:id", requireAdmin, async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.id, req.params.id),
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/users/:id — admin: update user
router.patch("/users/:id", requireAdmin, async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const parse = adminUpdateUserSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: "Validation error", details: parse.error.issues });
      return;
    }
    const [updated] = await db.update(usersTable)
      .set({ ...parse.data, updatedAt: new Date() })
      .where(eq(usersTable.id, req.params.id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/users/:id — admin: delete user
router.delete("/users/:id", requireAdmin, async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const [deleted] = await db.delete(usersTable)
      .where(eq(usersTable.id, req.params.id))
      .returning();
    if (!deleted) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
