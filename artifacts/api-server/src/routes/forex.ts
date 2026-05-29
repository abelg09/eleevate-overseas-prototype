import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { db } from "@workspace/db";
import { forexTransactionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const BASE_RATES: Record<string, Record<string, number>> = {
  INR: { USD: 0.01194, GBP: 0.00945, AUD: 0.01812, CAD: 0.01625, EUR: 0.01099, SGD: 0.01614, NZD: 0.01975 },
  USD: { INR: 83.77, GBP: 0.7916, AUD: 1.5183, CAD: 1.3613, EUR: 0.9207, SGD: 1.3519, NZD: 1.6547 },
  GBP: { INR: 105.76, USD: 1.2632, AUD: 1.9179, CAD: 1.7198, EUR: 1.1632, SGD: 1.7083, NZD: 2.0907 },
  EUR: { INR: 90.93, USD: 1.0861, GBP: 0.8597, AUD: 1.6493, CAD: 1.4789, SGD: 1.4680, NZD: 1.7975 },
  AUD: { INR: 55.17, USD: 0.6588, GBP: 0.5214, EUR: 0.6063, CAD: 0.8967, SGD: 0.8905, NZD: 1.0902 },
  CAD: { INR: 61.52, USD: 0.7347, GBP: 0.5815, EUR: 0.6762, AUD: 1.1151, SGD: 0.9930, NZD: 1.2157 },
};

const addSpread = (rate: number): number => Math.round(rate * 0.992 * 10000) / 10000;

router.get("/forex/rates", (req: Request, res: Response): void => {
  const { from = "INR", to } = req.query as { from?: string; to?: string };
  const fromRates = BASE_RATES[from.toUpperCase()];
  if (!fromRates) {
    res.status(400).json({ error: "Unsupported currency" });
    return;
  }

  if (to) {
    const rate = fromRates[to.toUpperCase()];
    if (!rate) {
      res.status(400).json({ error: "Unsupported target currency" });
      return;
    }
    res.json({ from: from.toUpperCase(), to: to.toUpperCase(), rate: addSpread(rate), timestamp: new Date().toISOString() });
    return;
  }

  const rates = Object.fromEntries(
    Object.entries(fromRates).map(([currency, rate]) => [currency, addSpread(rate)])
  );
  res.json({ from: from.toUpperCase(), rates, timestamp: new Date().toISOString() });
});

router.post("/forex/transactions", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.clerkUserId!;
  const { fromCurrency, toCurrency, fromAmount, purpose, recipientName, recipientBank, recipientAccount } = req.body as {
    fromCurrency: string;
    toCurrency: string;
    fromAmount: number;
    purpose?: string;
    recipientName?: string;
    recipientBank?: string;
    recipientAccount?: string;
  };

  const fromRates = BASE_RATES[fromCurrency.toUpperCase()];
  const rate = fromRates?.[toCurrency.toUpperCase()];
  if (!rate) {
    res.status(400).json({ error: "Unsupported currency pair" });
    return;
  }

  const appliedRate = addSpread(rate);
  const toAmount = Math.round(fromAmount * appliedRate * 100) / 100;

  const [tx] = await db
    .insert(forexTransactionsTable)
    .values({
      userId,
      fromCurrency: fromCurrency.toUpperCase(),
      toCurrency: toCurrency.toUpperCase(),
      fromAmount: Math.round(fromAmount * 100),
      toAmount: Math.round(toAmount * 100),
      rate: String(appliedRate),
      status: "processing",
      purpose,
      recipientName,
      recipientBank,
      recipientAccount,
    })
    .returning();

  setTimeout(async () => {
    await db.update(forexTransactionsTable).set({ status: "completed", updatedAt: new Date() }).where(eq(forexTransactionsTable.id, tx.id));
  }, 4000);

  res.status(201).json(tx);
});

router.get("/forex/transactions/me", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.clerkUserId!;
  const txs = await db
    .select()
    .from(forexTransactionsTable)
    .where(eq(forexTransactionsTable.userId, userId));
  res.json({ data: txs });
});

export default router;
