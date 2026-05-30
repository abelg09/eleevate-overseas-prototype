import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader, SectionHeader } from "@/components/common/page-shell";
import { cn } from "@/lib/utils";

const ledgerKpis = [
  { label: "ELLE funding gap", value: "$8k", detail: "Synced to Edu Loans", tone: "border-l-primary" },
  { label: "Confirmed funds", value: "$38k", detail: "Sponsor + savings", tone: "border-l-emerald-500" },
  { label: "Pending payouts", value: "$620", detail: "NBFC + forex margin", tone: "border-l-[#C67452]" },
  { label: "Visa evidence", value: "76%", detail: "Receipts + fund proof", tone: "border-l-[#F8B133]" },
];

const ledgerEvents = [
  {
    source: "ELLE Report",
    event: "Funding gap detected",
    studentView: "$8k gap shown on dashboard and ELLE report.",
    consultantView: "Finance task created for Jehan with sponsor proof required.",
    revenue: "Loan referral opportunity",
    status: "Live sync",
  },
  {
    source: "Edu Loans",
    event: "HDFC Credila application started",
    studentView: "Loan amount and university pre-filled from ELLE.",
    consultantView: "Pending payout line item generated automatically.",
    revenue: "NBFC Commission",
    status: "Processing",
  },
  {
    source: "Remittance",
    event: "Tuition deposit planned",
    studentView: "Payment milestone added to fee timeline.",
    consultantView: "Receipt reminder routed to document vault.",
    revenue: "Forex Margin",
    status: "Ready",
  },
  {
    source: "Forex Card",
    event: "Initial load recommendation",
    studentView: "Card load amount based on country budget.",
    consultantView: "Family spending controls and alerts prepared.",
    revenue: "Card Partner Fee",
    status: "Queued",
  },
  {
    source: "Insurance",
    event: "Visa-stage insurance package",
    studentView: "Insurance prompt appears after offer upload.",
    consultantView: "Post-offer checklist updated without manual entry.",
    revenue: "Insurance Commission",
    status: "Next",
  },
];

const financeModules = [
  { label: "Edu Loans", href: "/loans", detail: "Pre-filled from ELLE funding gap" },
  { label: "Remittance", href: "/remittance", detail: "Fee timeline and receipt evidence" },
  { label: "Forex Card", href: "/forex-card", detail: "Country-specific load plan" },
  { label: "Forex", href: "/forex", detail: "Rates and margin visibility" },
  { label: "Insurance", href: "/insurance", detail: "Visa-stage cover and partner revenue" },
];

export default function FinancialHubPage() {
  return (
    <div data-testid="financial-hub-page">
      <PageHeader
        eyebrow="Unified Ledger"
        title="Financial Hub"
        description="A single ledger that connects ELLE funding gaps, education loans, remittance, forex card, insurance, receipts, visa evidence, and consultant revenue events."
        actions={
          <>
            <Link href="/loans">
              <Button variant="outline" className="rounded-full font-serif">Open loans</Button>
            </Link>
            <Link href="/remittance">
              <Button className="rounded-full font-serif">Plan remittance</Button>
            </Link>
          </>
        }
      />

      <section className="route-ribbon-bg mb-5 rounded-lg border border-primary/20 p-5 shadow-sm">
        <div className="max-w-3xl">
          <Badge className="mb-4 rounded-full bg-secondary text-white hover:bg-secondary">Modules talking to each other</Badge>
          <h2 className="font-serif text-3xl font-bold leading-tight text-foreground">
            One student action should create the right finance, visa, document, and revenue event automatically.
          </h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            This is the investor-facing proof of the Unified Ledger: Jehan&apos;s $8k funding gap flows into a loan application, a consultant task, a pending commission line, and visa evidence without duplicate data entry.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        {ledgerKpis.map((kpi) => (
          <Card key={kpi.label} className={cn("app-card border-l-4 p-4", kpi.tone)}>
            <div className="text-xs font-semibold text-muted-foreground">{kpi.label}</div>
            <div className="mt-2 font-serif text-2xl font-bold text-foreground">{kpi.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{kpi.detail}</div>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="app-card p-4">
          <SectionHeader title="Ledger handshake timeline" description="Student-facing action on the left, consultant/revenue event on the right." />
          <div className="space-y-3">
            {ledgerEvents.map((item, index) => (
              <div key={item.event} className="rounded-lg border border-border bg-white p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-primary">Ledger event {index + 1}</div>
                    <div className="mt-1 font-serif text-base font-bold text-foreground">{item.event}</div>
                    <div className="mt-1 text-xs text-muted-foreground">Source: {item.source}</div>
                  </div>
                  <Badge variant="outline" className="w-fit rounded-full font-semibold">{item.status}</Badge>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-lg border border-border bg-muted/25 p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Student</div>
                    <p className="mt-1 text-xs leading-5 text-foreground">{item.studentView}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/25 p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Consultant</div>
                    <p className="mt-1 text-xs leading-5 text-foreground">{item.consultantView}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/25 p-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Revenue stream</div>
                    <p className="mt-1 text-xs font-semibold leading-5 text-foreground">{item.revenue}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <aside className="space-y-5">
          <Card className="app-card p-4">
            <SectionHeader title="Funding readiness" />
            <div className="space-y-4">
              {[
                { label: "Budget captured", value: 100 },
                { label: "Funds confirmed", value: 83 },
                { label: "Loan match ready", value: 72 },
                { label: "Visa evidence packet", value: 76 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{item.label}</span>
                    <span className="text-xs font-semibold text-muted-foreground">{item.value}%</span>
                  </div>
                  <Progress value={item.value} className="h-1.5" />
                </div>
              ))}
            </div>
          </Card>

          <Card className="app-card p-4">
            <SectionHeader title="Finance modules" description="Still available, now connected by the ledger." />
            <div className="space-y-2">
              {financeModules.map((module) => (
                <Link key={module.href} href={module.href}>
                  <div className="rounded-lg border border-border bg-muted/25 p-3 transition-colors hover:border-primary/30 hover:bg-primary/5">
                    <div className="font-serif text-sm font-bold text-foreground">{module.label}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{module.detail}</div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
