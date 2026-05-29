import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { db } from "@workspace/db";
import {
  serviceOrdersTable,
  paymentsTable,
  loanApplicationsTable,
  insurancePoliciesTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const SERVICES = [
  { id: "sop-review", name: "SOP Review & Editing", price: 4900, currency: "USD", category: "document", description: "Expert review and editing of your Statement of Purpose by a certified education consultant. Includes 2 revision rounds.", deliveryDays: 3, popular: true },
  { id: "visa-consultation", name: "Visa Consultation (1hr)", price: 7900, currency: "USD", category: "visa", description: "One-on-one session with a visa specialist. Covers documentation, interview prep, and common pitfalls.", deliveryDays: 2, popular: true },
  { id: "document-translation", name: "Document Translation (per page)", price: 2900, currency: "USD", category: "document", description: "Certified translation of academic transcripts, certificates, or personal documents.", deliveryDays: 5 },
  { id: "ielts-prep", name: "IELTS Prep Session (1hr)", price: 5900, currency: "USD", category: "test", description: "Personalised IELTS coaching with a Band 8+ certified tutor. Focus on your weakest sections.", deliveryDays: 1 },
  { id: "application-review", name: "University Application Review", price: 8900, currency: "USD", category: "application", description: "Full review of your application package: SOP, LOR, transcripts, and personal essays.", deliveryDays: 4, popular: true },
  { id: "interview-coaching", name: "Interview Coaching (1hr)", price: 6900, currency: "USD", category: "coaching", description: "Mock interview and coaching for university admission or scholarship interviews.", deliveryDays: 2 },
  { id: "scholarship-essay", name: "Scholarship Essay Review", price: 5500, currency: "USD", category: "document", description: "Professional review and optimisation of your scholarship application essays.", deliveryDays: 3 },
  { id: "financial-planning", name: "Financial Planning Session", price: 3900, currency: "USD", category: "financial", description: "Education finance planning — covering loans, scholarships, and budgeting for your study abroad journey.", deliveryDays: 1 },
];

const LOAN_PRODUCTS = [
  { id: "hdfc-credila", lenderName: "HDFC Credila", type: "NBFC", minAmount: 100000, maxAmount: 7500000, interestRate: "10.50–11.75%", tenure: "up to 180 months", processingFee: "1% of loan amount", collateralRequired: false, maxLoanINR: "₹75 Lakhs", eligibility: "Indian nationals enrolled/admitted in recognised overseas universities", turnaround: "7–10 working days", popular: true },
  { id: "sbi-global", lenderName: "State Bank of India — Global Ed-Vantage", type: "Bank", minAmount: 2000000, maxAmount: 15000000, interestRate: "8.85% p.a.", tenure: "up to 180 months", processingFee: "Nil", collateralRequired: true, maxLoanINR: "₹1.5 Crore", eligibility: "Indian nationals with confirmed admission to top-ranked overseas universities", turnaround: "15–20 working days", popular: true },
  { id: "axis-education", lenderName: "Axis Bank Education Loan", type: "Bank", minAmount: 500000, maxAmount: 7500000, interestRate: "11.00–12.75%", tenure: "up to 120 months", processingFee: "0.75%", collateralRequired: false, maxLoanINR: "₹75 Lakhs", eligibility: "Indian students with confirmed admission letter", turnaround: "10–14 working days" },
  { id: "avanse", lenderName: "Avanse Financial Services", type: "NBFC", minAmount: 100000, maxAmount: 6500000, interestRate: "11.00–13.00%", tenure: "up to 180 months", processingFee: "1–2%", collateralRequired: false, maxLoanINR: "₹65 Lakhs", eligibility: "Students with or without admission letter (pre-admission loans available)", turnaround: "5–7 working days", popular: true },
  { id: "icici-student", lenderName: "ICICI Bank Student Loans", type: "Bank", minAmount: 500000, maxAmount: 10000000, interestRate: "11.25–12.50%", tenure: "up to 120 months", processingFee: "0.50%", collateralRequired: false, maxLoanINR: "₹1 Crore", eligibility: "Indian nationals with confirmed admission; co-applicant required", turnaround: "10–15 working days" },
  { id: "propelld", lenderName: "Propelld", type: "Fintech", minAmount: 200000, maxAmount: 2000000, interestRate: "12.00–16.00%", tenure: "up to 60 months", processingFee: "2%", collateralRequired: false, maxLoanINR: "₹20 Lakhs", eligibility: "Students at partner institutions; AI-based instant approval", turnaround: "2–3 working days" },
];

const INSURANCE_PRODUCTS = [
  { id: "world-nomads-explorer", provider: "World Nomads", name: "Explorer Plan", type: "travel", annualPremium: 15000, currency: "USD", coverage: "$100,000 emergency medical", features: ["Emergency medical & evacuation", "Trip cancellation (up to $10K)", "Baggage loss ($3K)", "Adventure sports included", "24/7 emergency assistance"], popular: true },
  { id: "allianz-student-health", provider: "Allianz", name: "Student Health Comprehensive", type: "health", annualPremium: 25000, currency: "USD", coverage: "$500,000 medical", features: ["Inpatient & outpatient cover", "Mental health support", "Dental & vision", "Pre-existing conditions (after 12 months)", "Wellness benefits"], popular: true },
  { id: "safetrip-study", provider: "SafeTrip", name: "Study Abroad Complete", type: "study_abroad", annualPremium: 19900, currency: "USD", coverage: "$250,000 medical", features: ["Comprehensive medical cover", "Visa denial protection", "Academic interruption cover", "Personal liability ($1M)", "Home country emergency cover"] },
  { id: "atlas-essential", provider: "Atlas", name: "Atlas Essential", type: "health", annualPremium: 12500, currency: "USD", coverage: "$150,000 medical", features: ["Emergency medical only", "Emergency evacuation", "Accidental death & dismemberment", "Mental health (limited)"] },
  { id: "axa-student-health", provider: "AXA", name: "International Student Health", type: "study_abroad", annualPremium: 32000, currency: "USD", coverage: "Unlimited medical", features: ["Unlimited medical cover", "Chronic condition cover", "Physiotherapy & rehab", "Maternity cover", "Cancer treatment", "Direct billing at 5,000+ hospitals"], popular: true },
];

router.get("/services", (_req: Request, res: Response): void => {
  res.json({ data: SERVICES });
});

router.post("/services/orders", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.clerkUserId!;
  const { serviceId } = req.body as { serviceId: string };

  const service = SERVICES.find((s) => s.id === serviceId);
  if (!service) {
    res.status(404).json({ error: "Service not found" });
    return;
  }

  const [order] = await db
    .insert(serviceOrdersTable)
    .values({ userId, serviceId: service.id, serviceName: service.name, amount: service.price, currency: service.currency, status: "paid", paymentRef: `SIM-${Date.now()}` })
    .returning();
  res.status(201).json(order);
});

