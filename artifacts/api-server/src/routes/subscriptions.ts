import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { db } from "@workspace/db";
import { subscriptionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: 0,
    currency: "USD",
    interval: "month",
    description: "Get started with the basics",
    features: [
      "University search & explore",
      "Up to 3 shortlisted universities",
      "Basic application tracking",
      "Community access",
      "Standard support",
    ],
  },
  {
    id: "student_pro",
    name: "Student Pro",
    price: 999,
    currency: "USD",
    interval: "month",
    description: "Everything a serious applicant needs",
    popular: true,
    features: [
      "Unlimited shortlists",
      "AI university matching",
      "Full LMS & courses",
      "Mock tests (unlimited)",
      "Document vault (5 GB)",
      "Priority support",
      "Score trend analytics",
    ],
  },
  {
    id: "consultant_pro",
    name: "Consultant Pro",
    price: 2999,
    currency: "USD",
    interval: "month",
    description: "Professional tools for education consultants",
    features: [
      "Full CRM & lead pipeline",
      "Invoice & commission tracking",
      "Team management (up to 5)",
      "LMS course authoring",
      "Partner integrations",
      "Analytics dashboard",
      "White-glove onboarding",
    ],
  },
  {
    id: "agency",
    name: "Agency",
    price: 9999,
    currency: "USD",
    interval: "month",
    description: "Enterprise power for large consultancies",
    features: [
      "Everything in Consultant Pro",
      "Unlimited team members",
      "Custom branding & white-label",
      "Advanced analytics & exports",
      "Dedicated account manager",
      "SLA-backed support",
      "API access",
    ],
  },
];

router.get("/subscriptions/plans", (_req: Request, res: Response): void => {
  res.json({ data: PLANS });
});

router.get("/subscriptions/me", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.clerkUserId!;
  const [sub] = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, userId))
    .limit(1);

  if (!sub) {
    res.json({ plan: "free", status: "active", cancelAtPeriodEnd: false, currentPeriodEnd: null });
    return;
  }
  res.json(sub);
});

router.post("/subscriptions/checkout", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.clerkUserId!;
  const { planId } = req.body as { planId: string };

  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) {
    res.status(400).json({ error: "Invalid plan" });
    return;
  }

  const existing = await db
    .select()
    .from(subscriptionsTable)
    .where(eq(subscriptionsTable.userId, userId))
    .limit(1);

  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  if (existing.length > 0) {
    const [updated] = await db
      .update(subscriptionsTable)
      .set({ plan: planId as any, status: "active", cancelAtPeriodEnd: false, currentPeriodEnd: periodEnd, updatedAt: new Date() })
      .where(eq(subscriptionsTable.userId, userId))
      .returning();
    res.json(updated);
    return;
  }

  const [created] = await db
    .insert(subscriptionsTable)
    .values({ userId, plan: planId as any, status: "active", currentPeriodEnd: periodEnd })
    .returning();
  res.status(201).json(created);
});

router.post("/subscriptions/cancel", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.clerkUserId!;
  const [updated] = await db
    .update(subscriptionsTable)
    .set({ cancelAtPeriodEnd: true, updatedAt: new Date() })
    .where(eq(subscriptionsTable.userId, userId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "No active subscription" });
    return;
  }
  res.json(updated);
});

export default router;
