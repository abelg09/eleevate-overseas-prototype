import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { usersTable, loyaltyPointsTable } from "@workspace/db";
import { eq, desc, and, gte } from "drizzle-orm";
import { z } from "zod/v4";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

/**
 * Server-side earn rule registry.
 * Points are never accepted from the client — only the event name is.
 * This prevents self-awarding arbitrary points.
 */
/**
 * Cadence controls for repeatable events:
 * - "once":  may only be awarded once per user, ever.
 * - "daily": may only be awarded once per calendar day (UTC).
 * - undefined / omitted: unlimited (e.g. per-action events like shortlisting).
 */
const EARN_RULES: Record<string, { points: number; label: string; cadence?: "once" | "daily" }> = {
  profile_completed:      { points: 100, label: "Profile completed",                cadence: "once"  },
  university_shortlisted: { points: 10,  label: "University shortlisted"                             },
  application_submitted:  { points: 50,  label: "Application submitted"                              },
  document_uploaded:      { points: 25,  label: "Document uploaded"                                  },
  test_score_logged:      { points: 20,  label: "Test score logged"                                  },
  referral_signup:        { points: 200, label: "Friend signed up via referral",    cadence: "once"  },
  daily_login:            { points: 5,   label: "Daily check-in",                   cadence: "daily" },
  profile_photo:          { points: 15,  label: "Profile photo uploaded",           cadence: "once"  },
};

export const EARN_RULE_EVENTS = Object.keys(EARN_RULES) as Array<keyof typeof EARN_RULES>;

const addPointsSchema = z.object({
  event: z.enum(EARN_RULE_EVENTS as [string, ...string[]]),
  description: z.string().max(500).optional(),
});

async function getUserId(clerkId: string): Promise<string | null> {
  const u = await db.query.usersTable.findFirst({ where: eq(usersTable.clerkId, clerkId) });
  return u?.id ?? null;
}

function computeTierData(totalPoints: number) {
  let tier = "Explorer";
  if (totalPoints >= 5000) tier = "Ambassador";
  else if (totalPoints >= 2000) tier = "Achiever";
  else if (totalPoints >= 500) tier = "Pathfinder";

  const tiers = [
    { name: "Explorer",   minPoints: 0,    color: "blue" },
    { name: "Pathfinder", minPoints: 500,  color: "green" },
    { name: "Achiever",   minPoints: 2000, color: "purple" },
    { name: "Ambassador", minPoints: 5000, color: "gold" },
  ];

  return { tier, tiers };
}

// GET /api/students/me/loyalty
router.get("/students/me/loyalty", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = await getUserId(req.clerkUserId!);
    if (!userId) { res.json({ total: 0, ledger: [], tier: "Explorer", tiers: [] }); return; }

    const ledger = await db.select().from(loyaltyPointsTable)
      .where(eq(loyaltyPointsTable.userId, userId))
      .orderBy(desc(loyaltyPointsTable.createdAt));

    const totalPoints = ledger.reduce((acc, r) => acc + r.points, 0);
    const { tier, tiers } = computeTierData(totalPoints);

    res.json({ total: totalPoints, tier, tiers, ledger });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/students/me/loyalty
// Only accepts a whitelisted event name. Points are looked up server-side.
router.post("/students/me/loyalty", requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = addPointsSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: "Validation error", details: parse.error.issues });
      return;
    }
    const userId = await getUserId(req.clerkUserId!);
    if (!userId) { res.status(404).json({ error: "User not found" }); return; }

    const rule = EARN_RULES[parse.data.event];
    if (!rule) {
      res.status(400).json({ error: "Unknown earn event" });
      return;
    }

    // Cadence enforcement: prevent duplicate awards based on the rule's cadence.
    if (rule.cadence === "once") {
      const existing = await db.query.loyaltyPointsTable.findFirst({
        where: and(eq(loyaltyPointsTable.userId, userId), eq(loyaltyPointsTable.event, parse.data.event)),
      });
      if (existing) {
        res.status(409).json({ error: "This event has already been awarded", cadence: "once" });
        return;
      }
    } else if (rule.cadence === "daily") {
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);
      const existing = await db.query.loyaltyPointsTable.findFirst({
        where: and(
          eq(loyaltyPointsTable.userId, userId),
          eq(loyaltyPointsTable.event, parse.data.event),
          gte(loyaltyPointsTable.createdAt, todayStart),
        ),
      });
      if (existing) {
        res.status(409).json({ error: "This event can only be awarded once per day", cadence: "daily" });
        return;
      }
    }

    await db.insert(loyaltyPointsTable).values({
      userId,
      event: parse.data.event,
      points: rule.points,
      description: parse.data.description ?? rule.label,
    });

    const ledger = await db.select().from(loyaltyPointsTable)
      .where(eq(loyaltyPointsTable.userId, userId))
      .orderBy(desc(loyaltyPointsTable.createdAt));

    const totalPoints = ledger.reduce((acc, r) => acc + r.points, 0);
    const { tier, tiers } = computeTierData(totalPoints);

    res.status(201).json({ total: totalPoints, tier, tiers, ledger });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