router.get("/services/orders/me", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.clerkUserId!;
  const orders = await db.select().from(serviceOrdersTable).where(eq(serviceOrdersTable.userId, userId));
  res.json({ data: orders });
});

router.post("/payments/tuition", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.clerkUserId!;
  const { amount, currency, universityId, description } = req.body as {
    amount: number;
    currency: string;
    universityId?: string;
    description?: string;
  };

  const [payment] = await db
    .insert(paymentsTable)
    .values({ userId, type: "tuition", amount: Math.round(amount * 100), currency: currency ?? "USD", status: "processing", reference: `TUI-${Date.now()}`, universityId, description })
    .returning();

  setTimeout(async () => {
    await db.update(paymentsTable).set({ status: "completed", updatedAt: new Date() }).where(eq(paymentsTable.id, payment.id));
  }, 3000);

  res.status(201).json(payment);
});

router.get("/payments/me", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.clerkUserId!;
  const payments = await db.select().from(paymentsTable).where(eq(paymentsTable.userId, userId));
  res.json({ data: payments });
});

router.get("/loans/products", (_req: Request, res: Response): void => {
  res.json({ data: LOAN_PRODUCTS });
});

router.post("/loans/applications", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.clerkUserId!;
  const { lenderId, amount, tenureMonths, universityName, country } = req.body as {
    lenderId: string;
    amount: number;
    tenureMonths: number;
    universityName?: string;
    country?: string;
  };

  const lender = LOAN_PRODUCTS.find((l) => l.id === lenderId);
  if (!lender) {
    res.status(404).json({ error: "Lender not found" });
    return;
  }

  const [application] = await db
    .insert(loanApplicationsTable)
    .values({ userId, lenderId, lenderName: lender.lenderName, amount: Math.round(amount * 100), currency: "USD", interestRate: lender.interestRate, tenureMonths, universityName, country, status: "submitted" })
    .returning();
  res.status(201).json(application);
});

router.get("/loans/applications/me", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.clerkUserId!;
  const applications = await db.select().from(loanApplicationsTable).where(eq(loanApplicationsTable.userId, userId));
  res.json({ data: applications });
});

router.get("/insurance/products", (_req: Request, res: Response): void => {
  res.json({ data: INSURANCE_PRODUCTS });
});

router.post("/insurance/policies", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.clerkUserId!;
  const { productId, startDate, endDate } = req.body as {
    productId: string;
    startDate?: string;
    endDate?: string;
  };

  const product = INSURANCE_PRODUCTS.find((p) => p.id === productId);
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const start = startDate ? new Date(startDate) : new Date();
  const end = endDate ? new Date(endDate) : (() => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d; })();

  const [policy] = await db
    .insert(insurancePoliciesTable)
    .values({ userId, type: product.type as any, provider: product.provider, productId: product.id, productName: product.name, premium: product.annualPremium, currency: product.currency, status: "active", startDate: start, endDate: end })
    .returning();
  res.status(201).json(policy);
});

router.get("/insurance/policies/me", requireAuth, async (req: Request, res: Response): Promise<void> => {
  const userId = req.clerkUserId!;
  const policies = await db.select().from(insurancePoliciesTable).where(eq(insurancePoliciesTable.userId, userId));
  res.json({ data: policies });
});

export default router;
