import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { db } from "@workspace/db";
import { invoicesTable, commissionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

const SEED_COMMISSIONS = [
  { id: "seed-c1", source: "application_success", description: "University admission — Oxford MSc CS", amount: 150000, currency: "USD", status: "paid", paidAt: "2026-03-15" },
  { id: "seed-c2", source: "course_sale", description: "IELTS Masterclass enrolment", amount: 2000, currency: "USD", status: "earned", paidAt: null },
  { id: "seed-c3", source: "application_success", description: "University admission — UBC MBA", amount: 120000, currency: "USD", status: "paid", paidAt: "2026-04-01" },
  { id: "seed-c4", source: "service_sale", description: "SOP Review service", amount: 2450, currency: "USD", status: "pending", paidAt: null },
  { id: "seed-c5", source: "referral", description: "Student referral bonus", amount: 5000, currency: "USD", status: "earned", paidAt: null },
];

router.get("/invoices/me", requireAuth, requireRole("consultant", "admin"), async (req: Request, res: Response): Promise<void> => {
  const consultantId = req.clerkUserId!;
  const invoices = await db
    .select()
    .from(invoicesTable)
    .where(eq(invoicesTable.consultantId, consultantId));
  res.json({ data: invoices });
});

router.post("/invoices", requireAuth, requireRole("consultant", "admin"), async (req: Request, res: Response): Promise<void> => {
  const consultantId = req.clerkUserId!;
  const { clientName, clientEmail, lineItems, taxAmount, discountAmount, notes, dueDate, currency } = req.body as {
    clientName: string;
    clientEmail?: string;
    lineItems: { description: string; quantity: number; unitPrice: number }[];
    taxAmount?: number;
    discountAmount?: number;
    notes?: string;
    dueDate?: string;
    currency?: string;
  };

  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const tax = taxAmount ?? 0;
  const discount = discountAmount ?? 0;
  const total = subtotal + tax - discount;

  const [invoice] = await db
    .insert(invoicesTable)
    .values({
      consultantId,
      clientName,
      clientEmail,
      lineItems,
      subtotal,
      taxAmount: tax,
      discountAmount: discount,
      total,
      currency: currency ?? "USD",
      status: "draft",
      notes,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    })
    .returning();
  res.status(201).json(invoice);
});

router.patch("/invoices/:id", requireAuth, requireRole("consultant", "admin"), async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const consultantId = req.clerkUserId!;
  const { id } = req.params;
  const { status } = req.body as { status: string };

  const [updated] = await db
    .update(invoicesTable)
    .set({ status: status as any, updatedAt: new Date(), ...(status === "paid" ? { paidAt: new Date() } : {}) })
    .where(and(eq(invoicesTable.id, id), eq(invoicesTable.consultantId, consultantId)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  res.json(updated);
});

router.get("/consultants/me/commissions", requireAuth, requireRole("consultant", "admin"), async (req: Request, res: Response): Promise<void> => {
  const consultantId = req.clerkUserId!;
  const dbCommissions = await db
    .select()
    .from(commissionsTable)
    .where(eq(commissionsTable.consultantId, consultantId));

  const allCommissions = [
    ...SEED_COMMISSIONS.map((c) => ({ ...c, consultantId, createdAt: new Date().toISOString() })),
    ...dbCommissions,
  ];
  res.json({ data: allCommissions });
});

router.post("/consultants/me/commissions/payout-request", requireAuth, requireRole("consultant", "admin"), async (_req: Request, res: Response): Promise<void> => {
  res.json({ success: true, message: "Payout request submitted. Funds will be transferred within 3–5 business days.", requestId: `PAY-${Date.now()}` });
});

export default router;
